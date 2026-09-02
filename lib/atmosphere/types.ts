import type { ExplainabilityPacket, TransitDriver } from '@/types/astrology';
import type { DayRating } from '@/lib/dashboard/cosmic-rating';

export type { DayRating };

export type AtmosphereToneLabel = 'Storm Watch' | 'Caution' | 'Mixed Weather' | 'Clear Flow';

export type AtmosphereToneIcon = 'storm' | 'rain' | 'mixed' | 'clear';

export type BaselineTemperature = 'cool' | 'neutral' | 'warm' | 'hot';

export type AtmosphereDriverSource =
  | 'pressure'
  | 'storm'
  | 'transit'
  | 'confluence'
  | 'forecast'
  | 'fallback';

export type IntensitySource = 'pressure' | 'storm' | 'forecast' | 'fallback';

export interface AtmosphereTone {
  label: AtmosphereToneLabel;
  icon: AtmosphereToneIcon;
  gradient: string;
  shellBg: string;
  border: string;
  text: string;
  glow: string;
}

export interface AtmosphereDriver {
  label: string;
  rationale: string;
  source: AtmosphereDriverSource;
}

export interface AtmosphereConfluence {
  aligned: boolean;
  tripleHit: boolean;
  themes: string[];
  signalCount: number;
  sources: string[];
}

export interface AtmosphereTemporalContext {
  progressedMoonSign?: string;
  progressedMoonDegree?: number;
  baselineTemperature: BaselineTemperature;
  lunarPhase?: string;
  lunarSign?: string;
  profectedSign?: string;
  profectedHouse?: number;
  timeLord?: string;
  themeOfYear?: string;
  solarArcAge?: number;
  solarArcHits?: Array<{
    directedPlanet: string;
    natalPlanet: string;
    aspect: string;
    orb: number;
  }>;
}

export interface AtmosphereCalibration {
  active: boolean;
  feedbackCount: number;
  strongestPlanet?: string;
  strongestMultiplier?: number;
}

export type RealityCheckSource = 'checkin' | 'journal' | 'checkin+journal' | 'none';

export type GuidanceBranch = 'neutral' | 'storm_calm' | 'storm_heavy' | 'calm_sky_heavy' | 'aligned';

export interface AtmosphereRealityCheck {
  sentimentScore: number | null;
  readinessModifier: number;
  feltIntensity: number;
  gap: number;
  guidanceBranch: GuidanceBranch;
  guidanceNote: string;
  source: RealityCheckSource;
}

export type { AtmospherePatternProfile, AtmospherePatternsContext } from '@/lib/atmosphere/pattern-types';

export interface AtmospherePacket {
  date: string;
  intensity: number;
  feltIntensity: number;
  readinessModifier: number;
  dayRating: DayRating;
  tone: AtmosphereTone;
  dominantDriver: AtmosphereDriver;
  /** Score-first transit impact forecast (friction windows, domains, disruption risk) */
  risk: LifeRiskPacket;
  temporal: AtmosphereTemporalContext;
  confluence: AtmosphereConfluence;
  calibration?: AtmosphereCalibration;
  realityCheck: AtmosphereRealityCheck;
  patterns: import('@/lib/atmosphere/pattern-types').AtmospherePatternsContext;
  confidence: number;
  provenance: string[];
  generatedAt: string;
}

export interface AtmosphereStormInput {
  title?: string;
  intensity?: 'severe' | 'moderate' | 'mild';
  intensityScore?: number;
  transitingPlanet?: string;
  natalPlanet?: string;
  aspect?: string;
  description?: string;
  date?: string;
  lifeArea?: string;
  phase?: 'brewing' | 'peak';
}

export interface AtmosphereStormsInput {
  storms?: AtmosphereStormInput[];
  weekSummary?: string;
  /** Noon-sampled day scores for the Forecast strip (friction + ease). */
  dayHorizon?: LifeRiskDayScore[];
}

export type LifeRiskDomain = 'love' | 'career' | 'money' | 'family' | 'health' | 'self';

export type LifeRiskLevel = 'calm' | 'watch' | 'friction' | 'storm';

export type LifeRiskWindowKind = 'friction' | 'support' | 'mixed';

export interface LifeRiskDriver {
  label: string;
  friction: number;
  kind: LifeRiskWindowKind;
  phase?: 'building' | 'peaking' | 'releasing';
  peakAt?: string;
  domains: LifeRiskDomain[];
  source: 'transit' | 'storm' | 'rating' | 'pressure';
}

export interface LifeRiskWindow {
  id: string;
  kind: LifeRiskWindowKind;
  label: string;
  phase?: 'building' | 'peaking' | 'releasing';
  startsAt?: string;
  peakAt?: string;
  endsAt?: string;
  daysToPeak?: number;
  friction: number;
  /** 0–100 supportive flow — used on the dual-series strip, not Storm Watch */
  ease?: number;
  confidence: number;
  domains: LifeRiskDomain[];
  source: 'transit' | 'storm';
}

/** One calendar day on the Forecast friction/ease strip. */
export interface LifeRiskDayScore {
  date: string;
  /** False = not calculated. Never treat as a quiet/good day. */
  scored: boolean;
  /** 0–100 hard pressure (squares, oppositions, malefic conjunctions) */
  friction: number;
  /** 0–100 supportive flow (trines/sextiles to personal points) */
  ease: number;
  frictionDriver?: string;
  easeDriver?: string;
}

export interface LifeRiskDomainScore {
  name: LifeRiskDomain;
  label: string;
  friction: number;
  support: number;
  hitCount: number;
}

/**
 * Score-first transit impact forecast: is life-friction elevated, when, where?
 * Narrative/story is optional and lives elsewhere.
 */
export interface LifeRiskPacket {
  date: string;
  windowDays: number;
  /** 0–100: how loud is hard-transit / life-friction pressure */
  overallFriction: number;
  level: LifeRiskLevel;
  /** True when challenging windows are elevated enough that material disruption is plausible */
  elevatedDisruption: boolean;
  confidence: number;
  headline: string;
  move: string;
  topDrivers: LifeRiskDriver[];
  frictionWindows: LifeRiskWindow[];
  supportWindows: LifeRiskWindow[];
  /** Day-by-day strip: one entry per displayed day. Not the Today Storm Watch score. */
  horizon: LifeRiskDayScore[];
  nextFrictionPeak: {
    label: string;
    peakAt?: string;
    daysToPeak?: number;
    friction: number;
  } | null;
  nextSupportPeak: {
    label: string;
    peakAt?: string;
    daysToPeak?: number;
    friction: number;
  } | null;
  domains: LifeRiskDomainScore[];
  provenance: string[];
  generatedAt: string;
}

export interface AtmospherePredictiveEventInput {
  eventId?: string;
  scores?: {
    intensity?: number;
    confidence?: number;
    volatility?: number;
  };
  transit?: {
    transitingPlanet?: string;
    aspect?: string;
    natalPlanet?: string;
  };
  timing?: {
    phase?: 'building' | 'peaking' | 'releasing';
    startsAt?: string;
    peakAt?: string;
    endsAt?: string;
    daysToPeak?: number;
    hoursToPeak?: number;
  };
  domains?: Array<{
    name?: LifeRiskDomain;
    impact?: number;
    valence?: number;
  }>;
  narrative?: {
    whisper?: string;
    risk?: string;
    opportunity?: string;
  };
}

export interface AtmospherePredictiveInput {
  events?: AtmospherePredictiveEventInput[];
  lunarTiming?: {
    phase?: string;
    illumination?: number;
    actionBias?: 'initiate' | 'build' | 'review' | 'release';
    isVoidOfCourse?: boolean;
    guidance?: string;
  };
  progressedMoon?: {
    sign?: string;
    degree?: number;
    emphasis?: Array<'love' | 'career' | 'money' | 'family' | 'health' | 'self'>;
  };
}

export interface AtmosphereForecastInput {
  day_rating?: string;
  planetaryHighlights?: string[];
  summary?: string;
}

export interface AtmosphereCalibrationInput {
  feedbackCount: number;
  strongestPlanet?: string;
  strongestMultiplier?: number;
}

export interface AtmosphereTemporalInput {
  profection?: {
    age: number;
    profectedHouse: number;
    profectedSign: string;
    timeLord: string;
    themeOfYear: string;
  };
  solarArc?: {
    ageYears: number;
    arcDegrees: number;
    activeHits: Array<{
      directedPlanet: string;
      natalPlanet: string;
      aspect: string;
      orb: number;
      score: number;
    }>;
  };
}

export interface AtmosphereCheckinInput {
  mood: number;
  stress: number;
  energy: number;
  confidence?: number | null;
}

export interface AtmosphereRealityCheckInput {
  checkin?: AtmosphereCheckinInput | null;
  journalText?: string | null;
}

export interface ComputeAtmosphereInput {
  date?: string;
  explainability?: ExplainabilityPacket | null;
  predictive?: AtmospherePredictiveInput | null;
  temporal?: AtmosphereTemporalInput | null;
  storms?: AtmosphereStormsInput | null;
  forecast?: AtmosphereForecastInput | null;
  calibration?: AtmosphereCalibrationInput | null;
  realityCheck?: AtmosphereRealityCheckInput | null;
  patterns?: import('@/lib/atmosphere/pattern-types').AtmospherePatternInput | null;
  moonPhase?: string;
  moonSign?: string;
}

export interface ResolvedIntensity {
  intensity: number;
  source: IntensitySource;
  provenance: string[];
}

export interface PressureDriverInput {
  globalPressure?: number;
  confidence?: number;
  topDrivers?: TransitDriver[];
}