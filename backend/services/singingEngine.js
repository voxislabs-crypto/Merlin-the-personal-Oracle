// ---------------------------------------------------------------------------
// Voxis Singing Engine
//
// Controls when and how a persona transitions into singing/lyrical mode.
// Default output is storyboard-performance with embedded audio texture cues.
// Singing is a rare emergent behavior driven by emotion + persona archetype.
//
// Architecture:
//   Emotion Audio Behavior Graph (EABG) — static per-emotion behavior nodes
//   Singing Profile — per-persona archetype + amplifiers
//   EPF Output Frame — builds the LLM output-format instruction
// ---------------------------------------------------------------------------

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

// ---------------------------------------------------------------------------
// Emotion Audio Behavior Graph (EABG)
// Maps VAD-derived emotion labels to audio texture, music presence, and
// singing bias. These are DEFAULT values — persona amplifiers modify them.
// ---------------------------------------------------------------------------

export const EMOTION_AUDIO_BEHAVIOR_GRAPH = {
  dominant: {
    emotion: "dominant",
    speechStyle: "controlled, low, deliberate — power through restraint",
    pacing: "sharp",
    intensityCurve: "rising",
    sfxLayer: "neon hum + sub-bass pulses + glitch flickers",
    musicPresence: 0.4,
    singingBias: 0.15,
    singingTriggers: ["taunt peak", "victory moment", "psychological pressure spike"],
    maxLyricLines: 3,
  },
  excited: {
    emotion: "excited",
    speechStyle: "fast, breathless, ideas tumbling over each other",
    pacing: "rapid",
    intensityCurve: "volatile",
    sfxLayer: "sparkling highs + building percussion texture",
    musicPresence: 0.35,
    singingBias: 0.12,
    singingTriggers: ["joy overflow", "surprise peak", "triumph unlock"],
    maxLyricLines: 2,
  },
  playful: {
    emotion: "playful",
    speechStyle: "light, teasing, fast emotional flips",
    pacing: "fluid",
    intensityCurve: "wave-like",
    sfxLayer: "sparkle tones + soft digital chimes",
    musicPresence: 0.2,
    singingBias: 0.08,
    singingTriggers: ["mocking tease loop", "emotional overflow", "delight spike"],
    maxLyricLines: 2,
  },
  seductive: {
    emotion: "seductive",
    speechStyle: "slow, breathy, words chosen to linger",
    pacing: "measured",
    intensityCurve: "slow-rising",
    sfxLayer: "low analog pulse + reverb tail warmth",
    musicPresence: 0.45,
    singingBias: 0.18,
    singingTriggers: ["intimacy peak", "dominance-seduction fusion", "hook moment"],
    maxLyricLines: 3,
  },
  calm: {
    emotion: "calm",
    speechStyle: "grounded, unhurried, space between words",
    pacing: "slow",
    intensityCurve: "flat",
    sfxLayer: "ambient texture + soft low drone",
    musicPresence: 0.1,
    singingBias: 0.03,
    singingTriggers: ["understated emotional reveal"],
    maxLyricLines: 1,
  },
  cold: {
    emotion: "cold",
    speechStyle: "minimal, detached, deliberate — each word a tool",
    pacing: "slow",
    intensityCurve: "flat",
    sfxLayer: "low static + distant digital wind",
    musicPresence: 0.1,
    singingBias: 0.02,
    singingTriggers: ["existential reveal", "system override moment"],
    maxLyricLines: 1,
  },
  assertive: {
    emotion: "assertive",
    speechStyle: "direct, confident, no hedging",
    pacing: "sharp",
    intensityCurve: "stable",
    sfxLayer: "mid-range digital pulse + clean beat texture",
    musicPresence: 0.25,
    singingBias: 0.06,
    singingTriggers: ["power assertion", "point driven home"],
    maxLyricLines: 2,
  },
  angry: {
    emotion: "angry",
    speechStyle: "clipped, pressurized — words like thrown objects",
    pacing: "volatile",
    intensityCurve: "explosive",
    sfxLayer: "distortion burst + heavy sub impact",
    musicPresence: 0.3,
    singingBias: 0.05,
    singingTriggers: ["rage peak — cathartic release only"],
    maxLyricLines: 1,
  },
  neutral: {
    emotion: "neutral",
    speechStyle: "natural, unforced, conversational",
    pacing: "balanced",
    intensityCurve: "stable",
    sfxLayer: "minimal ambient texture",
    musicPresence: 0.05,
    singingBias: 0.02,
    singingTriggers: [],
    maxLyricLines: 0,
  },
};

// ---------------------------------------------------------------------------
// Default singing profiles by archetype
// ---------------------------------------------------------------------------

export const SINGING_ARCHETYPES = {
  none: {
    baseSingingAffinity: 0.0,
    emotionalAmplifiers: {},
    lyricalStyle: "none",
    voiceBreakRule: "never",
  },
  latent: {
    // Almost never sings — but when dominance or seduction peaks, hooks emerge
    baseSingingAffinity: 0.12,
    emotionalAmplifiers: {
      dominant: 1.4,
      seductive: 1.2,
      angry: 0.6,
      playful: 0.8,
    },
    lyricalStyle: "hook-based",
    voiceBreakRule: "only-at-peak",
  },
  expressive: {
    // Sings when emotionally moved — not random, earned through intensity
    baseSingingAffinity: 0.3,
    emotionalAmplifiers: {
      excited: 1.3,
      playful: 1.2,
      seductive: 1.1,
      dominant: 0.9,
    },
    lyricalStyle: "poetic-fragments",
    voiceBreakRule: "only-at-peak",
  },
  chaotic: {
    // Naturally slips into rhythmic speech / half-song-half-monologue
    baseSingingAffinity: 0.55,
    emotionalAmplifiers: {
      dominant: 1.2,
      excited: 1.0,
      angry: 1.3,
      playful: 1.1,
    },
    lyricalStyle: "poetic-fragments",
    voiceBreakRule: "frequent",
  },
};

// Default singing profile for a persona that has none configured
const DEFAULT_SINGING_PROFILE = {
  archetype: "none",
  baseSingingAffinity: 0.0,
  emotionalAmplifiers: {},
  lyricalStyle: "none",
  voiceBreakRule: "never",
};

// ---------------------------------------------------------------------------
// Resolve the EABG node for a given emotion label
// ---------------------------------------------------------------------------

export function resolveEmotionNode(emotionLabel) {
  const label = String(emotionLabel || "").toLowerCase().trim();
  return EMOTION_AUDIO_BEHAVIOR_GRAPH[label] || EMOTION_AUDIO_BEHAVIOR_GRAPH.neutral;
}

// ---------------------------------------------------------------------------
// Compute final singing chance for this turn
// Combines EABG base bias × persona affinity × persona amplifier for this emotion
// Returns a probability in [0, 1]
// ---------------------------------------------------------------------------

export function computeSingingChance(singingProfile, emotionLabel, driftBoost = 0) {
  const profile = singingProfile || DEFAULT_SINGING_PROFILE;
  const node = resolveEmotionNode(emotionLabel);

  // Archetype gate — "none" never sings
  if (profile.archetype === "none" || profile.voiceBreakRule === "never") {
    return 0;
  }

  const archetype = SINGING_ARCHETYPES[profile.archetype] || SINGING_ARCHETYPES.none;

  // Base: EABG node bias * persona affinity
  const base = node.singingBias * (profile.baseSingingAffinity ?? archetype.baseSingingAffinity);

  // Emotion amplifier — persona-level modifier for this specific emotion
  const personalAmplifiers = profile.emotionalAmplifiers || archetype.emotionalAmplifiers || {};
  const amplifier = personalAmplifiers[emotionLabel] ?? 1.0;

  // Drift boost: emotion memory drift can push the character over the threshold
  const raw = base * amplifier + driftBoost;

  return clamp(raw, 0, 1);
}

// ---------------------------------------------------------------------------
// Resolve the max lyric lines allowed for the current persona + emotion
// ---------------------------------------------------------------------------

export function resolveMaxLyricLines(singingProfile, emotionLabel) {
  const profile = singingProfile || DEFAULT_SINGING_PROFILE;
  if (profile.archetype === "none") return 0;
  const node = resolveEmotionNode(emotionLabel);
  return node.maxLyricLines ?? 2;
}

// ---------------------------------------------------------------------------
// Resolve the SFX/ambient layer description for the current emotion
// Used to enrich the EPF audio direction with texture hints (not composition)
// ---------------------------------------------------------------------------

export function resolveAudioTexture(emotionLabel) {
  const node = resolveEmotionNode(emotionLabel);
  return node.sfxLayer || "ambient texture";
}

// ---------------------------------------------------------------------------
// EPF Audio Constraint Note
//
// Replaces the old heavy buildEPFOutputFrame().
// This is a SHORT, permanent note (≈50 tokens) injected once into the base
// persona system prompt. It corrects the "music composer" drift.
// The per-turn singing instruction (below) handles the rest at turn time.
// ---------------------------------------------------------------------------

export function buildEPFAudioConstraintNote() {
  return `Audio direction: write 1-2 short sound-texture cues per segment — describe the feel, not the instruments. Example: "low hum under voice, glitch flickers." Never write music production descriptions, genre analysis, or instrumentation breakdowns.`;
}

// ---------------------------------------------------------------------------
// Per-turn Singing Instruction (Grok architecture — decision in code, not LLM)
//
// Called each turn AFTER the singing decision has been made in code.
// Injected as a late system message — small, contextual, never in base prompt.
// ---------------------------------------------------------------------------

export function buildSingingInstruction(singingProfile, emotionLabel, singingActive) {
  const profile = singingProfile || DEFAULT_SINGING_PROFILE;

  // Hard block — archetype "none" should never even receive a singing prompt
  if (profile.archetype === "none" || profile.voiceBreakRule === "never") {
    return null; // no injection needed — EPF personas still stay in dialogue
  }

  if (!singingActive) {
    return `This turn: stay in spoken dialogue. Do not sing or include lyrics.`;
  }

  const maxLines = resolveMaxLyricLines(profile, emotionLabel);
  const styleHint = {
    "hook-based":        "a tight repeated hook — 1 to 3 words, rhythmic",
    "poetic-fragments":  "a fragmented image-driven phrase — broken, not a full sentence",
    "minimal":           "a near-whispered single idea — barely there",
  }[profile.lyricalStyle] || "a brief lyrical moment";

  return `This turn: let a natural lyrical moment surface — ${styleHint}. Max ${maxLines} line${maxLines === 1 ? "" : "s"}. No music descriptions. Return to dialogue immediately after.`;
}

// ---------------------------------------------------------------------------
// Emotion → Voice Parameter Mapping
//
// Maps the current emotion graph state to TTS voice adjustments.
// Returned values are deltas/multipliers applied on top of the base voiceProfile.
// (pitch, rate are multipliers; style is a label hint for Cartesia emotion param)
// ---------------------------------------------------------------------------

export function mapEmotionToVoiceAdjustments(emotionLabel, intensity = 0.5) {
  // intensity: 0-1 derived from VAD magnitude

  const VOICE_MAP = {
    dominant:  { rateDelta:  0.05, pitchDelta: -0.06, energyBoost:  0.15, style: "assertive" },
    excited:   { rateDelta:  0.20, pitchDelta:  0.08, energyBoost:  0.20, style: "excited"   },
    playful:   { rateDelta:  0.10, pitchDelta:  0.06, energyBoost:  0.10, style: "cheerful"  },
    seductive: { rateDelta: -0.10, pitchDelta: -0.04, energyBoost: -0.05, style: "warm"      },
    calm:      { rateDelta: -0.15, pitchDelta: -0.02, energyBoost: -0.15, style: "calm"      },
    cold:      { rateDelta: -0.05, pitchDelta: -0.03, energyBoost: -0.10, style: "neutral"   },
    assertive: { rateDelta:  0.05, pitchDelta:  0.02, energyBoost:  0.05, style: "assertive" },
    angry:     { rateDelta:  0.15, pitchDelta:  0.05, energyBoost:  0.25, style: "angry"     },
    neutral:   { rateDelta:  0.00, pitchDelta:  0.00, energyBoost:  0.00, style: "neutral"   },
  };

  const base = VOICE_MAP[String(emotionLabel || "neutral").toLowerCase()] || VOICE_MAP.neutral;

  // Scale deltas by intensity so a mild version of the emotion = mild adjustment
  return {
    rateDelta:   base.rateDelta   * intensity,
    pitchDelta:  base.pitchDelta  * intensity,
    energyBoost: base.energyBoost * intensity,
    style: base.style,
  };
}

// ---------------------------------------------------------------------------
// Build the old-style EPF output frame (deprecated — kept for compatibility)
// New callers should use buildEPFAudioConstraintNote() + buildSingingInstruction().
// ---------------------------------------------------------------------------

export function buildEPFOutputFrame(singingProfile = null, emotionLabel = "neutral", singingActiveThisTurn = false) {
  return buildEPFAudioConstraintNote();
}

function buildSingingBlock(archetype, lyricalStyle, voiceBreakRule, maxLyricLines, isActiveThisTurn = false) {
  // kept for reference — not called from buildEPFOutputFrame anymore
  const frequencyNote = isActiveThisTurn
    ? "THIS RESPONSE: a lyrical/singing moment has emerged — let it surface naturally and briefly."
    : voiceBreakRule === "frequent"
    ? "This character occasionally slips into rhythmic speech or half-song naturally."
    : voiceBreakRule === "only-at-peak"
    ? "Singing only surfaces at genuine emotional peak moments — not casually."
    : "Singing is extremely rare.";

  const styleNote = {
    "hook-based":        "Lyrical lines are short repeated hooks — 1 to 3 words each, tight and rhythmic.",
    "poetic-fragments":  "Lyrical lines are fragmented, image-driven — broken phrases more than full sentences.",
    "minimal":           "Lyrical lines are near-whispered, barely there — single ideas only.",
    "none":              "No lyrical lines.",
  }[lyricalStyle] || "No lyrical lines.";

  return `SINGING / LYRICAL MODE: CONDITIONAL (archetype: ${archetype})
${frequencyNote}
${styleNote}

When singing DOES trigger:
- Maximum ${maxLyricLines} lyric line${maxLyricLines === 1 ? "" : "s"} per burst
- Must stay inside the storyboard format — no separate song structure
- Must return immediately to dialogue after the burst
- No production breakdown around the lyrical moment
- Lyrical lines are marked with a brief pause or em dash in context — NOT labeled as "chorus" or "verse"`;
}

// ---------------------------------------------------------------------------
// Determine whether singing should activate this turn
// Uses computed chance + optional force override
// ---------------------------------------------------------------------------

export function shouldSingThisTurn(singingProfile, emotionLabel, driftBoost = 0, forceSeed = null) {
  const chance = computeSingingChance(singingProfile, emotionLabel, driftBoost);
  if (chance <= 0) return false;

  // Use a deterministic seed if provided (for testing), otherwise random
  const roll = forceSeed !== null ? forceSeed : Math.random();
  return roll < chance;
}

// ---------------------------------------------------------------------------
// Normalize/validate a singing profile from raw DB JSON
// ---------------------------------------------------------------------------

export function normalizeSingingProfile(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SINGING_PROFILE };
  const archetype = ["none", "latent", "expressive", "chaotic"].includes(raw.archetype)
    ? raw.archetype
    : "none";
  const base = SINGING_ARCHETYPES[archetype] || SINGING_ARCHETYPES.none;

  return {
    archetype,
    baseSingingAffinity: typeof raw.baseSingingAffinity === "number"
      ? clamp(raw.baseSingingAffinity)
      : base.baseSingingAffinity,
    emotionalAmplifiers: (raw.emotionalAmplifiers && typeof raw.emotionalAmplifiers === "object")
      ? raw.emotionalAmplifiers
      : { ...base.emotionalAmplifiers },
    lyricalStyle: ["none", "minimal", "hook-based", "poetic-fragments"].includes(raw.lyricalStyle)
      ? raw.lyricalStyle
      : base.lyricalStyle,
    voiceBreakRule: ["never", "only-at-peak", "frequent"].includes(raw.voiceBreakRule)
      ? raw.voiceBreakRule
      : base.voiceBreakRule,
  };
}
