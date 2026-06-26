import 'server-only';

import { clamp } from './weights';

export interface TemporalInputs {
  classWeight: number;
  exactnessFactor: number;
  durationFactor: number;
  stackFactor: number;
  activationFactor: number;
}

export function computeTemporalPressure(inputs: TemporalInputs): number {
  const raw =
    inputs.classWeight *
    inputs.exactnessFactor *
    inputs.durationFactor *
    inputs.stackFactor *
    inputs.activationFactor;

  return clamp(raw, 0, 2);
}

export function normalizePressureScore(rawPressure: number): number {
  // Normalize a practical internal range into a user-facing 0-100 score.
  return clamp(Math.round(rawPressure * 50), 0, 100);
}
