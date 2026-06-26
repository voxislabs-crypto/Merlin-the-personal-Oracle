function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Proportional VAD → voice mapping
//
// Previous system used binary on/off thresholds (arousal >= 0.6 → rate 1.16x).
// This version maps continuously so mood shifts produce proportional changes,
// and an active emotional state (from preference triggers or social signals)
// unlocks a "burst" path with stronger swings.
//
// Rate:  arousal [-1,1]   → factor in [0.80, 1.30]  (burst: [0.74, 1.40])
// Pitch: dominance [-1,1] → factor in [0.91, 1.06]  (burst: [0.86, 1.10])
// ---------------------------------------------------------------------------

const RATE_SCALE_NORMAL = 0.22;   // max ±22% for normal turns
const RATE_SCALE_BURST  = 0.33;   // max ±33% when emotional burst is active
const PITCH_SCALE_NORMAL = 0.07;  // max ±7% pitch on dominance
const PITCH_SCALE_BURST  = 0.12;  // max ±12% when burst is active

export function applyMoodToVoice(voiceProfile = {}, mood = {}) {
  const output = { ...voiceProfile };
  const baseRate  = Number(voiceProfile?.rate)  || 1;
  const basePitch = Number(voiceProfile?.pitch) || 1;
  const arousal   = Number(mood?.arousal);
  const dominance = Number(mood?.dominance);

  // Detect whether an active emotional state (from preference trigger or
  // social signal) warrants the amplified burst path.
  const emotionalState = mood?.emotionalState;
  const burstActive =
    emotionalState?.active === true &&
    Number(emotionalState?.intensity || 0) >= 2;
  const rateScale  = burstActive ? RATE_SCALE_BURST  : RATE_SCALE_NORMAL;
  const pitchScale = burstActive ? PITCH_SCALE_BURST : PITCH_SCALE_NORMAL;

  // Rate — proportional to arousal, clamped to safe synthesis range.
  if (Number.isFinite(arousal)) {
    output.rate = clamp(baseRate * (1 + arousal * rateScale), 0.6, 1.6);
  } else {
    output.rate = clamp(baseRate, 0.6, 1.6);
  }

  // Pitch — higher dominance → slightly lower pitch (confident/commanding);
  // lower dominance → slightly higher pitch (submissive/yielding).
  // Burst path widens the effect.
  if (Number.isFinite(dominance)) {
    output.pitch = clamp(basePitch * (1 - dominance * pitchScale), 0.5, 1.6);
  } else {
    output.pitch = clamp(basePitch, 0.5, 1.6);
  }

  return output;
}

// ---------------------------------------------------------------------------
// Build a natural-language emotion hint for cloud TTS `instructions` when an
// emotional state is active. This gives providers like OpenAI TTS a semantic
// cue on top of the numeric rate/pitch adjustments.
//
// Returns an empty string when no active state is present (no-op).
// ---------------------------------------------------------------------------

const EMOTION_FAMILY_MAP = {
  "cold fury":           "Speak with cold fury barely restrained beneath a controlled surface.",
  "explosive rage":      "Speak with explosive, barely-contained rage. Short, sharp, dangerous.",
  "contemptuous anger":  "Speak with contemptuous, dismissive anger. Every word drips disdain.",
  "irritated displeasure": "Speak with clear irritation. Clipped, impatient, edged with annoyance.",
  "firm hurt":           "Speak with firm but hurt conviction. Steady, disappointed.",
  "warm gratitude":      "Speak with genuine warmth and gratitude. Open and gentle.",
  "giddy pride":         "Speak with barely-contained glee and pride. Bright, fast, triumphant.",
  "wild momentum":       "Speak with wild, infectious energy. Rapid and electric.",
  "bright encouragement": "Speak with bright encouragement and warmth. Uplifting and clear.",
  "excited delight":     "Speak with excited delight — let the enthusiasm spill through.",
  "softened playfulness": "Speak with playful lightness. Warm and a little mischievous.",
};

export function buildEmotionalVoiceInstruction(mood = {}) {
  const state = mood?.emotionalState;
  if (!state?.active || Number(state?.intensity || 0) < 1) return "";

  const family  = String(state.emotionFamily || "").toLowerCase();
  const signal  = String(state.signal || "").toLowerCase();
  const intensity = Number(state.intensity || 0);

  // Direct family match.
  for (const [key, hint] of Object.entries(EMOTION_FAMILY_MAP)) {
    if (family.includes(key)) return hint;
  }

  // Fallback based on signal + intensity.
  if (signal === "insult" || signal === "criticism") {
    return intensity >= 3
      ? "Speak with sharp, undisguised anger. Terse and cutting."
      : "Speak with audible displeasure and tension.";
  }
  if (signal === "praise" || signal === "warmth" || signal === "hype") {
    return intensity >= 3
      ? "Speak with genuine, vibrant excitement and warmth."
      : "Speak with a warm, positive tone.";
  }

  return "";
}