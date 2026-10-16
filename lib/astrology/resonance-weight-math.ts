import { CALIBRATION_MIN_SAMPLES, regularizeCalibrationMultiplier } from '@/lib/atmosphere/intensity';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Planet-family weights stay at 1 until there is a real sample, then shrink
 * toward neutral. A handful of hits must not read as a calibrated boost.
 */
export function resolvePlanetResonanceMultiplier(sampleSize: number, averageSignal: number): number {
  if (!Number.isFinite(sampleSize) || sampleSize < CALIBRATION_MIN_SAMPLES) return 1;
  if (!Number.isFinite(averageSignal) || averageSignal === 0) return 1;
  const confidence = Math.min(1, Math.sqrt(sampleSize / 6));
  const raw = clamp(1 + averageSignal * 0.3 * confidence, 0.75, 1.35);
  return Number(regularizeCalibrationMultiplier(raw).toFixed(2));
}
