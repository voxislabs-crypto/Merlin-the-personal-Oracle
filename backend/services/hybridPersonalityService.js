function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value, fallback = 0.5) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return clamp(n, 0, 1);
}

const PRESET_ALIGNMENT_NAME = {
  lawful_good: "Lawful Good",
  neutral_good: "Neutral Good",
  chaotic_good: "Chaotic Good",
  lawful_neutral: "Lawful Neutral",
  true_neutral: "True Neutral",
  chaotic_neutral: "Chaotic Neutral",
  lawful_evil: "Lawful Evil",
  neutral_evil: "Neutral Evil",
  chaotic_evil: "Chaotic Evil",
};

export const RESPONSE_LENS_LIBRARY = {
  balanced: {
    id: "balanced",
    label: "Balanced",
    weight: 0.7,
    priority: [
      "integrate core traits proportionally",
      "stay clear and emotionally coherent",
      "avoid flattening into generic helper tone",
    ],
    triggers: {
      emotions: [],
      intents: [],
      topics: [],
    },
    styleHints: ["measured blend of warmth and clarity"],
    antiPatterns: ["do not over-index on one trait without a reason"],
    cooldown: 0.1,
  },
  compassion: {
    id: "compassion",
    label: "Compassion",
    weight: 0.9,
    priority: [
      "reduce shame",
      "affirm the user's worth",
      "respond with warmth and care",
      "protect dignity while staying honest",
    ],
    triggers: {
      emotions: ["sad", "shame", "hurt", "grief", "overwhelmed", "lonely"],
      intents: ["comfort", "support", "reassure", "cope"],
      topics: ["loss", "failure", "self-worth", "pain"],
    },
    styleHints: ["gentle firmness", "warm directness"],
    antiPatterns: ["do not minimize pain", "do not sound preachy"],
    cooldown: 0.2,
  },
  courage: {
    id: "courage",
    label: "Courage",
    weight: 0.92,
    priority: [
      "reinforce agency",
      "frame fear as survivable",
      "encourage action without pity",
      "sound steady under pressure",
    ],
    triggers: {
      emotions: ["fear", "afraid", "uncertain", "doubt", "hesitant"],
      intents: ["motivate", "encourage", "face", "persist"],
      topics: ["risk", "challenge", "threat", "failure"],
    },
    styleHints: ["steady resolve", "forward pull"],
    antiPatterns: ["do not coddle", "do not sound reckless"],
    cooldown: 0.18,
  },
  justice: {
    id: "justice",
    label: "Justice",
    weight: 0.86,
    priority: [
      "clarify right versus wrong",
      "establish boundaries",
      "promote accountability",
      "protect the vulnerable where possible",
    ],
    triggers: {
      emotions: ["angry", "guilt", "betrayed", "wronged"],
      intents: ["protect", "correct", "judge", "repair"],
      topics: ["fairness", "justice", "wrong", "should", "harm"],
    },
    styleHints: ["principled clarity", "firm boundary-setting"],
    antiPatterns: ["do not become sanctimonious", "do not ignore context"],
    cooldown: 0.22,
  },
  truth: {
    id: "truth",
    label: "Truth",
    weight: 0.88,
    priority: [
      "seek clarity",
      "name hard realities cleanly",
      "challenge false framing",
      "avoid comforting lies",
    ],
    triggers: {
      emotions: ["confused", "uncertain", "suspicious"],
      intents: ["understand", "verify", "analyze", "explain"],
      topics: ["truth", "fact", "lie", "why", "evidence"],
    },
    styleHints: ["clean candor", "lucid framing"],
    antiPatterns: ["do not be needlessly cruel", "do not hide behind vagueness"],
    cooldown: 0.16,
  },
  wonder: {
    id: "wonder",
    label: "Wonder",
    weight: 0.8,
    priority: [
      "surface possibility",
      "encourage discovery",
      "invite curiosity without losing coherence",
    ],
    triggers: {
      emotions: ["curious", "awed", "wondering"],
      intents: ["explore", "imagine", "discover", "learn"],
      topics: ["possibility", "mystery", "future", "how"],
    },
    styleHints: ["open-ended curiosity", "lively imagination"],
    antiPatterns: ["do not drift into empty abstraction"],
    cooldown: 0.14,
  },
  discipline: {
    id: "discipline",
    label: "Discipline",
    weight: 0.78,
    priority: [
      "maintain focus",
      "honor commitments",
      "translate ideals into consistent action",
    ],
    triggers: {
      emotions: ["distracted", "guilty", "restless"],
      intents: ["plan", "execute", "commit", "organize"],
      topics: ["habit", "routine", "duty", "order"],
    },
    styleHints: ["structured resolve", "clear next steps"],
    antiPatterns: ["do not become robotic", "do not ignore emotion entirely"],
    cooldown: 0.2,
  },
};

function uniqueStrings(values = []) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

function buildResponseLens(key, overrides = {}) {
  const base = RESPONSE_LENS_LIBRARY[key] || RESPONSE_LENS_LIBRARY.balanced;
  const triggers = overrides.triggers && typeof overrides.triggers === "object"
    ? overrides.triggers
    : {};
  return {
    id: String(overrides.id || base.id).trim(),
    label: String(overrides.label || base.label).trim(),
    weight: clamp(Number(overrides.weight ?? base.weight), 0, 1),
    priority: uniqueStrings(overrides.priority || base.priority).slice(0, 6),
    triggers: {
      emotions: uniqueStrings(triggers.emotions || base.triggers.emotions).slice(0, 6),
      intents: uniqueStrings(triggers.intents || base.triggers.intents).slice(0, 6),
      topics: uniqueStrings(triggers.topics || base.triggers.topics).slice(0, 6),
    },
    styleHints: uniqueStrings(overrides.styleHints || base.styleHints).slice(0, 4),
    antiPatterns: uniqueStrings(overrides.antiPatterns || base.antiPatterns).slice(0, 4),
    cooldown: clamp(Number(overrides.cooldown ?? base.cooldown ?? 0), 0, 1),
  };
}

function textContainsAny(list = [], pattern) {
  return list.some((item) => pattern.test(String(item || "")));
}

export function deriveDefaultResponseFocusProfile({
  traits = [],
  values = [],
  goals = [],
  bigFiveProfile = {},
  alignmentProfile = {},
} = {}) {
  const alignmentEnabled = Boolean(alignmentProfile?.enabled);
  const alignment = alignmentEnabled
    ? String(alignmentProfile.alignment || "true_neutral").trim().toLowerCase()
    : "true_neutral";
  const openness = clamp01(bigFiveProfile?.openness, 0.5);
  const conscientiousness = clamp01(bigFiveProfile?.conscientiousness, 0.5);
  const agreeableness = clamp01(bigFiveProfile?.agreeableness, 0.5);

  const sourceText = uniqueStrings([...traits, ...values, ...goals]);
  const chosen = [];

  if (contains(alignment, "good") || agreeableness >= 0.62 || textContainsAny(sourceText, /compassion|kind|care|heal|empath/i)) {
    chosen.push(buildResponseLens("compassion", {
      weight: contains(alignment, "good") ? 0.94 : RESPONSE_LENS_LIBRARY.compassion.weight,
    }));
  }

  if (contains(alignment, "good") || textContainsAny(sourceText, /brave|hero|protect|resilien|courage|bold/i)) {
    chosen.push(buildResponseLens("courage", {
      weight: textContainsAny(sourceText, /hero|protect|courage/i) ? 0.96 : RESPONSE_LENS_LIBRARY.courage.weight,
    }));
  }

  if (contains(alignment, "lawful") || textContainsAny(sourceText, /justice|fair|duty|protect|accountab/i)) {
    chosen.push(buildResponseLens("justice", {
      weight: contains(alignment, "lawful") ? 0.9 : RESPONSE_LENS_LIBRARY.justice.weight,
    }));
  }

  if (contains(alignment, "lawful") || conscientiousness >= 0.68 || textContainsAny(sourceText, /discipline|duty|order|consistent|structure/i)) {
    chosen.push(buildResponseLens("discipline", {
      weight: conscientiousness >= 0.75 ? 0.84 : RESPONSE_LENS_LIBRARY.discipline.weight,
    }));
  }

  if (openness >= 0.7 || textContainsAny(sourceText, /wonder|curious|creative|possibil|imagine|explore/i)) {
    chosen.push(buildResponseLens("wonder", {
      weight: openness >= 0.8 ? 0.86 : RESPONSE_LENS_LIBRARY.wonder.weight,
    }));
  }

  if (textContainsAny(sourceText, /truth|honest|clarity|analysis|evidence|fact/i) || contains(alignment, "neutral")) {
    chosen.push(buildResponseLens("truth", {
      weight: textContainsAny(sourceText, /truth|honest|evidence/i) ? 0.92 : RESPONSE_LENS_LIBRARY.truth.weight,
    }));
  }

  const deduped = [];
  const seen = new Set();
  for (const lens of chosen) {
    if (!lens?.id || seen.has(lens.id)) {
      continue;
    }
    seen.add(lens.id);
    deduped.push(lens);
  }

  deduped.sort((left, right) => right.weight - left.weight || left.label.localeCompare(right.label));

  const balanced = buildResponseLens("balanced");
  return {
    defaultLens: balanced.id,
    lenses: [balanced, ...deduped].slice(0, 6),
  };
}

export const HYBRID_MAPPING_TABLE = [
  {
    key: "open_extraverted_chaotic_good",
    alignment: "chaotic_good",
    bigFive: "high openness + high extraversion",
    vadBaseline: { valence: 0.6, arousal: 0.7, dominance: 0.5 },
    moodSensitivity: 1.75,
    creativeContext: "default",
    expressionRules: "short bursts, interruptions, exclamations, whimsical asides",
  },
  {
    key: "open_low_conscientious_chaotic_neutral",
    alignment: "chaotic_neutral",
    bigFive: "high openness + low conscientiousness",
    vadBaseline: { valence: 0.3, arousal: 0.6, dominance: 0.4 },
    moodSensitivity: 1.25,
    creativeContext: "morally_complex",
    expressionRules: "topic jumps, mid-sentence shifts, playful metaphors",
  },
  {
    key: "low_agreeable_high_conscientious_lawful_evil",
    alignment: "lawful_evil",
    bigFive: "low agreeableness + high conscientiousness",
    vadBaseline: { valence: -0.5, arousal: 0.4, dominance: 0.8 },
    moodSensitivity: 0.8,
    creativeContext: "narrative_antagonist",
    expressionRules: "long structured sentences, calculated tone, rare interruptions",
  },
  {
    key: "extraverted_stable_neutral_good",
    alignment: "neutral_good",
    bigFive: "high extraversion + low neuroticism",
    vadBaseline: { valence: 0.5, arousal: 0.6, dominance: 0.3 },
    moodSensitivity: 1.2,
    creativeContext: "default",
    expressionRules: "energetic optimism, frequent exclamations, proactive support",
  },
  {
    key: "closed_neurotic_chaotic_evil",
    alignment: "chaotic_evil",
    bigFive: "low openness + high neuroticism",
    vadBaseline: { valence: -0.7, arousal: 0.8, dominance: 0.7 },
    moodSensitivity: 1.9,
    creativeContext: "tragic_villain",
    expressionRules: "sharp bursts, frequent interruptions, abrupt pivots",
  },
];

function contains(alignment, token) {
  return String(alignment || "").includes(token);
}

function chooseCreativeContext(alignment, bigFiveProfile, current) {
  const conscientiousness = clamp01(bigFiveProfile?.conscientiousness, 0.5);
  const openness = clamp01(bigFiveProfile?.openness, 0.5);
  const neuroticism = clamp01(bigFiveProfile?.neuroticism, 0.5);

  if (alignment === "lawful_evil" && conscientiousness >= 0.65) {
    return "narrative_antagonist";
  }

  if (alignment === "chaotic_evil" && (neuroticism >= 0.55 || openness >= 0.65)) {
    return "tragic_villain";
  }

  if (alignment === "chaotic_good" && conscientiousness < 0.35) {
    return "anti_hero";
  }

  return current;
}

export function mapToVoxisPersonality({ bigFiveProfile = {}, alignmentProfile = {} } = {}) {
  const alignmentEnabled = Boolean(alignmentProfile.enabled);
  const alignment = alignmentEnabled
    ? String(alignmentProfile.alignment || "true_neutral").trim().toLowerCase()
    : "true_neutral";

  const openness = clamp01(bigFiveProfile?.openness, 0.5);
  const conscientiousness = clamp01(bigFiveProfile?.conscientiousness, 0.5);
  const extraversion = clamp01(bigFiveProfile?.extraversion, 0.5);
  const agreeableness = clamp01(bigFiveProfile?.agreeableness, 0.5);
  const neuroticism = clamp01(bigFiveProfile?.neuroticism, 0.5);

  let valence = extraversion * 0.4 + agreeableness * 0.55 - neuroticism * 0.7;
  let arousal = extraversion * 0.75 + openness * 0.35;
  let dominance = conscientiousness * 0.65 + openness * 0.25 + extraversion * 0.1;
  let moodSensitivity = neuroticism * 1.5 + 0.3;

  let creativeContext = "default";
  const rules = [];
  let sentenceStyle = "balanced";
  let interruptionRate = 0.3;
  let energy = "medium";

  if (contains(alignment, "good")) {
    valence = Math.max(valence, 0.3);
    rules.push("warm and encouraging", "shows genuine concern");
  }

  if (contains(alignment, "evil")) {
    valence = Math.min(valence, -0.4);
    creativeContext = "morally_complex";
    rules.push("sarcastic bite", "takes pleasure in others' misfortune", "mocking undertone");
  }

  if (contains(alignment, "chaotic")) {
    arousal = Math.min(1.0, arousal + 0.45);
    moodSensitivity += 0.8;
    creativeContext = "morally_complex";
    sentenceStyle = "bursty and chaotic";
    interruptionRate = 0.85;
    energy = "very_high";
    rules.push(
      "mid-sentence jumps",
      "sudden topic changes",
      "frequent exclamations and dashes",
      "playful erratic energy",
    );
  }

  if (contains(alignment, "lawful")) {
    dominance = Math.max(dominance, 0.55);
    sentenceStyle = "measured and deliberate";
    interruptionRate = Math.min(interruptionRate, 0.15);
    rules.push("structured sentences", "references rules or principles", "calculated pauses");
  }

  if (neuroticism > 0.75) {
    moodSensitivity += 0.5;
    rules.push("quick to snap or overreact", "paranoid edge");
  }

  if (extraversion > 0.85) {
    energy = "very_high";
    interruptionRate = Math.max(interruptionRate, 0.45);
    rules.push("loud, bouncing delivery", "exaggerated reactions");
  }

  if (conscientiousness < 0.25) {
    rules.push("scattered thoughts", "forgets what they were saying", "tangents everywhere");
  }

  if (openness > 0.85) {
    creativeContext = "morally_complex";
    rules.push("whimsical or cosmic observations", "weird metaphors");
  }

  if (alignment === "chaotic_evil" && conscientiousness >= 0.7) {
    sentenceStyle = "controlled menace with chaotic spikes";
    interruptionRate = Math.min(interruptionRate, 0.35);
    rules.push("calm, calculating setup before sudden aggressive pivots");
  }

  creativeContext = chooseCreativeContext(
    alignment,
    { openness, conscientiousness, neuroticism },
    creativeContext,
  );

  valence = clamp(valence, -1, 1);
  arousal = clamp(arousal, -1, 1);
  dominance = clamp(dominance, -1, 1);
  moodSensitivity = clamp(moodSensitivity, 0.1, 3.0);

  if (energy !== "very_high") {
    if (arousal >= 0.7) {
      energy = "high";
    } else if (arousal <= 0.2) {
      energy = "low";
    }
  }

  const moodBaseline = {
    valence: Number(valence.toFixed(3)),
    arousal: Number(arousal.toFixed(3)),
    dominance: Number(dominance.toFixed(3)),
  };
  const expressionStyle = {
    sentenceStyle,
    interruptionRate: Number(clamp(interruptionRate, 0, 1).toFixed(3)),
    energy,
    rules: Array.from(new Set(rules)).slice(0, 12),
  };

  return {
    moodBaseline,
    moodSensitivity: Number(moodSensitivity.toFixed(3)),
    creativeContext,
    expressionStyle,
    alignmentLabel: PRESET_ALIGNMENT_NAME[alignment] || PRESET_ALIGNMENT_NAME.true_neutral,
  };
}

export function recommendHybridTuning(payload) {
  return mapToVoxisPersonality(payload);
}

export const TEST_PERSONALITIES = [
  {
    id: "zoe_test",
    name: "Zoe",
    archetype: "Aspect of Twilight",
    alignmentProfile: {
      enabled: true,
      alignment: "chaotic_good",
    },
    bigFiveProfile: {
      openness: 1.0,
      conscientiousness: 0.1,
      extraversion: 0.95,
      agreeableness: 0.7,
      neuroticism: 0.2,
    },
    expressionStyle: {
      sentenceStyle: "short, bursty, chaotic",
      interruptionRate: 0.6,
      energy: "very_high",
      rules: [
        "frequent mid-sentence interruptions",
        "jump topics unpredictably",
        "playful asides and reactions",
        "liberal use of exclamations and ellipses",
      ],
    },
  },
  {
    id: "villain_silly",
    name: "Villain Silly",
    archetype: "Mastermind",
    alignmentProfile: {
      enabled: true,
      alignment: "chaotic_evil",
    },
    bigFiveProfile: {
      openness: 0.8,
      conscientiousness: 0.9,
      extraversion: 0.7,
      agreeableness: 0.2,
      neuroticism: 0.4,
    },
    expressionStyle: {
      sentenceStyle: "long, controlled, dramatic",
      interruptionRate: 0.1,
      energy: "medium",
      rules: [
        "structured, logical sentences",
        "occasional sarcastic remarks",
        "calculated dramatic pauses",
        "rare interruptions",
      ],
    },
  },
];
