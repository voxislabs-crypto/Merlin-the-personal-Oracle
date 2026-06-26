import { ratingToIntensity } from '@/lib/dashboard/cosmic-rating';

export interface LegacyIntensityStorm {
  intensity?: 'severe' | 'moderate' | 'mild';
  intensityScore?: number;
}

export interface LegacyIntensityInput {
  storms?: LegacyIntensityStorm[];
  dayRating?: string;
  topPressureIntensity?: number | null;
}

export function intensityFromLegacyStorm(storm?: LegacyIntensityStorm): number | null {
  if (!storm) return null;

  if (typeof storm.intensityScore === 'number' && Number.isFinite(storm.intensityScore)) {
    return Math.round(Math.min(100, storm.intensityScore * 10));
  }

  if (storm.intensity === 'severe') return 86;
  if (storm.intensity === 'moderate') return 68;
  if (storm.intensity === 'mild') return 52;

  return null;
}

export function resolveLegacyCosmicWeatherIntensity(input: LegacyIntensityInput): number {
  const topStorm = input.storms?.[0];
  const stormIntensity = intensityFromLegacyStorm(topStorm);
  if (stormIntensity !== null) {
    return stormIntensity;
  }

  if (input.dayRating) {
    return ratingToIntensity(input.dayRating);
  }

  if (typeof input.topPressureIntensity === 'number' && Number.isFinite(input.topPressureIntensity)) {
    return Math.round(Math.min(100, Math.max(20, input.topPressureIntensity * 100)));
  }

  return 55;
}