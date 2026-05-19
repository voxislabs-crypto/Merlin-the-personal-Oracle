import 'server-only';

import { clamp } from './weights';

export interface PersonalizationInputs {
  basePressure: number;
  personalityModifier?: number;
  calibrationModifier?: number;
}

export function applyPersonalization(inputs: PersonalizationInputs): number {
  const personality = clamp(inputs.personalityModifier ?? 1, 0.8, 1.2);
  const calibration = clamp(inputs.calibrationModifier ?? 1, 0.85, 1.25);
  return clamp(inputs.basePressure * personality * calibration, 0, 100);
}
