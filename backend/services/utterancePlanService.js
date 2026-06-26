import { buildAssistantPresentation } from "./chatPresentationService.js";
import { buildStateDriftDirectives, normalizeStateFlaws } from "./stateFlawService.js";

function clamp01(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, n));
}

function toFixedNumber(value, digits = 3) {
  return Number(clamp01(value, 0).toFixed(digits));
}

export function buildUtterancePlan({
  reply,
  stateFlaws,
  mode = "normal",
} = {}) {
  const rawText = String(reply || "");
  const presentation = buildAssistantPresentation(rawText);
  const normalizedState = normalizeStateFlaws(stateFlaws);
  const directives = buildStateDriftDirectives(normalizedState);

  const displayText = String(presentation.displayReply || rawText);
  const speechText = displayText || rawText;

  return {
    mode: String(mode || "normal").trim().toLowerCase() || "normal",
    rawText,
    displayText,
    speechText,
    isPerformanceOutput: Boolean(presentation.isPerformanceOutput),
    speechImpulses: {
      coherencePenalty: toFixedNumber(directives.coherencePenalty),
      fragmentation: toFixedNumber(directives.fragmentation),
      interruptions: toFixedNumber(directives.interruptions),
      tangentChance: toFixedNumber(directives.tangentChance),
      fillerRate: toFixedNumber(directives.fillerRate),
      impulseBurpChance: toFixedNumber(directives.impulseBurpChance),
      stabilityIndex: toFixedNumber(directives.stabilityIndex),
      readabilityFloor: toFixedNumber(directives.readabilityFloor),
    },
    stateSnapshot: {
      intoxication: toFixedNumber(normalizedState.intoxication.level),
      fatigue: toFixedNumber(normalizedState.fatigue.level),
      agitation: toFixedNumber(normalizedState.agitation.level),
      focus: toFixedNumber(normalizedState.focus.level),
    },
  };
}
