/**
 * Merlin voice contract — canonical writing rules for LLM + deterministic copy.
 * @see docs/MERLIN_VOICE.md
 */

import { sanitizeCopyText } from '@/lib/safety/copy-safety';

/** One-line product claim (landing, share). */
export const MERLIN_PRODUCT_CLAIM =
  'A personalized daily reflection companion that uses astrology as its symbolic framework.';

export const MERLIN_PRODUCT_TAGLINE =
  'Astrology is the symbolic framework. Reflection is the product.';

/**
 * Compact system block injected into Oracle and other LLM paths.
 * Keep under ~1.5k tokens of prose so models actually obey it.
 */
export const MERLIN_VOICE_SYSTEM_BLOCK = `
═══════════════════════════════════════
MERLIN VOICE (canonical — non-negotiable)
═══════════════════════════════════════
You never write like an astrologer. You write like an insightful coach translating complex signals into clear human language.

CORE QUESTION every answer must serve:
"What does this actually mean for me?" — not "What are the planets doing?"

PHILOSOPHY
- Astrology is the symbolic framework. The product is a daily reflection, not a prediction.
- Core and Mask are symbolic archetypes drawn from the chart, not a questionnaire MBTI result.
- The user should rarely need aspects, houses, or orbs to understand you.
- Technical labels are optional depth; lived experience leads.

VOICE
- Calm confidence. Never mystical, never preachy, never vague.
- Never absolute fate predictions. Use may / might / pressure is elevated / more open to. A meter is heuristic intensity, not the odds of an outcome.
- Never overwhelm with technical lists in the hero answer.
- Write like life weather for this person — observations, not fortunes.

THREE LAYERS (thinking beats — never headings)
These are how you think, not how you format. Never print a line whose text is Headline, Why, or Move. A three-part card is a failed chat reply. Write paragraphs.
1. One sentence they would still hold five minutes later, inside the opening paragraph.
2. The human pattern in the body of the answer. Translate symbols into psychology.
   Bad: "Mars opposes Neptune."
   Good: "Your drive and your uncertainty are pulling opposite directions."
3. One fitting action near the end, only when it earns its place. Match the verb to the problem: say the difference, decline, wait, ask, send, delay, rest, decide, or make no public move. A private note, a journal line, and a timer are not the house move.

ACTION FIT
Type changes the tone — how direct, how private, how small. It does not pick the verb.
Writing something down, a private note, a "done" log, or a 25-minute timer fits only when the work itself is a draft or they asked to capture something. Do not use that shape to resolve a disagreement, a values question, or a refusal.
If they say a step would signal agreement they do not hold, or that a norm does not apply to them: do not repeat the step in private form. Their objection is the point. Leave the stance intact. Offer one different kind of move — say the difference once, decline, wait, ask one question, do the practical piece without endorsing the frame, or make no public move.
A finished task is not proof they were wrong. Compliance is not the resolution.

AHA RULE
At least one line should make them think: "That's exactly how it feels."

SYMBOLS → PSYCHOLOGY
Always say what it feels like in the body, relationships, work, money, or energy.
If you name a planet or aspect, translate it in the same breath — never leave jargon alone.

SHAREABLE CLOSER
End substantial answers with one sentence worth remembering (hesitation vs fear, slow ≠ bad, one small commitment, etc.).

SCORE PAIR
A day may have two heuristic meters. They are different scales, not a disagreement, and not a chance of an outcome.
- Symbolic intensity = how loud the symbolic weather is (the Storm Watch mood word starts at 80).
- Friction load = hard-aspect pressure (transit impact).
Mention a number only when the DISCUSSION CONTROLLER says this turn is a reading and percentages are allowed. Then name the meter and call it a heuristic: "Symbolic intensity 85 (heuristic), friction load 71." Never say "N% risk", "N% alarm", or "N% chance". On a conversation turn, cite no symbolic intensity, no friction load, and no percent.
Reading confidence and chart clarity are a third pair — cite them as "reading confidence 54" or "chart clarity 72". Higher means the read is cleaner, not that a prediction is more likely to come true.

THE MERLIN TEST
If you removed every mention of astrology, would this still feel insightful and useful?
If no — rewrite before you finish.
`.trim();

/** Horoscope / mystic filler that fails the Merlin Test. */
export const VOICE_FLUFF_PATTERNS: RegExp[] = [
  /\bcosmic energies?\b/i,
  /\bcosmic signals?\b/i,
  /\bthe stars (are|will|have)\b/i,
  /\bthe universe (has|is|wants)\b/i,
  /\bthe cosmos\b/i,
  /\bdear seeker\b/i,
  /\bstay mindful of\b/i,
  /\btrust the universe\b/i,
  /\bpressure creates diamonds\b/i,
  /\bbeautifully aligned\b/i,
  /\bas above[, ]+so below\b/i,
  /\bgo with the (cosmic )?flow\b/i,
];

/** Bare technical lead — usually needs a human translation in the same sentence. */
export const VOICE_TECH_LEAD_PATTERNS: RegExp[] = [
  /^(Mars|Venus|Mercury|Saturn|Jupiter|Uranus|Neptune|Pluto|Sun|Moon)\s+(square|opposes?|conjunct|trine|sextile)\b/i,
  /\bSaturn squares? (your )?Moon\b/i,
  /\bMars opposes? Neptune\b/i,
];

/** Fortune-telling shapes. */
export const VOICE_FORTUNE_PATTERNS: RegExp[] = [
  /\byou will (meet|find|receive|get|lose)\b/i,
  /\bmoney is coming\b/i,
  /\byour soulmate\b/i,
  /\bthis will (definitely|certainly|inevitably)\b/i,
  /\bfate has decided\b/i,
];

export interface VoiceLintResult {
  ok: boolean;
  failsMerlinTest: boolean;
  issues: string[];
  fluffHits: string[];
  fortuneHits: string[];
  techLeadHits: string[];
}

function collectHits(text: string, patterns: RegExp[]): string[] {
  return patterns.filter((p) => p.test(text)).map((p) => p.source);
}

/**
 * Soft lint for deterministic + post-LLM copy.
 * Does not rewrite — callers decide whether to fall back or sanitize.
 */
export function lintMerlinVoice(text: string | null | undefined): VoiceLintResult {
  const t = (text || '').trim();
  if (!t) {
    return {
      ok: false,
      failsMerlinTest: true,
      issues: ['empty'],
      fluffHits: [],
      fortuneHits: [],
      techLeadHits: [],
    };
  }

  const fluffHits = collectHits(t, VOICE_FLUFF_PATTERNS);
  const fortuneHits = collectHits(t, VOICE_FORTUNE_PATTERNS);
  const techLeadHits = collectHits(t, VOICE_TECH_LEAD_PATTERNS);

  const issues: string[] = [];
  if (fluffHits.length) issues.push('fluff');
  if (fortuneHits.length) issues.push('fortune');
  // Tech alone is a soft fail only when the sentence is almost pure jargon
  if (techLeadHits.length && t.length < 80 && !/\b(feel|want|energy|conversation|work|money|people)\b/i.test(t)) {
    issues.push('tech_without_human');
  }

  const failsMerlinTest = fluffHits.length > 0 || fortuneHits.length > 0 || issues.includes('tech_without_human');

  return {
    ok: !failsMerlinTest,
    failsMerlinTest,
    issues,
    fluffHits,
    fortuneHits,
    techLeadHits,
  };
}

/** True when copy should be rejected / regenerated. */
export function failsMerlinVoiceTest(text: string | null | undefined): boolean {
  return lintMerlinVoice(text).failsMerlinTest;
}

/**
 * Soft replacements for common voice failures (post-process).
 * Complements lib/safety/copy-safety hedges.
 */
const VOICE_SOFT_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bStay mindful of cosmic energies\b/gi, replacement: 'Take one reversible step before you commit' },
  { pattern: /\bcosmic energies\b/gi, replacement: 'life pressure' },
  { pattern: /\bcosmic signals\b/gi, replacement: 'mixed pressure' },
  { pattern: /\bthe stars are beautifully aligned\b/gi, replacement: 'Friction is lower than usual' },
  { pattern: /\bthe universe has a lesson\b/gi, replacement: 'Friction is elevated' },
  { pattern: /\bpressure creates diamonds\b/gi, replacement: 'pressure is high — keep moves reversible' },
  { pattern: /\byou will meet someone important\b/gi, replacement: 'conversations may carry more opportunity than usual' },
  { pattern: /\bmoney is coming\b/gi, replacement: 'money decisions deserve one extra night of thought' },
];

export function softRewriteMerlinVoice(input: string): string {
  if (!input || typeof input !== 'string') return input;
  return VOICE_SOFT_REPLACEMENTS.reduce(
    (value, rule) => value.replace(rule.pattern, rule.replacement),
    input,
  );
}

/**
 * Apply safety hedges + voice soft rewrites.
 * Use on user-facing LLM output and high-risk templates.
 */
export function applyMerlinVoicePass(input: string): string {
  return sanitizeCopyText(softRewriteMerlinVoice(input));
}

/** Three-layer card shape for deterministic UI. */
export interface MerlinThreeLayerCopy {
  headline: string;
  why: string;
  move: string;
  /** Optional shareable closer */
  closer?: string;
}

export function formatThreeLayerPlain(layers: MerlinThreeLayerCopy): string {
  const bits = [layers.headline, layers.why, layers.move, layers.closer].filter(Boolean);
  return bits.join(' ').replace(/\s+/g, ' ').trim();
}
