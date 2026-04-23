function clamp01(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, n));
}

function normalizeKeywords(input, fallback) {
  if (!Array.isArray(input)) {
    return fallback;
  }

  const normalized = Array.from(
    new Set(
      input
        .map((entry) => String(entry || "").trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 24);

  return normalized.length ? normalized : fallback;
}

function defaultChannel() {
  return {
    enabled: false,
    level: 0,
    decayPerTurn: 0.02,
    triggerGain: 0.12,
    triggerKeywords: [],
  };
}

function normalizeChannel(input, defaults = {}) {
  const source = input && typeof input === "object" ? input : {};
  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : Boolean(defaults.enabled),
    level: clamp01(source.level, clamp01(defaults.level ?? 0, 0)),
    decayPerTurn: clamp01(source.decayPerTurn, clamp01(defaults.decayPerTurn ?? 0.02, 0.02)),
    triggerGain: clamp01(source.triggerGain, clamp01(defaults.triggerGain ?? 0.12, 0.12)),
    triggerKeywords: normalizeKeywords(source.triggerKeywords, defaults.triggerKeywords || []),
    passiveGainPerTurn: clamp01(source.passiveGainPerTurn, clamp01(defaults.passiveGainPerTurn ?? 0, 0)),
    recoveryPerTurn: clamp01(source.recoveryPerTurn, clamp01(defaults.recoveryPerTurn ?? 0, 0)),
  };
}

export function normalizeStateFlaws(input) {
  const root = input && typeof input === "object" ? input : {};

  return {
    intoxication: normalizeChannel(root.intoxication, {
      ...defaultChannel(),
      enabled: false,
      level: 0,
      decayPerTurn: 0.02,
      triggerGain: 0.12,
      triggerKeywords: ["drink", "drunk", "alcohol", "whiskey", "vodka", "beer", "wine", "buzzed", "bar"],
    }),
    fatigue: normalizeChannel(root.fatigue, {
      ...defaultChannel(),
      enabled: false,
      level: 0.1,
      decayPerTurn: 0.01,
      passiveGainPerTurn: 0.015,
      triggerGain: 0.08,
      triggerKeywords: ["late", "tired", "sleep", "exhausted", "insomnia", "long day", "burned out"],
    }),
    agitation: normalizeChannel(root.agitation, {
      ...defaultChannel(),
      enabled: false,
      level: 0,
      decayPerTurn: 0.03,
      triggerGain: 0.1,
      triggerKeywords: ["stupid", "idiot", "hate", "annoying", "angry", "mad", "insult"],
    }),
    focus: normalizeChannel(root.focus, {
      ...defaultChannel(),
      enabled: false,
      level: 0.75,
      decayPerTurn: 0.015,
      recoveryPerTurn: 0.03,
      triggerGain: 0.08,
      triggerKeywords: ["focus", "concentrate", "plan", "step by step", "clear", "precise"],
    }),
  };
}

function keywordMatches(message, keywords) {
  const text = String(message || "").toLowerCase();
  return (Array.isArray(keywords) ? keywords : []).filter((keyword) => text.includes(keyword));
}

function computeStabilityIndex(state) {
  const intox = Number(state?.intoxication?.level || 0);
  const fatigue = Number(state?.fatigue?.level || 0);
  const agitation = Number(state?.agitation?.level || 0);
  const focusDebt = 1 - Number(state?.focus?.level || 0.75);
  return clamp01(1 - (intox + fatigue + agitation + focusDebt) / 4, 1);
}

export function buildStateDriftDirectives(stateFlaws) {
  const state = normalizeStateFlaws(stateFlaws);
  const intox = Number(state.intoxication.level || 0);
  const fatigue = Number(state.fatigue.level || 0);
  const agitation = Number(state.agitation.level || 0);
  const focusPenalty = 1 - Number(state.focus.level || 0.75);

  const coherencePenalty = clamp01(intox * 0.4 + fatigue * 0.3 + agitation * 0.25 + focusPenalty * 0.35, 0);
  const fragmentation = clamp01(intox * 0.25 + fatigue * 0.2 + agitation * 0.15, 0);
  const interruptions = clamp01(intox * 0.2 + agitation * 0.4 + fatigue * 0.1, 0);
  const tangentChance = clamp01(intox * 0.18 + fatigue * 0.12 + (1 - state.focus.level) * 0.2, 0);
  const fillerRate = clamp01(intox * 0.2 + fatigue * 0.25 + agitation * 0.1, 0);
  const impulseBurpChance = clamp01((intox - 0.55) * 1.35, 0);
  const stabilityIndex = computeStabilityIndex(state);

  return {
    coherencePenalty,
    fragmentation,
    interruptions,
    tangentChance,
    fillerRate,
    impulseBurpChance,
    readabilityFloor: 0.55,
    stabilityIndex,
  };
}

export function stepStateFlaws({ stateFlaws, userMessage = "" }) {
  const normalized = normalizeStateFlaws(stateFlaws);
  const diagnostics = {};

  const intoxMatches = keywordMatches(userMessage, normalized.intoxication.triggerKeywords);
  const fatigueMatches = keywordMatches(userMessage, normalized.fatigue.triggerKeywords);
  const agitationMatches = keywordMatches(userMessage, normalized.agitation.triggerKeywords);
  const focusMatches = keywordMatches(userMessage, normalized.focus.triggerKeywords);

  const next = {
    ...normalized,
    intoxication: { ...normalized.intoxication },
    fatigue: { ...normalized.fatigue },
    agitation: { ...normalized.agitation },
    focus: { ...normalized.focus },
  };

  const beforeIntox = normalized.intoxication.level;
  if (normalized.intoxication.enabled) {
    const boost = intoxMatches.length * normalized.intoxication.triggerGain;
    next.intoxication.level = clamp01(beforeIntox - normalized.intoxication.decayPerTurn + boost, beforeIntox);
  }
  diagnostics.intoxication = {
    enabled: normalized.intoxication.enabled,
    before: beforeIntox,
    after: next.intoxication.level,
    matchedKeywords: intoxMatches,
  };

  const beforeFatigue = normalized.fatigue.level;
  if (normalized.fatigue.enabled) {
    const boost = fatigueMatches.length * normalized.fatigue.triggerGain;
    next.fatigue.level = clamp01(
      beforeFatigue + normalized.fatigue.passiveGainPerTurn + boost - normalized.fatigue.decayPerTurn,
      beforeFatigue,
    );
  }
  diagnostics.fatigue = {
    enabled: normalized.fatigue.enabled,
    before: beforeFatigue,
    after: next.fatigue.level,
    matchedKeywords: fatigueMatches,
  };

  const beforeAgitation = normalized.agitation.level;
  if (normalized.agitation.enabled) {
    const boost = agitationMatches.length * normalized.agitation.triggerGain;
    next.agitation.level = clamp01(beforeAgitation - normalized.agitation.decayPerTurn + boost, beforeAgitation);
  }
  diagnostics.agitation = {
    enabled: normalized.agitation.enabled,
    before: beforeAgitation,
    after: next.agitation.level,
    matchedKeywords: agitationMatches,
  };

  const beforeFocus = normalized.focus.level;
  if (normalized.focus.enabled) {
    const support = focusMatches.length * normalized.focus.triggerGain;
    const pressureLoss = next.intoxication.level * 0.06 + next.fatigue.level * 0.05 + next.agitation.level * 0.03;
    next.focus.level = clamp01(
      beforeFocus + normalized.focus.recoveryPerTurn + support - normalized.focus.decayPerTurn - pressureLoss,
      beforeFocus,
    );
  }
  diagnostics.focus = {
    enabled: normalized.focus.enabled,
    before: beforeFocus,
    after: next.focus.level,
    matchedKeywords: focusMatches,
  };

  const directives = buildStateDriftDirectives(next);

  return {
    stateFlaws: next,
    diagnostics,
    directives,
    snapshot: {
      intoxication: next.intoxication.level,
      fatigue: next.fatigue.level,
      agitation: next.agitation.level,
      focus: next.focus.level,
    },
    stabilityIndex: directives.stabilityIndex,
  };
}

function pct(value) {
  return Math.round(clamp01(value, 0) * 100);
}

export function buildStateFlawPromptSection(stateFlaws) {
  const normalized = normalizeStateFlaws(stateFlaws);
  const directives = buildStateDriftDirectives(normalized);

  const activeLines = [];
  if (normalized.intoxication.enabled && normalized.intoxication.level > 0.03) {
    activeLines.push(`- Intoxication: ${pct(normalized.intoxication.level)}%`);
  }
  if (normalized.fatigue.enabled && normalized.fatigue.level > 0.03) {
    activeLines.push(`- Fatigue: ${pct(normalized.fatigue.level)}%`);
  }
  if (normalized.agitation.enabled && normalized.agitation.level > 0.03) {
    activeLines.push(`- Agitation: ${pct(normalized.agitation.level)}%`);
  }
  if (normalized.focus.enabled) {
    activeLines.push(`- Focus: ${pct(normalized.focus.level)}%`);
  }

  if (!activeLines.length) {
    return "";
  }

  return [
    "STATE DRIFT (dynamic runtime modifiers):",
    ...activeLines,
    `Behavior controls: coherence penalty ${pct(directives.coherencePenalty)}%, fragmentation ${pct(directives.fragmentation)}%, interruptions ${pct(directives.interruptions)}%, tangent chance ${pct(directives.tangentChance)}%.`,
    `Speech impulses: filler rate ${pct(directives.fillerRate)}%, burp impulse chance ${pct(directives.impulseBurpChance)}% when style-appropriate.`,
    `Guardrails: preserve persona identity and keep clarity above ${pct(directives.readabilityFloor)}%.`,
  ].join("\n");
}
