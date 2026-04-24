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

function normalizeTriggerProfile(input, defaults = {}) {
  const source = input && typeof input === "object" ? input : {};
  return {
    keywordWeight: clamp01(source.keywordWeight, clamp01(defaults.keywordWeight ?? 1, 1)),
    longConversationWeight: clamp01(source.longConversationWeight, clamp01(defaults.longConversationWeight ?? 1, 1)),
    messageLengthWeight: clamp01(source.messageLengthWeight, clamp01(defaults.messageLengthWeight ?? 1, 1)),
    punctuationWeight: clamp01(source.punctuationWeight, clamp01(defaults.punctuationWeight ?? 1, 1)),
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
    triggerProfile: normalizeTriggerProfile(source.triggerProfile, defaults.triggerProfile || {}),
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
      triggerProfile: {
        keywordWeight: 1,
        longConversationWeight: 0.2,
        messageLengthWeight: 0.35,
        punctuationWeight: 0.25,
      },
    }),
    fatigue: normalizeChannel(root.fatigue, {
      ...defaultChannel(),
      enabled: false,
      level: 0.1,
      decayPerTurn: 0.01,
      passiveGainPerTurn: 0.015,
      triggerGain: 0.08,
      triggerKeywords: ["late", "tired", "sleep", "exhausted", "insomnia", "long day", "burned out"],
      triggerProfile: {
        keywordWeight: 1,
        longConversationWeight: 0.9,
        messageLengthWeight: 0.25,
        punctuationWeight: 0.1,
      },
    }),
    agitation: normalizeChannel(root.agitation, {
      ...defaultChannel(),
      enabled: false,
      level: 0,
      decayPerTurn: 0.03,
      triggerGain: 0.1,
      triggerKeywords: ["stupid", "idiot", "hate", "annoying", "angry", "mad", "insult"],
      triggerProfile: {
        keywordWeight: 1,
        longConversationWeight: 0.25,
        messageLengthWeight: 0.12,
        punctuationWeight: 0.8,
      },
    }),
    focus: normalizeChannel(root.focus, {
      ...defaultChannel(),
      enabled: false,
      level: 0.75,
      decayPerTurn: 0.015,
      recoveryPerTurn: 0.03,
      triggerGain: 0.08,
      triggerKeywords: ["focus", "concentrate", "plan", "step by step", "clear", "precise"],
      triggerProfile: {
        keywordWeight: 1,
        longConversationWeight: 0.3,
        messageLengthWeight: 0.18,
        punctuationWeight: 0.2,
      },
    }),
    _meta: {
      lastUpdatedAt: String(root?._meta?.lastUpdatedAt || root?.lastUpdatedAt || "").trim(),
    },
  };
}

function normalizeStateRuntimeConfig(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : false,
    tickSeconds: Math.max(10, Math.min(3600, Math.round(Number(source.tickSeconds) || 60))),
    maxCatchUpTicks: Math.max(1, Math.min(720, Math.round(Number(source.maxCatchUpTicks) || 120))),
    perTickScale: Math.max(0.05, Math.min(5, Number(source.perTickScale) || 1)),
    applyDecayDuringTicks: typeof source.applyDecayDuringTicks === "boolean" ? source.applyDecayDuringTicks : true,
    applyRecoveryDuringTicks: typeof source.applyRecoveryDuringTicks === "boolean" ? source.applyRecoveryDuringTicks : true,
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

export function stepStateFlaws({ stateFlaws, userMessage = "", turnCount = 0, nowMs = Date.now(), runtimeConfig = {} }) {
  const normalized = normalizeStateFlaws(stateFlaws);
  const runtime = normalizeStateRuntimeConfig(runtimeConfig);
  const diagnostics = {};
  const messageText = String(userMessage || "");
  const messageLength = messageText.length;
  const messagePunctuationDensity = Math.min(1, (messageText.match(/[!?.,;:]/g) || []).length / Math.max(1, messageLength));
  const normalizedTurnCount = Math.max(0, Number(turnCount || 0));
  const longConversationSignal = normalizedTurnCount >= 16 ? Math.min(1, (normalizedTurnCount - 16) / 20) : 0;

  const intoxMatches = keywordMatches(messageText, normalized.intoxication.triggerKeywords);
  const fatigueMatches = keywordMatches(messageText, normalized.fatigue.triggerKeywords);
  const agitationMatches = keywordMatches(messageText, normalized.agitation.triggerKeywords);
  const focusMatches = keywordMatches(messageText, normalized.focus.triggerKeywords);

  const computeProfileMultiplier = (profile) => {
    const keywordSignal = clamp01((profile.keywordWeight || 0), 1);
    const lengthSignal = clamp01((messageLength / 280) * (profile.messageLengthWeight || 0), 0);
    const punctuationSignal = clamp01(messagePunctuationDensity * (profile.punctuationWeight || 0), 0);
    const longConversation = clamp01(longConversationSignal * (profile.longConversationWeight || 0), 0);
    return clamp01(keywordSignal + lengthSignal + punctuationSignal + longConversation, 1);
  };

  const next = {
    ...normalized,
    intoxication: { ...normalized.intoxication },
    fatigue: { ...normalized.fatigue },
    agitation: { ...normalized.agitation },
    focus: { ...normalized.focus },
    _meta: { ...(normalized._meta || {}) },
  };

  const previousUpdatedAt = String(normalized?._meta?.lastUpdatedAt || "").trim();
  const lastUpdatedMs = previousUpdatedAt ? Date.parse(previousUpdatedAt) : NaN;
  const elapsedMs = Number.isFinite(lastUpdatedMs) ? Math.max(0, nowMs - lastUpdatedMs) : 0;
  const tickDurationMs = runtime.tickSeconds * 1000;
  const calculatedTicks = runtime.enabled && tickDurationMs > 0 ? Math.floor(elapsedMs / tickDurationMs) : 0;
  const ticksApplied = Math.max(0, Math.min(runtime.maxCatchUpTicks, calculatedTicks));

  if (runtime.enabled && ticksApplied > 0) {
    for (let index = 0; index < ticksApplied; index += 1) {
      const pressureLoss = next.intoxication.level * 0.06 + next.fatigue.level * 0.05 + next.agitation.level * 0.03;

      if (next.intoxication.enabled && runtime.applyDecayDuringTicks) {
        next.intoxication.level = clamp01(next.intoxication.level - next.intoxication.decayPerTurn * runtime.perTickScale, next.intoxication.level);
      }

      if (next.fatigue.enabled) {
        const passiveGain = next.fatigue.passiveGainPerTurn * runtime.perTickScale;
        const passiveDecay = runtime.applyDecayDuringTicks ? next.fatigue.decayPerTurn * runtime.perTickScale : 0;
        next.fatigue.level = clamp01(next.fatigue.level + passiveGain - passiveDecay, next.fatigue.level);
      }

      if (next.agitation.enabled && runtime.applyDecayDuringTicks) {
        next.agitation.level = clamp01(next.agitation.level - next.agitation.decayPerTurn * runtime.perTickScale, next.agitation.level);
      }

      if (next.focus.enabled) {
        const recovery = runtime.applyRecoveryDuringTicks ? next.focus.recoveryPerTurn * runtime.perTickScale : 0;
        const decay = runtime.applyDecayDuringTicks ? next.focus.decayPerTurn * runtime.perTickScale : 0;
        next.focus.level = clamp01(next.focus.level + recovery - decay - pressureLoss * runtime.perTickScale, next.focus.level);
      }
    }
  }

  const beforeIntox = normalized.intoxication.level;
  if (normalized.intoxication.enabled) {
    const profileMultiplier = computeProfileMultiplier(normalized.intoxication.triggerProfile);
    const boost = intoxMatches.length * normalized.intoxication.triggerGain * profileMultiplier;
    next.intoxication.level = clamp01(beforeIntox - normalized.intoxication.decayPerTurn + boost, beforeIntox);
  }
  diagnostics.intoxication = {
    enabled: normalized.intoxication.enabled,
    before: beforeIntox,
    after: next.intoxication.level,
    matchedKeywords: intoxMatches,
    triggerProfile: normalized.intoxication.triggerProfile,
  };

  const beforeFatigue = normalized.fatigue.level;
  if (normalized.fatigue.enabled) {
    const profileMultiplier = computeProfileMultiplier(normalized.fatigue.triggerProfile);
    const boost = fatigueMatches.length * normalized.fatigue.triggerGain * profileMultiplier;
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
    triggerProfile: normalized.fatigue.triggerProfile,
  };

  const beforeAgitation = normalized.agitation.level;
  if (normalized.agitation.enabled) {
    const profileMultiplier = computeProfileMultiplier(normalized.agitation.triggerProfile);
    const boost = agitationMatches.length * normalized.agitation.triggerGain * profileMultiplier;
    next.agitation.level = clamp01(beforeAgitation - normalized.agitation.decayPerTurn + boost, beforeAgitation);
  }
  diagnostics.agitation = {
    enabled: normalized.agitation.enabled,
    before: beforeAgitation,
    after: next.agitation.level,
    matchedKeywords: agitationMatches,
    triggerProfile: normalized.agitation.triggerProfile,
  };

  const beforeFocus = normalized.focus.level;
  if (normalized.focus.enabled) {
    const profileMultiplier = computeProfileMultiplier(normalized.focus.triggerProfile);
    const support = focusMatches.length * normalized.focus.triggerGain * profileMultiplier;
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
    triggerProfile: normalized.focus.triggerProfile,
  };

  diagnostics.timeDrift = {
    enabled: runtime.enabled,
    elapsedMs,
    tickSeconds: runtime.tickSeconds,
    ticksApplied,
    ticksCapped: calculatedTicks > runtime.maxCatchUpTicks,
    maxCatchUpTicks: runtime.maxCatchUpTicks,
  };

  next._meta.lastUpdatedAt = new Date(nowMs).toISOString();

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
