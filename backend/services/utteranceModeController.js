const VALID_MODES = new Set(["kids", "normal", "scientist"]);
const DEFAULT_MIN_CONFIDENCE = 0.65;
const DEFAULT_SWITCH_COOLDOWN_TURNS = 3;

// Conversation-scoped mode memory so adaptive switching does not flap every turn.
const modeMemoryByConversation = new Map();

function clamp01(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, n));
}

function normalizeMode(value, fallback = "normal") {
  const mode = String(value || fallback).trim().toLowerCase();
  return VALID_MODES.has(mode) ? mode : fallback;
}

function toBoolEnv(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function resolveControllerConfig(policy) {
  const strategyRaw = String(process.env.UTTERANCE_MODE_STRATEGY || "fixed").trim().toLowerCase();
  const strategy = strategyRaw === "adaptive" ? "adaptive" : "fixed";

  const envDefaultMode = normalizeMode(
    process.env.UTTERANCE_MODE_DEFAULT,
    normalizeMode(policy?.activeMode, "normal"),
  );

  const allowKids = toBoolEnv(process.env.UTTERANCE_MODE_ALLOW_KIDS, false);
  const allowNormal = toBoolEnv(process.env.UTTERANCE_MODE_ALLOW_NORMAL, true);
  const allowScientist = toBoolEnv(process.env.UTTERANCE_MODE_ALLOW_SCIENTIST, true);
  const minConfidence = clamp01(
    process.env.UTTERANCE_MODE_MIN_CONFIDENCE,
    DEFAULT_MIN_CONFIDENCE,
  );

  const parsedCooldown = Number(process.env.UTTERANCE_MODE_SWITCH_COOLDOWN_TURNS);
  const cooldownTurns = Number.isFinite(parsedCooldown)
    ? Math.max(0, Math.round(parsedCooldown))
    : DEFAULT_SWITCH_COOLDOWN_TURNS;

  return {
    strategy,
    defaultMode: envDefaultMode,
    allowKids,
    allowNormal,
    allowScientist,
    minConfidence,
    cooldownTurns,
  };
}

function resolveAllowedModes(policy, config) {
  const ageBand = String(policy?.ageBand || "adult").trim().toLowerCase();
  const modeAccepted = Boolean(policy?.modeAccepted);
  const activeMode = normalizeMode(policy?.activeMode, "normal");

  let baseAllowed = ["kids", "normal", "scientist"];
  if (ageBand === "child") {
    baseAllowed = ["kids"];
  } else if (ageBand === "teen") {
    // Conservative teen fallback: if the policy resolver restricted the mode,
    // do not unlock advanced modes here.
    baseAllowed = activeMode === "kids" && !modeAccepted
      ? ["kids"]
      : ["kids", "normal", "scientist"];
  }

  const byEnv = baseAllowed.filter((mode) => {
    if (mode === "kids") return config.allowKids;
    if (mode === "normal") return config.allowNormal;
    if (mode === "scientist") return config.allowScientist;
    return false;
  });

  // Never accidentally remove the currently active policy mode.
  const effective = new Set(byEnv);
  effective.add(activeMode);
  return Array.from(effective);
}

function computeUsageRatio(usage) {
  const directRatio = Number(usage?.percentUsed);
  if (Number.isFinite(directRatio) && directRatio >= 0) {
    return clamp01(directRatio, 0);
  }

  const total = Number(usage?.totalTokens);
  const max = Number(usage?.maxTokens);
  if (Number.isFinite(total) && Number.isFinite(max) && max > 0) {
    return clamp01(total / max, 0);
  }

  return 0;
}

function countMatches(text, regex) {
  if (!text) return 0;
  const matches = String(text).match(regex);
  return Array.isArray(matches) ? matches.length : 0;
}

function scoreModeSignals({ message, reply, stateRuntime, usage, rateLimit, isLiveCall }) {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();
  const replyText = String(reply || "").trim();

  const scientistCueCount = countMatches(
    lower,
    /\b(why|how|analy[sz]e|explain|evidence|source|cit(e|ation)|derive|compare|trade[-\s]?off|model|hypothesis|benchmark|probability|mechanism)\b/g,
  );
  const casualCueCount = countMatches(
    lower,
    /\b(hi|hello|hey|yo|thanks|thank you|cool|nice|lol|lmao|sup|what'?s up|wyd|quick question|real quick)\b/g,
  );
  const questionCount = countMatches(text, /\?/g);
  const replyStructured = /\b(1\)|1\.|answer\s*:|evidence\s*:|uncertainty\s*:|next questions\s*:)/i.test(replyText);

  const stabilityIndex = clamp01(stateRuntime?.stabilityIndex, 1);
  const fragmentation = clamp01(stateRuntime?.directives?.fragmentation, 0);
  const interruptions = clamp01(stateRuntime?.directives?.interruptions, 0);
  const usageRatio = computeUsageRatio(usage);
  const rateLimitHit = Boolean(rateLimit?.hit);
  const rateLimitFallback = Boolean(rateLimit?.fallbackDelivered || rateLimit?.retryAttempted);

  // Live-call context: conversational flow trumps structured output.
  // Spoken transcripts are short, informal, and demand low-latency replies.
  // We bias heavily toward normal mode and require strong explicit analytical
  // signals (multiple distinct keywords + structured reply) before allowing
  // a scientist switch.
  const liveCall = Boolean(isLiveCall);

  let scientistScore = 0;
  let normalScore = 0;

  if (liveCall) {
    // Dampen analytical signals — short speech fragments often contain
    // incidental cue words that don't signal a research request.
    scientistScore += Math.min(0.2, scientistCueCount * 0.04);
    // Only reward scientist if the message is unusually long for spoken input
    // AND multiple distinct analytical keywords appear.
    scientistScore += text.length >= 200 && scientistCueCount >= 3 ? 0.1 : 0;
    scientistScore += replyStructured ? 0.06 : 0;
    // questions alone are not a strong signal during live call
    // ("how are you?" is casual, not analytical)
    scientistScore += questionCount >= 2 ? 0.04 : 0;

    // Live call baseline: prefer normal mode by default.
    normalScore += 0.35;
    normalScore += Math.min(0.25, casualCueCount * 0.1);
    // Short spoken messages are almost always conversational.
    normalScore += text.length < 80 ? 0.12 : text.length < 160 ? 0.06 : 0;
    normalScore += stabilityIndex < 0.45 ? 0.12 : stabilityIndex < 0.6 ? 0.06 : 0;
    normalScore += fragmentation + interruptions > 1.0 ? 0.1 : 0;
    normalScore += usageRatio > 0.88 ? 0.1 : usageRatio > 0.75 ? 0.05 : 0;
    normalScore += rateLimitHit || rateLimitFallback ? 0.15 : 0;
  } else {
    scientistScore += Math.min(0.45, scientistCueCount * 0.08);
    scientistScore += Math.min(0.15, questionCount * 0.05);
    scientistScore += text.length >= 220 ? 0.12 : text.length >= 120 ? 0.06 : 0;
    scientistScore += replyStructured ? 0.08 : 0;

    normalScore += Math.min(0.4, casualCueCount * 0.1);
    normalScore += stabilityIndex < 0.45 ? 0.18 : stabilityIndex < 0.6 ? 0.08 : 0;
    normalScore += fragmentation + interruptions > 1.0 ? 0.15 : 0;
    normalScore += usageRatio > 0.88 ? 0.12 : usageRatio > 0.75 ? 0.06 : 0;
    normalScore += rateLimitHit || rateLimitFallback ? 0.2 : 0;
  }

  const diff = Math.abs(scientistScore - normalScore);
  // During live call raise the confidence bar so a stray analytical word
  // cannot flip the mode; require a clearer signal to overcome the normal bias.
  const confidenceBase = liveCall ? 0.35 : 0.5;
  const confidence = clamp01(confidenceBase + diff);

  return {
    scores: {
      scientist: Number(scientistScore.toFixed(3)),
      normal: Number(normalScore.toFixed(3)),
      kids: 0,
    },
    confidence: Number(confidence.toFixed(3)),
    metrics: {
      stabilityIndex: Number(stabilityIndex.toFixed(3)),
      fragmentation: Number(fragmentation.toFixed(3)),
      interruptions: Number(interruptions.toFixed(3)),
      usageRatio: Number(usageRatio.toFixed(3)),
      rateLimitHit,
      rateLimitFallback,
      scientistCueCount,
      casualCueCount,
      questionCount,
      replyStructured,
    },
  };
}

function selectHighestAllowedMode(scores, allowedModes, fallbackMode) {
  const candidates = allowedModes.filter((mode) => mode !== "kids");
  if (candidates.length === 0) {
    return fallbackMode;
  }

  let bestMode = fallbackMode;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const mode of candidates) {
    const score = Number(scores?.[mode]);
    const normalizedScore = Number.isFinite(score) ? score : 0;
    if (normalizedScore > bestScore) {
      bestScore = normalizedScore;
      bestMode = mode;
    }
  }
  return bestMode;
}

export function resolveAdaptiveUtteranceMode({
  policy,
  message,
  reply,
  isLiveCall,
  stateRuntime,
  usage,
  rateLimit,
  conversationKey,
  turnCount,
} = {}) {
  const safePolicy = policy && typeof policy === "object" ? policy : {};
  const config = resolveControllerConfig(safePolicy);
  const policyMode = normalizeMode(safePolicy.activeMode, "normal");
  const allowedModes = resolveAllowedModes(safePolicy, config);
  const defaultMode = allowedModes.includes(config.defaultMode)
    ? config.defaultMode
    : allowedModes.includes(policyMode)
      ? policyMode
      : normalizeMode(allowedModes[0], "normal");

  // Explicit requests and session locks always win over adaptive switching.
  if (Boolean(safePolicy.modeRequested)) {
    return {
      mode: policyMode,
      strategy: config.strategy,
      switched: false,
      confidence: 1,
      reason: "requested_mode_locked",
      scores: { kids: 0, normal: 0, scientist: 0 },
      allowedModes,
      metrics: null,
    };
  }

  if (String(safePolicy.modeReason || "") === "session_mode_locked") {
    return {
      mode: policyMode,
      strategy: config.strategy,
      switched: false,
      confidence: 1,
      reason: "session_mode_locked",
      scores: { kids: 0, normal: 0, scientist: 0 },
      allowedModes,
      metrics: null,
    };
  }

  if (policyMode === "kids") {
    return {
      mode: "kids",
      strategy: config.strategy,
      switched: false,
      confidence: 1,
      reason: "kids_policy_enforced",
      scores: { kids: 1, normal: 0, scientist: 0 },
      allowedModes,
      metrics: null,
    };
  }

  if (config.strategy !== "adaptive") {
    const fixedMode = allowedModes.includes(defaultMode) ? defaultMode : policyMode;
    return {
      mode: fixedMode,
      strategy: config.strategy,
      switched: fixedMode !== policyMode,
      confidence: 1,
      reason: "fixed_strategy",
      scores: { kids: 0, normal: 0, scientist: 0 },
      allowedModes,
      metrics: null,
      config: {
        minConfidence: config.minConfidence,
        cooldownTurns: config.cooldownTurns,
        defaultMode,
      },
    };
  }

  const liveCallActive = Boolean(isLiveCall);

  // During live call, raise the minimum confidence required to switch away from
  // normal mode — spoken conversation should stay fluid unless the user
  // explicitly requests analytical output.
  const effectiveMinConfidence = liveCallActive
    ? Math.max(config.minConfidence, 0.82)
    : config.minConfidence;

  // During live call also extend the cooldown so mode doesn't flap across
  // short spoken turns.
  const effectiveCooldownTurns = liveCallActive
    ? Math.max(config.cooldownTurns, 5)
    : config.cooldownTurns;

  const signal = scoreModeSignals({ message, reply, stateRuntime, usage, rateLimit, isLiveCall: liveCallActive });
  const candidateMode = selectHighestAllowedMode(signal.scores, allowedModes, policyMode);

  let chosenMode = candidateMode;
  let reason = "adaptive_signal_match";

  if (signal.confidence < effectiveMinConfidence) {
    chosenMode = liveCallActive ? "normal" : policyMode;
    reason = "confidence_below_threshold";
  }

  const key = String(conversationKey || "global");
  const normalizedTurnCount = Number.isFinite(Number(turnCount)) ? Number(turnCount) : 0;
  const previous = modeMemoryByConversation.get(key);

  if (
    previous &&
    previous.mode !== chosenMode &&
    normalizedTurnCount - previous.turn < effectiveCooldownTurns
  ) {
    chosenMode = previous.mode;
    reason = "cooldown_hold";
  }

  modeMemoryByConversation.set(key, {
    mode: chosenMode,
    turn: normalizedTurnCount,
  });

  return {
    mode: chosenMode,
    strategy: config.strategy,
    switched: chosenMode !== policyMode,
    confidence: signal.confidence,
    reason,
    scores: signal.scores,
    allowedModes,
    metrics: signal.metrics,
    config: {
      minConfidence: config.minConfidence,
      cooldownTurns: config.cooldownTurns,
      defaultMode,
      isLiveCall: liveCallActive,
      effectiveMinConfidence,
      effectiveCooldownTurns,
    },
  };
}

export function resetAdaptiveUtteranceModeMemory() {
  modeMemoryByConversation.clear();
}
