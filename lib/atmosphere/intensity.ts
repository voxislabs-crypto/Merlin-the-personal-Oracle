import { ratingToIntensity, type DayRating } from '@/lib/dashboard/cosmic-rating';
import type {
  AtmosphereCalibrationInput,
  AtmosphereForecastInput,
  BaselineTemperature,
  ComputeAtmosphereInput,
  IntensitySource,
  ResolvedIntensity,
} from '@/lib/atmosphere/types';
import type { AtmospherePredictiveInput, AtmosphereStormInput } from '@/lib/atmosphere/types';
import { normalizePredictiveIntensity } from '@/lib/atmosphere/normalize';
import { clampIntensity } from '@/lib/atmosphere/tone';

const CHALLENGING_MOON_SIGNS = new Set(['Scorpio', 'Capricorn', 'Aquarius', 'Virgo']);
const SUPPORTIVE_MOON_SIGNS = new Set(['Taurus', 'Cancer', 'Pisces', 'Sagittarius', 'Leo']);

export function resolveBaseIntensity(input: ComputeAtmosphereInput): ResolvedIntensity {
  const pressureIntensity = intensityFromPressure(input);
  if (pressureIntensity !== null) {
    return {
      intensity: pressureIntensity,
      source: 'pressure',
      provenance: ['pressure-engine'],
    };
  }

  const stormIntensity = intensityFromStorm(input.storms?.storms?.[0]);
  if (stormIntensity !== null) {
    return {
      intensity: stormIntensity,
      source: 'storm',
      provenance: ['storms'],
    };
  }

  if (input.forecast?.day_rating) {
    return {
      intensity: ratingToIntensity(input.forecast.day_rating),
      source: 'forecast',
      provenance: ['forecast-day-rating'],
    };
  }

  return {
    intensity: 55,
    source: 'fallback',
    provenance: ['fallback-neutral'],
  };
}

function intensityFromPressure(input: ComputeAtmosphereInput): number | null {
  const globalPressure = input.explainability?.globalPressure;
  if (typeof globalPressure === 'number' && Number.isFinite(globalPressure)) {
    return clampIntensity(globalPressure);
  }

  const topEventIntensity = normalizePredictiveIntensity(input.predictive?.events?.[0]?.scores?.intensity);
  if (topEventIntensity !== null) {
    return topEventIntensity;
  }

  return null;
}

function intensityFromStorm(storm?: AtmosphereStormInput): number | null {
  if (!storm) return null;

  if (typeof storm.intensityScore === 'number' && Number.isFinite(storm.intensityScore)) {
    return clampIntensity(Math.min(100, storm.intensityScore * 10));
  }

  if (storm.intensity === 'severe') return 86;
  if (storm.intensity === 'moderate') return 68;
  if (storm.intensity === 'mild') return 52;

  return null;
}

export function getBaselineTemperature(
  progressedMoon?: AtmospherePredictiveInput['progressedMoon']
): BaselineTemperature {
  if (!progressedMoon) return 'neutral';

  const sign = progressedMoon.sign;
  const emphasis = progressedMoon.emphasis ?? [];

  if ((sign && CHALLENGING_MOON_SIGNS.has(sign)) || emphasis.includes('health')) {
    return 'hot';
  }

  if (sign && SUPPORTIVE_MOON_SIGNS.has(sign)) {
    return 'cool';
  }

  if (emphasis.includes('career') || emphasis.includes('self') || emphasis.includes('love')) {
    return 'warm';
  }

  return 'neutral';
}

export function applyBaselineModifier(intensity: number, temperature: BaselineTemperature): number {
  switch (temperature) {
    case 'hot':
      return clampIntensity(intensity * 1.1);
    case 'warm':
      return clampIntensity(intensity * 1.05);
    case 'cool':
      return clampIntensity(intensity * 0.95);
    default:
      return clampIntensity(intensity);
  }
}

export function applyCalibrationModifier(
  intensity: number,
  calibration?: AtmosphereCalibrationInput | null
): { intensity: number; provenance: string[] } {
  if (!calibration?.strongestMultiplier || !calibration.strongestPlanet) {
    return { intensity: clampIntensity(intensity), provenance: [] };
  }

  if (calibration.feedbackCount < 3) {
    return { intensity: clampIntensity(intensity), provenance: [] };
  }

  const modifier = calibration.strongestMultiplier;
  return {
    intensity: clampIntensity(intensity * modifier),
    provenance: [`calibration-${calibration.strongestPlanet}`],
  };
}

export function normalizeDayRating(forecast: AtmosphereForecastInput | null | undefined, intensity: number): DayRating {
  const raw = forecast?.day_rating?.toLowerCase();

  if (raw === 'green' || raw === 'very positive' || raw === 'positive') {
    return 'green';
  }

  if (raw === 'red' || raw === 'challenging' || raw === 'very challenging') {
    return 'red';
  }

  if (raw === 'yellow' || raw === 'neutral') {
    return 'yellow';
  }

  if (intensity <= 45) return 'green';
  if (intensity <= 65) return 'yellow';
  return 'red';
}

export function applyTripleHitAmplification(
  intensity: number,
  confidence: number,
  tripleHit: boolean
): { intensity: number; confidence: number; provenance: string[] } {
  if (!tripleHit) {
    return {
      intensity: clampIntensity(intensity),
      confidence: clampIntensity(confidence),
      provenance: [],
    };
  }

  return {
    intensity: clampIntensity(intensity * 1.25),
    confidence: clampIntensity(confidence + 10),
    provenance: ['triple-hit-amplification'],
  };
}

export function resolveConfidence(input: ComputeAtmosphereInput, source: IntensitySource): number {
  const explainabilityConfidence = input.explainability?.confidence;
  if (typeof explainabilityConfidence === 'number' && Number.isFinite(explainabilityConfidence)) {
    return clampIntensity(explainabilityConfidence);
  }

  const eventConfidence = input.predictive?.events?.[0]?.scores?.confidence;
  if (typeof eventConfidence === 'number' && Number.isFinite(eventConfidence)) {
    return clampIntensity(eventConfidence * 100);
  }

  switch (source) {
    case 'pressure':
      return 72;
    case 'storm':
      return 68;
    case 'forecast':
      return 64;
    default:
      return 55;
  }
}