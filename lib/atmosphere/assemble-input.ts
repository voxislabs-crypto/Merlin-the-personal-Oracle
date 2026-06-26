import type { AtmospherePatternInput } from '@/lib/atmosphere/pattern-types';
import type {
  AtmosphereCalibrationInput,
  AtmosphereForecastInput,
  AtmospherePredictiveInput,
  AtmosphereRealityCheckInput,
  AtmosphereStormsInput,
  AtmosphereTemporalInput,
  ComputeAtmosphereInput,
} from '@/lib/atmosphere/types';
import type { ExplainabilityPacket } from '@/types/astrology';

export interface AtmosphereSourceBundle {
  date?: string;
  explainability?: ExplainabilityPacket | null;
  predictive?: AtmospherePredictiveInput | null;
  storms?: AtmosphereStormsInput | null;
  forecast?: AtmosphereForecastInput | null;
  calibration?: AtmosphereCalibrationInput | null;
  temporal?: AtmosphereTemporalInput | null;
  realityCheck?: AtmosphereRealityCheckInput | null;
  patterns?: AtmospherePatternInput | null;
  moonPhase?: string;
  moonSign?: string;
}

export function assembleAtmosphereInput(bundle: AtmosphereSourceBundle): ComputeAtmosphereInput {
  return {
    date: bundle.date,
    explainability: bundle.explainability ?? null,
    predictive: bundle.predictive ?? null,
    storms: bundle.storms ?? null,
    forecast: bundle.forecast ?? null,
    calibration: bundle.calibration ?? null,
    temporal: bundle.temporal ?? null,
    realityCheck: bundle.realityCheck ?? null,
    patterns: bundle.patterns ?? null,
    moonPhase: bundle.moonPhase,
    moonSign: bundle.moonSign,
  };
}