function clamp01(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, n));
}

function normalizeKeywords(input) {
  if (!Array.isArray(input)) {
    return ["drink", "drunk", "alcohol", "whiskey", "vodka", "beer", "wine", "buzzed"];
  }

  const normalized = Array.from(
    new Set(
      input
        .map((entry) => String(entry || "").trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 20);

  return normalized.length
    ? normalized
    : ["drink", "drunk", "alcohol", "whiskey", "vodka", "beer", "wine", "buzzed"];
}

export function normalizeStateFlaws(input) {
  const root = input && typeof input === "object" ? input : {};
  const intoxication = root.intoxication && typeof root.intoxication === "object" ? root.intoxication : {};

  return {
    intoxication: {
      enabled: Boolean(intoxication.enabled),
      level: clamp01(intoxication.level, 0),
      decayPerTurn: clamp01(intoxication.decayPerTurn, 0.02),
      triggerGain: clamp01(intoxication.triggerGain, 0.12),
      triggerKeywords: normalizeKeywords(intoxication.triggerKeywords),
    },
  };
}

export function stepStateFlaws({ stateFlaws, userMessage = "" }) {
  const normalized = normalizeStateFlaws(stateFlaws);
  const intoxication = normalized.intoxication;

  if (!intoxication.enabled) {
    return {
      stateFlaws: normalized,
      diagnostics: {
        intoxication: {
          enabled: false,
          before: intoxication.level,
          after: intoxication.level,
          matchedKeywords: [],
        },
      },
    };
  }

  const text = String(userMessage || "").toLowerCase();
  const matchedKeywords = intoxication.triggerKeywords.filter((keyword) => text.includes(keyword));
  const triggerBoost = matchedKeywords.length * intoxication.triggerGain;

  const before = clamp01(intoxication.level, 0);
  const after = clamp01(before - intoxication.decayPerTurn + triggerBoost, before);

  const next = {
    ...normalized,
    intoxication: {
      ...intoxication,
      level: after,
    },
  };

  return {
    stateFlaws: next,
    diagnostics: {
      intoxication: {
        enabled: true,
        before,
        after,
        matchedKeywords,
      },
    },
  };
}

export function buildStateFlawPromptSection(stateFlaws) {
  const normalized = normalizeStateFlaws(stateFlaws);
  const intoxication = normalized.intoxication;

  if (!intoxication.enabled || intoxication.level <= 0.03) {
    return "";
  }

  const levelPct = Math.round(intoxication.level * 100);
  const coherenceDrop = Math.round(intoxication.level * 45);
  const interruptionLift = Math.round(intoxication.level * 50);

  return [
    "STATE FLAW: INTOXICATION",
    `Current intoxication level: ${levelPct}%`,
    `Effects: reduce coherence by about ${coherenceDrop}% while staying understandable; increase interruptions/fillers by about ${interruptionLift}% if it fits style.`,
    "Do not turn every line into a caricature. Keep persona identity intact and apply subtle variation turn-to-turn.",
  ].join("\n");
}
