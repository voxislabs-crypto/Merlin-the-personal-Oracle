export {
  buildAtmosphereRenderedDetail,
  resolveAtmosphereSourceEvent,
  type AtmosphereSourceEvent,
} from '@/lib/atmosphere/analytics';
export { assembleAtmosphereInput } from '@/lib/atmosphere/assemble-input';
export { buildAtmosphereTemporalInput } from '@/lib/atmosphere/temporal-context';
export { computeAtmosphereFromDashboardSources } from '@/lib/atmosphere/from-dashboard';
export { isAtmosphereEngineV1Enabled, type AtmosphereEngineFlagOptions } from '@/lib/atmosphere/flags';
export { normalizePredictiveIntensity, predictiveIntensityScore } from '@/lib/atmosphere/normalize';
export { applyPatternPersonalization, applyPatternReadinessNudge } from '@/lib/atmosphere/pattern-personalization';
export {
  buildPlanetPatternKey,
  buildTransitPatternKey,
  deriveSensitivityTags,
  feedbackSignalToSensitivity,
  resolveAtmospherePatternsContext,
  resolvePatternMatches,
  resolvePatternModifier,
} from '@/lib/atmosphere/pattern-tags';
export type * from '@/lib/atmosphere/pattern-types';
export { computeAtmosphere } from '@/lib/atmosphere/compute';
export {
  getJournalEntry,
  isJournalOptInEnabled,
  setJournalEntry,
  setJournalOptIn,
} from '@/lib/atmosphere/journal-store';
export {
  blendSentimentScore,
  buildRealityGuidance,
  computeCheckinSentimentScore,
  computeFeltIntensity,
  computeIntensityGap,
  computeReadinessModifier,
  computeRealityCheck,
  getTodayCheckinEntry,
  resolveGuidanceBranch,
  scoreJournalSentiment,
} from '@/lib/atmosphere/reality-check';
export { buildAtmosphereConfluenceSignals, computeAtmosphereConfluence } from '@/lib/atmosphere/confluence';
export { resolveDominantDriver } from '@/lib/atmosphere/headline';
export {
  applyBaselineModifier,
  applyCalibrationModifier,
  applyTripleHitAmplification,
  getBaselineTemperature,
  normalizeDayRating,
  resolveBaseIntensity,
  resolveConfidence,
} from '@/lib/atmosphere/intensity';
export { clampIntensity, resolveAtmosphereIntensity, resolveTone } from '@/lib/atmosphere/tone';
export type * from '@/lib/atmosphere/types';