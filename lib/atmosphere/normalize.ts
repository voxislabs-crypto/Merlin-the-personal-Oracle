import { clampIntensity } from '@/lib/atmosphere/tone';

/** Predictive event intensity may arrive as 0-1 or 0-100 depending on source. */
export function normalizePredictiveIntensity(value?: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  if (value <= 1) {
    return clampIntensity(Math.min(100, Math.max(20, value * 100)));
  }

  return clampIntensity(value);
}

export function predictiveIntensityScore(value?: number): number {
  return normalizePredictiveIntensity(value) ?? 0;
}