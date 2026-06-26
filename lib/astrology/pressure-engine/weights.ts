import 'server-only';

export interface PressureWeights {
  outerPlanetMajor: number;
  saturnMajor: number;
  uranusMajor: number;
  plutoMajor: number;
  exactAspectBonus: number;
  houseActivationBonus: number;
  progressedMoonBonus: number;
  lunarPhaseMin: number;
  lunarPhaseMax: number;
  mercuryRetrogradeBase: number;
  mercuryRetrogradeActivated: number;
}

export const DEFAULT_PRESSURE_WEIGHTS: PressureWeights = {
  outerPlanetMajor: 1.0,
  saturnMajor: 0.9,
  uranusMajor: 0.85,
  plutoMajor: 1.0,
  exactAspectBonus: 0.25,
  houseActivationBonus: 0.2,
  progressedMoonBonus: 0.15,
  lunarPhaseMin: 0.05,
  lunarPhaseMax: 0.1,
  mercuryRetrogradeBase: 0.03,
  mercuryRetrogradeActivated: 0.12,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
