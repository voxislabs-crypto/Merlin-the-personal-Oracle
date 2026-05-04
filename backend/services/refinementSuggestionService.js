const NON_TRAIT_PHRASES = new Set([
  "hello",
  "hi",
  "hey",
  "yo",
  "sup",
  "thanks",
  "thank you",
  "ok",
  "okay",
  "cool",
  "nice",
]);

const SIGNAL_RE = /\b(trait|traits|quirk|quirks|flavor|flavour|variant|variants|option|options|clarify|clarification|question|questions|persona|tone|style|archetype|temperament)\b/i;
const LIST_ITEM_RE = /^(?:[-*•]|\d+[.)])\s+(.+)/;
const SECTION_RE = /\b(traits?|quirks?|options?|variants?|clarifications?|questions?)\s*:\s*([^\n]+)/gi;

function normalizeLabel(raw) {
  const cleaned = String(raw || "")
    .replace(/^[-*•\d.)\s]+/, "")
    .replace(/^['"`]|['"`]+$/g, "")
    .replace(/[.,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";
  if (NON_TRAIT_PHRASES.has(cleaned.toLowerCase())) return "";
  if (cleaned.length < 3 || cleaned.length > 80) return "";
  return cleaned;
}

function inferTag(text, fallback = "Trait") {
  const value = String(text || "").toLowerCase();
  if (value.includes("quirk")) return "Quirk";
  if (value.includes("question") || value.includes("clarif") || value.includes("?")) return "Clarify";
  if (value.includes("style") || value.includes("tone")) return "Style";
  if (value.includes("goal")) return "Goal";
  return fallback;
}

function isLikelyCandidate(label) {
  const normalized = normalizeLabel(label);
  if (!normalized) return false;
  const words = normalized.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length > 7) return false;
  if (words.length === 1 && NON_TRAIT_PHRASES.has(words[0])) return false;
  return true;
}

function dedupe(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const label = normalizeLabel(item?.label);
    if (!label || !isLikelyCandidate(label)) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ label, tag: item?.tag || "Trait" });
  }
  return result;
}

export function extractRefinementSuggestions({ assistantReply = "", userMessage = "" } = {}) {
  const text = String(assistantReply || "").trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const suggestions = [];

  for (const line of lines) {
    const match = line.match(LIST_ITEM_RE);
    if (!match) continue;
    const label = normalizeLabel(match[1]);
    if (!label) continue;
    suggestions.push({ label, tag: inferTag(line, "Trait") });
  }

  let sectionMatch = null;
  while ((sectionMatch = SECTION_RE.exec(text)) !== null) {
    const heading = sectionMatch[1] || "";
    const body = sectionMatch[2] || "";
    for (const token of body.split(/[,;/]|\s+\|\s+/)) {
      const label = normalizeLabel(token);
      if (!label) continue;
      suggestions.push({ label, tag: inferTag(heading, "Trait") });
    }
  }

  if (!suggestions.length && SIGNAL_RE.test(text)) {
    for (const line of lines) {
      if (!line.includes("?")) continue;
      const label = normalizeLabel(line);
      if (!label) continue;
      const words = label.split(/\s+/).filter(Boolean);
      if (words.length <= 14) {
        suggestions.push({ label, tag: "Clarify" });
      }
    }
  }

  const userAskedForRefinement = SIGNAL_RE.test(String(userMessage || ""));
  const hasStructuredSignals = suggestions.length > 0;
  if (!userAskedForRefinement && !hasStructuredSignals) {
    return [];
  }

  return dedupe(suggestions).slice(0, 10);
}
