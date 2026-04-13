// ---------------------------------------------------------------------------
// Persona Preferences Service
//
// Three responsibilities:
//   1. EXTRACT — use a lightweight LLM pass after each reply to detect any
//      preferences the persona revealed ("I hate small talk", "I love chaos").
//   2. MATCH — on each user turn, check whether the message touches any stored
//      preference and return a signed list of matches.
//   3. MOOD DELTA — convert match results into a VAD delta that is layered on
//      top of the social-signal delta inside the mood engine.
//   4. PROMPT — build the system-prompt sections that surface persona
//      preferences and known user emotional data to the LLM.
// ---------------------------------------------------------------------------

import { POSITIVE_PREF_TYPES, NEGATIVE_PREF_TYPES } from "../models/preferencesModel.js";
import { generateChatCompletion } from "./llmService.js";

// ---------------------------------------------------------------------------
// Lexical helpers (mirrored from userMemoryService for zero extra deps)
// ---------------------------------------------------------------------------

function tokenize(text) {
  return (
    String(text || "")
      .toLowerCase()
      .match(/[a-z0-9]{3,}/g) || []
  );
}

function tokenSet(text) {
  return new Set(tokenize(text));
}

// Dice-coefficient-like overlap: 2 * |A∩B| / (|A| + |B|)
function lexicalMatchScore(prefContent, message) {
  const prefTokens = tokenSet(prefContent);
  const msgTokens = tokenSet(message);
  if (prefTokens.size === 0 || msgTokens.size === 0) return 0;

  let overlap = 0;
  for (const t of prefTokens) {
    if (msgTokens.has(t)) overlap += 1;
  }
  return (2 * overlap) / (prefTokens.size + msgTokens.size);
}

// ---------------------------------------------------------------------------
// MATCH — returns {positive: [...prefs], negative: [...prefs]}
// A preference is included if the lexical score exceeds the threshold OR the
// content appears as a substring (for short, crisp triggers like "sarcasm").
// ---------------------------------------------------------------------------

const MATCH_THRESHOLD = 0.18;

export function matchPreferencesInMessage(preferences, message) {
  if (!Array.isArray(preferences) || !preferences.length || !message) {
    return { positive: [], negative: [], allMatches: [] };
  }

  const msgLower = String(message).toLowerCase();
  const positive = [];
  const negative = [];

  for (const pref of preferences) {
    const content = String(pref.content || "");
    if (!content) continue;

    const score = lexicalMatchScore(content, message);
    const substringHit = msgLower.includes(content.toLowerCase().slice(0, 40));
    if (score < MATCH_THRESHOLD && !substringHit) continue;

    const match = { ...pref, matchScore: score };
    if (POSITIVE_PREF_TYPES.has(pref.prefType)) {
      positive.push(match);
    } else if (NEGATIVE_PREF_TYPES.has(pref.prefType)) {
      negative.push(match);
    }
  }

  return { positive, negative, allMatches: [...positive, ...negative] };
}

// ---------------------------------------------------------------------------
// EXTRACTION GATE — decide whether a turn is worth running the LLM extraction
// pass on. Two independent signals; either one is sufficient.
//
// 1. Keyword gate  — explicit emotional language in user message OR assistant reply
// 2. VAD gate      — significant mood shift (strong valence swing or high arousal)
// ---------------------------------------------------------------------------

const STRONG_EMOTION_SIGNALS = [
  "i love",
  "i hate",
  "i really like",
  "i can't stand",
  "i cannot stand",
  "i enjoy",
  "i'm obsessed",
  "i am obsessed",
  "this annoys me",
  "this pisses me off",
  "this is amazing",
  "this is awful",
  "i adore",
  "i despise",
  "i loathe",
  "i find it",
  "gets me going",
  "drives me crazy",
  "makes me happy",
  "makes me angry",
  "i absolutely",
  "i genuinely",
  "i deeply",
];

/**
 * Returns true when there is strong enough emotional signal to justify an
 * LLM preference-extraction call. Combining a keyword pass with an optional
 * VAD delta check keeps token cost near-zero on neutral turns.
 *
 * @param {{ userMessage: string, assistantReply: string, moodDelta?: { valence: number, arousal: number } }} params
 */
export function shouldExtractPreferences({ userMessage, assistantReply, moodDelta = null }) {
  const combined = `${String(userMessage || "")} ${String(assistantReply || "")}`.toLowerCase();

  // Keyword gate — fast path, zero cost.
  if (STRONG_EMOTION_SIGNALS.some((signal) => combined.includes(signal))) return true;

  // VAD gate — if the caller provides the computed delta we can use it.
  if (moodDelta) {
    const valenceDelta = Math.abs(Number(moodDelta.valence  || 0));
    const arousalNow   = Number(moodDelta.arousal || 0);
    if (valenceDelta > 0.2 || arousalNow > 0.55) return true;
  }

  return false;
}

export function shouldExtractPreferencesWithCooldown({
  userMessage,
  assistantReply,
  moodDelta = null,
  lastExtractionAtMs = null,
  lastExtractionTurn = null,
  currentTurn = 0,
  nowMs = Date.now(),
  minIntervalMs = 45_000,
  minTurns = 3,
}) {
  const signalTriggered = shouldExtractPreferences({ userMessage, assistantReply, moodDelta });
  if (!signalTriggered) {
    return {
      shouldExtract: false,
      signalTriggered: false,
      reason: "no_emotional_signal",
      cooldownRemainingMs: 0,
      cooldownRemainingTurns: 0,
    };
  }

  const elapsedMs = Number.isFinite(Number(lastExtractionAtMs))
    ? Math.max(0, nowMs - Number(lastExtractionAtMs))
    : Number.POSITIVE_INFINITY;
  const turnsSince = Number.isFinite(Number(lastExtractionTurn))
    ? Math.max(0, Number(currentTurn) - Number(lastExtractionTurn))
    : Number.POSITIVE_INFINITY;

  const cooldownRemainingMs = Number.isFinite(elapsedMs)
    ? Math.max(0, Math.round(minIntervalMs - elapsedMs))
    : 0;
  const cooldownRemainingTurns = Number.isFinite(turnsSince)
    ? Math.max(0, Math.round(minTurns - turnsSince))
    : 0;

  if (cooldownRemainingMs > 0 || cooldownRemainingTurns > 0) {
    return {
      shouldExtract: false,
      signalTriggered: true,
      reason: cooldownRemainingMs > 0 ? "cooldown_ms" : "cooldown_turns",
      cooldownRemainingMs,
      cooldownRemainingTurns,
    };
  }

  return {
    shouldExtract: true,
    signalTriggered: true,
    reason: "allowed",
    cooldownRemainingMs: 0,
    cooldownRemainingTurns: 0,
  };
}

// ---------------------------------------------------------------------------
// VAD delta per preference type and archetype.
//
// Villainous + bratty archetypes get amplified negative reactions — they don't
// forgive their triggers, they escalate. Kind archetypes have softer negatives
// and stronger positives.
// ---------------------------------------------------------------------------

const BASE_DELTAS = {
  loves:    { valence:  0.30, arousal:  0.20, dominance:  0.05 },
  likes:    { valence:  0.16, arousal:  0.10, dominance:  0.03 },
  excites:  { valence:  0.18, arousal:  0.28, dominance:  0.08 },
  hates:    { valence: -0.32, arousal:  0.24, dominance:  0.14 },
  dislikes: { valence: -0.16, arousal:  0.12, dominance:  0.08 },
  annoys:   { valence: -0.10, arousal:  0.10, dominance:  0.06 },
  offends:  { valence: -0.30, arousal:  0.22, dominance:  0.16 },
  bores:    { valence: -0.07, arousal: -0.12, dominance: -0.04 },
};

// Archetype multipliers for negative hits.
const ARCHETYPE_NEG_MULTIPLIERS = {
  villainous: { valence: 1.35, arousal: 1.40, dominance: 1.50 },
  bratty:     { valence: 1.20, arousal: 1.30, dominance: 1.20 },
  kind:       { valence: 0.70, arousal: 0.60, dominance: 0.50 },
  default:    { valence: 1.00, arousal: 1.00, dominance: 1.00 },
};

function inferArchetype(personality = {}) {
  const creativeContext = String(personality?.creativeContext || "default").toLowerCase();
  const alignment = String(personality?.alignmentProfile?.alignment || "").toLowerCase();
  const corpus = [
    ...(Array.isArray(personality?.traits) ? personality.traits : []),
    ...(Array.isArray(personality?.quirks) ? personality.quirks : []),
    ...(Array.isArray(personality?.behaviorRules) ? personality.behaviorRules : []),
    String(personality?.speechStyle || ""),
    String(personality?.mood || ""),
  ]
    .join(" ")
    .toLowerCase();

  if (
    creativeContext === "narrative_antagonist" ||
    creativeContext === "tragic_villain" ||
    alignment.includes("evil") ||
    /\b(villain|ruthless|cruel|sadistic|domineering|cold|menace|antagonist)\b/.test(corpus)
  )
    return "villainous";

  if (
    /\b(brat|bratty|defiant|mischievous|chaotic|teasing|erratic|sarcastic|mocking)\b/.test(corpus) ||
    creativeContext === "morally_complex" ||
    creativeContext === "anti_hero"
  )
    return "bratty";

  if (
    alignment.includes("good") ||
    /\b(kind|warm|gentle|graceful|compassionate|caring|tender)\b/.test(corpus)
  )
    return "kind";

  return "default";
}

// ---------------------------------------------------------------------------
// Trait-level modifiers — applied AFTER archetype scaling for fine-grained
// personality nuance. Reads directly from the persona's traits/quirks arrays
// using keyword matching (traits can be phrases, not just single words).
// ---------------------------------------------------------------------------

const TRAIT_PATTERNS = [
  { pattern: /\bvolatile\b/,              field: "arousal",   mult: 1.45 },
  { pattern: /\bexplosive\b/,             field: "arousal",   mult: 1.40 },
  { pattern: /\bpassionate\b/,            field: "arousal",   mult: 1.25 },
  { pattern: /\bintense\b/,              field: "arousal",   mult: 1.20 },
  { pattern: /\bstoic\b/,                field: "arousal",   mult: 0.55 },
  { pattern: /\bimpassive\b/,             field: "arousal",   mult: 0.50 },
  { pattern: /\bmeasured\b/,             field: "arousal",   mult: 0.65 },
  { pattern: /\bcold\b/,                 field: "arousal",   mult: 0.60 },
  { pattern: /\bdominant\b/,             field: "dominance", add:  0.15 },
  { pattern: /\bcommanding\b/,           field: "dominance", add:  0.12 },
  { pattern: /\bassertive\b/,            field: "dominance", add:  0.10 },
  { pattern: /\bsubmissive\b/,           field: "dominance", add: -0.15 },
  { pattern: /\bempathetic|empathic\b/,  field: "valence",   mult: 1.20 },
  { pattern: /\bnarcissist\b/,           field: "dominance", add:  0.18 },
  { pattern: /\bchaotic\b/,              field: "arousal",   mult: 1.30 },
];

function applyTraitModifiers(delta, personality = {}) {
  const traitCorpus = [
    ...(Array.isArray(personality?.traits) ? personality.traits : []),
    ...(Array.isArray(personality?.quirks) ? personality.quirks : []),
  ]
    .join(" ")
    .toLowerCase();

  let { valence, arousal, dominance } = delta;

  for (const { pattern, field, mult, add } of TRAIT_PATTERNS) {
    if (!pattern.test(traitCorpus)) continue;
    if (field === "arousal")   { arousal    = arousal    * (mult ?? 1) + (add ?? 0); }
    if (field === "valence")   { valence    = valence    * (mult ?? 1) + (add ?? 0); }
    if (field === "dominance") { dominance  = dominance  * (mult ?? 1) + (add ?? 0); }
  }

  return { valence, arousal, dominance };
}

/**
 * Given matched preferences and the persona's archetype, compute the aggregate
 * VAD delta to layer on top of the social-signal result.
 *
 * @param {{positive: Array, negative: Array}} matches
 * @param {object} personality
 * @returns {{ valenceImpact: number, arousalImpact: number, dominanceImpact: number, triggered: Array }}
 */
export function computePreferenceMoodDelta(matches, personality = {}) {
  const archetype = inferArchetype(personality);
  const negMult = ARCHETYPE_NEG_MULTIPLIERS[archetype] || ARCHETYPE_NEG_MULTIPLIERS.default;

  let valence = 0;
  let arousal = 0;
  let dominance = 0;
  const triggered = [];

  for (const pref of matches.positive) {
    const base = BASE_DELTAS[pref.prefType] || BASE_DELTAS.likes;
    const weight = Math.min(1, (pref.importance || 7) / 10);
    valence   += base.valence   * weight;
    arousal   += base.arousal   * weight;
    dominance += base.dominance * weight;
    triggered.push({ prefType: pref.prefType, content: pref.content, direction: "positive" });
  }

  for (const pref of matches.negative) {
    const base = BASE_DELTAS[pref.prefType] || BASE_DELTAS.dislikes;
    const weight = Math.min(1, (pref.importance || 7) / 10);
    valence   += base.valence   * weight * negMult.valence;
    arousal   += base.arousal   * weight * negMult.arousal;
    dominance += base.dominance * weight * negMult.dominance;
    triggered.push({ prefType: pref.prefType, content: pref.content, direction: "negative" });
  }

  // Layer 2: apply trait-level modifiers on top of archetype scaling.
  const traitAdjusted = applyTraitModifiers({ valence, arousal, dominance }, personality);
  valence   = traitAdjusted.valence;
  arousal   = traitAdjusted.arousal;
  dominance = traitAdjusted.dominance;

  // Cap total delta per dimension so one turn can't teleport mood across the board.
  const cap = 0.45;
  return {
    valenceImpact:   Math.max(-cap, Math.min(cap, valence)),
    arousalImpact:   Math.max(-cap, Math.min(cap, arousal)),
    dominanceImpact: Math.max(-cap, Math.min(cap, dominance)),
    triggered,
    archetype,
  };
}

// ---------------------------------------------------------------------------
// PROMPT — build the EMOTIONAL PREFERENCES section for the system prompt.
// Groups prefs by sentiment bucket and lists the most important ones.
// ---------------------------------------------------------------------------

const PREF_LABELS = {
  loves:    "Things I genuinely love",
  likes:    "Things I enjoy/like",
  excites:  "Things that excite me",
  hates:    "Things I hate",
  dislikes: "Things I dislike",
  annoys:   "Things that annoy or irritate me",
  offends:  "Things that offend or disgust me",
  bores:    "Things I find boring",
};

export function buildPersonaPreferencesPromptSection(preferences) {
  if (!Array.isArray(preferences) || !preferences.length) return "";

  // Group by prefType, cap at 5 per bucket.
  const groups = {};
  for (const pref of preferences) {
    if (!groups[pref.prefType]) groups[pref.prefType] = [];
    if (groups[pref.prefType].length < 5) {
      groups[pref.prefType].push(pref.content);
    }
  }

  const lines = [];
  for (const [type, items] of Object.entries(groups)) {
    if (!items.length) continue;
    lines.push(`${PREF_LABELS[type] || type}: ${items.join("; ")}`);
  }

  if (!lines.length) return "";

  return [
    "== EMOTIONAL PREFERENCES & TRIGGERS ==",
    "These are my persistent emotional preferences. They MUST influence how I react.",
    "When the user touches something I love/like: let genuine warmth or excitement show.",
    "When the user hits something I hate/dislike/am annoyed by: react authentically in character — do NOT forgive it easily or flatten into neutral politeness.",
    ...lines,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// USER EMOTIONAL PROFILE — what the persona has learned about the user.
// Surfaces user_likes / user_dislikes / user_trigger_* memories specifically.
// ---------------------------------------------------------------------------

const USER_EMOTIONAL_TYPES = new Set([
  "user_likes",
  "user_dislikes",
  "user_trigger_positive",
  "user_trigger_negative",
  "preference",
]);

export function buildUserEmotionalProfileSection(userMemories) {
  if (!Array.isArray(userMemories) || !userMemories.length) return "";

  const emotional = userMemories.filter((m) => USER_EMOTIONAL_TYPES.has(m.memoryType));
  if (!emotional.length) return "";

  const positive = emotional.filter(
    (m) => m.memoryType === "user_likes" || m.memoryType === "user_trigger_positive" || m.memoryType === "preference",
  );
  const negative = emotional.filter(
    (m) => m.memoryType === "user_dislikes" || m.memoryType === "user_trigger_negative",
  );

  const lines = [];
  if (positive.length) {
    lines.push(`User responds positively to: ${positive.slice(0, 4).map((m) => m.content).join("; ")}`);
  }
  if (negative.length) {
    lines.push(`User dislikes / is triggered by: ${negative.slice(0, 4).map((m) => m.content).join("; ")}`);
  }

  if (!lines.length) return "";

  return [
    "== WHAT I KNOW ABOUT THIS USER ==",
    "Use this to tailor my interaction style. Don't mention these facts explicitly unless relevant.",
    ...lines,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// EXTRACT — fire after each reply to detect newly revealed persona preferences.
// Returns an array of {prefType, content, importance} objects.
// ---------------------------------------------------------------------------

const PREFERENCE_EXTRACTION_PROMPT = `You are analyzing a dialogue exchange to identify any EMOTIONAL PREFERENCES the persona revealed through their words, tone, or reactions.

Look for:
- Explicit statements: "I love X", "I hate Y", "X annoys me", "I find Z thrilling"
- Strong emotional reactions that imply preferences (e.g., lingering on a topic with delight → likes/loves; dismissing something with contempt → dislikes/hates)
- Things that clearly make the persona light up or get excited → 'excites' or 'loves'
- Things the persona complains about or reacts negatively to → 'annoys', 'dislikes', or 'hates'

Return a JSON array of at most 3 NEW preferences. Each item:
{ "prefType": "loves"|"likes"|"excites"|"hates"|"dislikes"|"annoys"|"offends"|"bores", "content": string (10-80 chars), "importance": 5-10 }

Return [] if no clear preferences were revealed. Be selective — only persist ones that feel genuinely characteristic.`;

export async function extractPersonaPreferencesFromConversation({
  personality,
  userMessage,
  assistantReply,
  existingPreferences = [],
}) {
  if (!assistantReply || !personality) return [];

  const existingPreview =
    existingPreferences
      .slice(0, 15)
      .map((p) => `[${p.prefType}] ${p.content}`)
      .join("; ") || "none";

  const conversation =
    `User: ${String(userMessage || "").slice(0, 300)}\n` +
    `${personality.name}: ${String(assistantReply || "").slice(0, 500)}`;

  const prompt =
    `Persona: ${personality.name}\n` +
    `Already known preferences: ${existingPreview}\n\n` +
    `Dialogue:\n${conversation}\n\n` +
    PREFERENCE_EXTRACTION_PROMPT;

  try {
    const responseText = await generateChatCompletion([
      {
        role: "system",
        content:
          "You extract emotional preferences from dialogue. Respond with a JSON array only. No explanations.",
      },
      { role: "user", content: prompt },
    ]);

    const match = responseText.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];

    const validTypes = new Set([
      "loves", "likes", "excites", "hates", "dislikes", "annoys", "offends", "bores",
    ]);

    return parsed
      .filter((item) => item && typeof item.content === "string" && item.content.trim())
      .filter((item) => validTypes.has(item.prefType))
      .map((item) => ({
        prefType: item.prefType,
        content: String(item.content).trim().slice(0, 200),
        importance: Math.min(10, Math.max(5, Number(item.importance) || 7)),
      }))
      .slice(0, 3);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// EXTRACT user emotional preferences FROM user message.
// Extended version that pulls out likes, dislikes, and triggers beyond the
// simple pattern matching in userMemoryService.
// ---------------------------------------------------------------------------

export function extractUserEmotionalPreferences(message) {
  const text = String(message || "").trim();
  if (!text) return [];

  const lower = text.toLowerCase();
  const candidates = [];

  // Positive triggers
  const loveMatch = text.match(
    /\bi\s+(?:absolutely\s+)?(?:love|adore|obsess\s+over|am\s+obsessed\s+with|am\s+crazy\s+about)\s+(.+?)(?:[.!?]|$)/i,
  );
  if (loveMatch?.[1]) {
    candidates.push({
      memoryType: "user_likes",
      content: `User loves ${loveMatch[1].trim().slice(0, 120)}`,
      importance: 9,
    });
  }

  const likeMatch = text.match(
    /\bi\s+(?:really\s+)?(?:like|enjoy|dig|appreciate)\s+(.+?)(?:[.!?]|$)/i,
  );
  if (likeMatch?.[1] && !loveMatch) {
    candidates.push({
      memoryType: "user_likes",
      content: `User likes ${likeMatch[1].trim().slice(0, 120)}`,
      importance: 7,
    });
  }

  // Things that excite them
  const exciteMatch = text.match(
    /\b(?:(.+?)\s+(?:excites|thrills|fascinates|gets me hype|pumps me up))\b/i,
  );
  if (exciteMatch?.[1]) {
    candidates.push({
      memoryType: "user_trigger_positive",
      content: `User gets excited about ${exciteMatch[1].trim().slice(0, 120)}`,
      importance: 8,
    });
  }

  // Negative triggers
  const hateMatch = text.match(
    /\bi\s+(?:absolutely\s+)?(?:hate|despise|loathe|can't stand|detest)\s+(.+?)(?:[.!?]|$)/i,
  );
  if (hateMatch?.[1]) {
    candidates.push({
      memoryType: "user_dislikes",
      content: `User hates ${hateMatch[1].trim().slice(0, 120)}`,
      importance: 9,
    });
  }

  const annoyMatch = text.match(
    /\b(?:(.+?)\s+(?:annoys|irritates|bothers|pisses me off|drives me crazy))\b/i,
  );
  if (annoyMatch?.[1]) {
    candidates.push({
      memoryType: "user_trigger_negative",
      content: `User is annoyed by ${annoyMatch[1].trim().slice(0, 120)}`,
      importance: 8,
    });
  }

  const dislikeMatch = text.match(
    /\bi\s+(?:do\s+not|don't)\s+(?:like|enjoy|appreciate)\s+(.+?)(?:[.!?]|$)/i,
  );
  if (dislikeMatch?.[1] && !hateMatch) {
    candidates.push({
      memoryType: "user_dislikes",
      content: `User dislikes ${dislikeMatch[1].trim().slice(0, 120)}`,
      importance: 7,
    });
  }

  // "X makes me [feel/happy/angry/etc.]"
  const makesHappyMatch = text.match(/\b(.+?)\s+makes?\s+me\s+(?:happy|smile|laugh|excited|feel\s+good)/i);
  if (makesHappyMatch?.[1]) {
    candidates.push({
      memoryType: "user_trigger_positive",
      content: `${makesHappyMatch[1].trim().slice(0, 120)} makes user happy`,
      importance: 8,
    });
  }

  const makesAngryMatch = text.match(
    /\b(.+?)\s+makes?\s+me\s+(?:angry|upset|mad|uncomfortable|anxious|annoyed)/i,
  );
  if (makesAngryMatch?.[1]) {
    candidates.push({
      memoryType: "user_trigger_negative",
      content: `${makesAngryMatch[1].trim().slice(0, 120)} upsets user`,
      importance: 8,
    });
  }

  return candidates.slice(0, 3).map((c) => ({
    ...c,
    content: c.content.replace(/\s+/g, " ").trim(),
  }));
}
