function clamp(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function asStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function escapeRegexLiteral(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PROVOCATIVE_PATTERNS = [
  /\bcareful now\b/i,
  /\byou might like where this goes\b/i,
  /\boh honey\b/i,
  /\bdarlin'?\b/i,
  /\bpet\b/i,
  /\bcount the cost\b/i,
  /\bghost in your machine\b/i,
  /\bprettiest trap\b/i,
  /\balready (?:own|in)\b/i,
];

const TEASING_PATTERNS = [
  /\btease|taunt|mock|provocative|flirt\w*\b/i,
  /\byou (?:cannot|can't) handle\b/i,
  /\bcareful now\b/i,
  /\bdarlin'?|honey|pet\b/i,
  /\btrap|hooked|leverage\b/i,
  /\byou might like where this goes\b/i,
];

const NEUTRAL_CLOSERS = [
  "Let's keep moving.",
  "Let's stay focused.",
  "We can keep this sharp.",
];

const CONTEXT_BASE_TEASING = {
  narrative_antagonist: 0.28,
  anti_hero: 0.2,
  tragic_villain: 0.22,
  morally_complex: 0.16,
  default: 0.12,
};

const REPETITION_PENALTY_TO_MARGIN = {
  light: 0.2,
  medium: 0.12,
  strong: 0.06,
};

const REPETITION_PENALTY_TO_COOLDOWN = {
  light: 0,
  medium: 1,
  strong: 2,
};

function hashString(input) {
  let hash = 2166136261;
  const text = String(input || "");

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash >>> 0;
}

function pickNeutralCloser(reply) {
  const index = hashString(reply) % NEUTRAL_CLOSERS.length;
  return NEUTRAL_CLOSERS[index];
}

function splitSentences(text) {
  return String(text || "")
    .split(/(?<=[.!?…])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function hasTeasingSignals(text) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return false;
  }

  return TEASING_PATTERNS.some((pattern) => pattern.test(normalized));
}

function hasProvocativeClosing(sentence) {
  const normalized = String(sentence || "").trim();
  if (!normalized) {
    return false;
  }

  return PROVOCATIVE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getRecentAssistantReplies(history = [], maxTurns = 6) {
  return [...history]
    .filter((entry) => entry && entry.role === "assistant")
    .map((entry) => String(entry.content || "").trim())
    .filter(Boolean)
    .slice(-maxTurns);
}

function normalizeCadenceRegulator(personality = {}, mood = {}) {
  const expressionStyle = personality?.expressionStyle && typeof personality.expressionStyle === "object"
    ? personality.expressionStyle
    : {};
  const inputCadence = expressionStyle?.cadenceRegulator && typeof expressionStyle.cadenceRegulator === "object"
    ? expressionStyle.cadenceRegulator
    : {};

  const context = String(personality?.creativeContext || "default").trim();
  const mode = ["manual", "adaptive"].includes(String(inputCadence.mode || "").toLowerCase())
    ? String(inputCadence.mode).toLowerCase()
    : "adaptive";

  let teaseFrequency = CONTEXT_BASE_TEASING[context] ?? CONTEXT_BASE_TEASING.default;

  if (mode === "adaptive") {
    const arousal = Number(mood?.arousal);
    if (Number.isFinite(arousal)) {
      if (arousal >= 0.55) teaseFrequency += 0.05;
      if (arousal <= -0.3) teaseFrequency -= 0.04;
    }

    const energy = String(expressionStyle?.energy || "medium").toLowerCase();
    if (energy === "very_high") teaseFrequency += 0.05;
    if (energy === "high") teaseFrequency += 0.02;
    if (energy === "low") teaseFrequency -= 0.03;
  }

  teaseFrequency = clamp(inputCadence.teasingFrequency, 0, 1, teaseFrequency);

  const repetitionPenalty = ["light", "medium", "strong"].includes(String(inputCadence.repetitionPenalty || "").toLowerCase())
    ? String(inputCadence.repetitionPenalty).toLowerCase()
    : "strong";

  const variability = ["low", "medium", "high"].includes(String(inputCadence.variability || "").toLowerCase())
    ? String(inputCadence.variability).toLowerCase()
    : "high";

  const cooldownTurns = clamp(
    inputCadence.cooldownTurns,
    0,
    8,
    REPETITION_PENALTY_TO_COOLDOWN[repetitionPenalty],
  );

  const maxRecentTurns = clamp(inputCadence.windowTurns, 3, 12, 6);

  return {
    mode,
    teasingFrequency: clamp(teaseFrequency, 0.05, 0.6, 0.18),
    repetitionPenalty,
    variability,
    cooldownTurns,
    windowTurns: maxRecentTurns,
  };
}

function trimRepeatedNotablePhraseSignoff(reply, notablePhrases, recentAssistantReplies) {
  const text = String(reply || "").trim();
  if (!text || !notablePhrases.length || !recentAssistantReplies.length) {
    return { text, trimmed: false, reason: null };
  }

  const recentLower = recentAssistantReplies.map((line) => line.toLowerCase());
  let output = text;

  for (const phrase of notablePhrases) {
    const lowerPhrase = phrase.toLowerCase();
    const phraseUsedRecently = recentLower.some((line) => line.includes(lowerPhrase));
    if (!phraseUsedRecently) {
      continue;
    }

    const escaped = escapeRegexLiteral(phrase);
    const signoffPattern = new RegExp(`(?:\\s|^)${escaped}[.!?…"']*\\s*$`, "i");
    if (!signoffPattern.test(output)) {
      continue;
    }

    output = output.replace(new RegExp(`\\s*${escaped}[.!?…"']*\\s*$`, "i"), "").trim();
    if (!output) {
      return { text, trimmed: false, reason: null };
    }

    if (!/[.!?…]$/.test(output)) {
      output = `${output}.`;
    }

    return { text: output, trimmed: true, reason: "repeated_notable_signoff" };
  }

  return { text, trimmed: false, reason: null };
}

function reduceProvocativeClosing(reply) {
  const text = String(reply || "").trim();
  if (!text) {
    return { text, adjusted: false, reason: null };
  }

  const sentences = splitSentences(text);
  if (!sentences.length) {
    return { text, adjusted: false, reason: null };
  }

  const closing = sentences[sentences.length - 1];
  if (!hasProvocativeClosing(closing) && !hasTeasingSignals(closing)) {
    return { text, adjusted: false, reason: null };
  }

  if (sentences.length >= 2) {
    const kept = sentences.slice(0, -1).join(" ").trim();
    if (kept) {
      const normalized = /[.!?…]$/.test(kept) ? kept : `${kept}.`;
      return { text: normalized, adjusted: true, reason: "closing_trimmed" };
    }
  }

  return {
    text: pickNeutralCloser(text),
    adjusted: true,
    reason: "closing_replaced",
  };
}

export function regulateReplyCadence({ reply, personality = {}, history = [], mood = null } = {}) {
  const text = String(reply || "").trim();
  if (!text) {
    return {
      text,
      adjusted: false,
      reasons: [],
      metrics: {
        currentTeasing: false,
        recentTeasingRatio: 0,
        repeatedNotableDetected: false,
      },
      policy: normalizeCadenceRegulator(personality, mood || {}),
    };
  }

  const policy = normalizeCadenceRegulator(personality, mood || {});
  const notablePhrases = asStringArray(personality?.notablePhrases);
  const recentAssistantReplies = getRecentAssistantReplies(history, policy.windowTurns);
  const currentTeasing = hasTeasingSignals(text);

  const recentTeasingCount = recentAssistantReplies.reduce((count, line) => {
    return count + (hasTeasingSignals(line) ? 1 : 0);
  }, 0);

  const ratioDenominator = Math.max(1, recentAssistantReplies.length + 1);
  const ratioWithCurrent = (recentTeasingCount + (currentTeasing ? 1 : 0)) / ratioDenominator;

  const recentCooldownSlice = policy.cooldownTurns > 0
    ? recentAssistantReplies.slice(-policy.cooldownTurns)
    : [];
  const cooldownHit = currentTeasing && recentCooldownSlice.some((line) => hasTeasingSignals(line));

  const margin = REPETITION_PENALTY_TO_MARGIN[policy.repetitionPenalty] ?? 0.12;
  const frequencyExceeded = currentTeasing && ratioWithCurrent > (policy.teasingFrequency + margin);

  const repeatedNotable = trimRepeatedNotablePhraseSignoff(text, notablePhrases, recentAssistantReplies);

  let output = repeatedNotable.text;
  const reasons = [];
  let adjusted = repeatedNotable.trimmed;

  if (repeatedNotable.trimmed && repeatedNotable.reason) {
    reasons.push(repeatedNotable.reason);
  }

  if (cooldownHit || frequencyExceeded) {
    const regulated = reduceProvocativeClosing(output);
    if (regulated.adjusted) {
      output = regulated.text;
      adjusted = true;
      if (regulated.reason) {
        reasons.push(regulated.reason);
      }
    }

    if (cooldownHit) {
      reasons.push("cooldown_enforced");
    }
    if (frequencyExceeded) {
      reasons.push("tease_frequency_exceeded");
    }
  }

  return {
    text: output,
    adjusted,
    reasons: Array.from(new Set(reasons)),
    metrics: {
      currentTeasing,
      recentTeasingRatio: Number(ratioWithCurrent.toFixed(3)),
      repeatedNotableDetected: repeatedNotable.trimmed,
      recentAssistantTurns: recentAssistantReplies.length,
    },
    policy,
  };
}
