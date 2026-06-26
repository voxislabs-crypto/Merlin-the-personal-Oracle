import type { ExplainabilityPacket, TransitDriver } from '@/types/astrology';
import type { DayRating } from '@/lib/dashboard/cosmic-rating';

export type { DayRating };

export type AtmosphereToneLabel = 'Storm Watch' | 'Caution' | 'Mixed Skies' | 'Smooth Flow';

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
}

export interface AtmosphereStormsInput {
  storms?: AtmosphereStormInput[];
  weekSummary?: string;
}

export interface AtmospherePredictiveEventInput {
  eventId?: string;
  scores?: {
    intensity?: number;
    confidence?: number;
  };
  transit?: {
    transitingPlanet?: string;
    aspect?: string;
    natalPlanet?: string;
  };
  narrative?: {
    whisper?: string;
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