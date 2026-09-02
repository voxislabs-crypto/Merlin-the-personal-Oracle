export {
  buildAtmosphereRenderedDetail,
  resolveAtmosphereSourceEvent,
  type AtmosphereSourceEvent,
} from '@/lib/atmosphere/analytics';
export { assembleAtmosphereInput } from '@/lib/atmosphere/assemble-input';
export { buildAtmosphereTemporalInput } from '@/lib/atmosphere/temporal-context';
export { computeAtmosphereFromDashboardSources } from '@/lib/atmosphere/from-dashboard';
export {
  intensityFromLegacyStorm,
  resolveLegacyCosmicWeatherIntensity,
} from '@/lib/atmosphere/legacy-intensity';
export { isAtmosphereEngineV1Enabled, type AtmosphereEngineFlagOptions } from '@/lib/atmosphere/flags';
export { computeDaySkyPressure, isSkyEventActiveOnDate } from '@/lib/atmosphere/global-pressure';
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
  computeLifeRisk,
  lifeRiskLevelPresentation,
  buildLifeRiskHorizon,
  formatHorizonTooltip,
  isHorizonFlowWindow,
  DEFAULT_RISK_WINDOW_DAYS,
  type ComputeLifeRiskInput,
} from '@/lib/atmosphere/life-risk';
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
  getCheckinForCalendarDate,
  getTodayCheckinEntry,
  getYesterdayCheckinEntry,
  resolveGuidanceBranch,
  scoreJournalSentiment,
} from '@/lib/atmosphere/reality-check';
export { buildAtmosphereConfluenceSignals, computeAtmosphereConfluence } from '@/lib/atmosphere/confluence';
export { resolveDominantDriver } from '@/lib/atmosphere/headline';
export {
  composeTodayOracle,
  gatherTodayFacts,
  mergeFactsIntoThemes,
  selectThemeWithNovelty,
  type TodayOracleBrief,
  type TodayMoveMemory,
} from '@/lib/atmosphere/today-oracle';
export {
  buildFeltStory,
  buildLifeWeatherBrief,
  buildTodayMove,
  buildWhyDriverPills,
  formatWhyLine,
  frictionLeadForWhy,
  isFluffyLifeWeatherCopy,
  isGenericTodayMove,
  looksLikeTechnicalTransit,
  pickDailyTransitDo,
  resolveWhyDomains,
  type BuildLifeWeatherBriefInput,
  type LifeWeatherBriefCopy,
  type TransitDoSource,
  type WhyDriverPill,
} from '@/lib/atmosphere/life-weather-copy';
export {
  buildDomainStripItems,
  buildPersonalGreeting,
  domainTrendFromScores,
  resolveRiskPercent,
  timeOfDayGreeting,
  type DomainStripItem,
  type DomainTrend,
} from '@/lib/atmosphere/domain-strip';
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