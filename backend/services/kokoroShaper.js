import { applyProsodyToKokoroText } from "./prosodyCompiler.js";

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTerm(value) {
  return String(value || "").trim().toLowerCase();
}

function detectMoodLabel(mood) {
  if (typeof mood === "string") {
    return mood.trim().toLowerCase();
  }

  if (mood && typeof mood === "object") {
    const explicit = String(mood.label || mood.name || mood.state || "").trim().toLowerCase();
    if (explicit) {
      return explicit;
    }

    const valence = Number(mood.valence);
    const arousal = Number(mood.arousal);

    if (Number.isFinite(valence) && Number.isFinite(arousal)) {
      if (valence >= 0.35 && arousal >= 0.25) return "happy";
      if (valence <= -0.35 && arousal <= -0.1) return "sad";
      if (valence <= -0.2 && arousal >= 0.35) return "angry";
      if (arousal <= -0.45) return "calm";
    }
  }

  return "";
}

function applyPhrasingShape(text, phrasing) {
  let output = String(text || "");

  if (phrasing === "bursty") {
    output = output
      .replace(/([.!?])\s+/g, "$1... ")
      .replace(/,\s+/g, ",... ")
      .replace(/;\s+/g, "... ");
  } else if (phrasing === "measured") {
    output = output
      .replace(/([.!?])\s+/g, "$1 ... ")
      .replace(/,\s+/g, ", ");
  }

  return output;
}

function applyEmphasisWords(text, emphasisWords = []) {
  let output = String(text || "");
  const seen = new Set();

  for (const item of Array.isArray(emphasisWords) ? emphasisWords : []) {
    const term = normalizeTerm(item?.term);
    if (!term || seen.has(term)) {
      continue;
    }
    seen.add(term);

    const regex = new RegExp(`\\b(${escapeRegExp(term)})\\b`, "gi");
    output = output.replace(regex, (match) => match.toUpperCase());
  }

  return output;
}

function applyMoodShape(text, moodLabel) {
  let output = String(text || "");

  if (moodLabel === "happy") {
    output = output
      .replace(/\.{3,}/g, "..")
      .replace(/([.!?])\s+/g, "$1 ");
  } else if (moodLabel === "sad") {
    output = output
      .replace(/([.!?])\s+/g, "$1... ")
      .replace(/\b([A-Z]{2,})\b/g, (match) => match.toLowerCase());
  } else if (moodLabel === "angry") {
    output = output
      .replace(/([!?])\s+/g, "$1! ")
      .replace(/\b(really|never|stop|listen|enough|seriously)\b/gi, (word) => word.toUpperCase());
  } else if (moodLabel === "calm") {
    output = output.replace(/([.!?])\s+/g, "$1 ... ");
  }

  return output;
}

function cleanupShapedText(text) {
  return String(text || "")
    .replace(/\*+/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\.{5,}/g, "....")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();
}

export function shapeForKokoro(text, envelope = {}) {
  let processed = applyProsodyToKokoroText(text, envelope);

  if (String(envelope?.source?.styleMode || "").toLowerCase() === "precision") {
    return cleanupShapedText(processed);
  }

  const phrasing = String(envelope?.provider?.kokoro?.phrasing || envelope?.phrasing || "balanced").toLowerCase();
  const emphasisWords = envelope?.emphasis?.words || [];
  const moodLabel = detectMoodLabel(envelope?.mood || envelope?.moodLabel || null);

  processed = applyPhrasingShape(processed, phrasing);
  processed = applyEmphasisWords(processed, emphasisWords);
  processed = applyMoodShape(processed, moodLabel);

  return cleanupShapedText(processed);
}
