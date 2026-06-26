export type AtmospherePatternType = 'planet' | 'transit' | 'tag';

export type AtmosphereSensitivityTag =
  | 'emotional_reactivity'
  | 'work_pressure'
  | 'energy_drain'
  | 'clarity_boost'
  | 'stress_reactivity'
  | 'validation_loop';

export interface AtmospherePatternRecord {
  patternKey: string;
  patternType: AtmospherePatternType;
  sensitivityScore: number;
  sampleCount: number;
  confidence: number;
  tags: AtmosphereSensitivityTag[];
  lastSeenAt?: string;
}

export interface AtmospherePatternProfile {
  userId: string;
  patterns: AtmospherePatternRecord[];
  tagWeights: Partial<Record<AtmosphereSensitivityTag, number>>;
  summary: {
    patternCount: number;
    feedbackSamples: number;
    checkinSamples: number;
    strongestPatternKey?: string;
    strongestSensitivity?: number;
  };
}

export interface AtmosphereActiveTransit {
  transitingPlanet?: string;
  natalPlanet?: string;
  aspect?: string;
  label?: string;
}

export interface AtmospherePatternInput {
  profile?: AtmospherePatternProfile | null;
  activeTransits?: AtmosphereActiveTransit[];
}

export interface AtmospherePatternMatch {
  patternKey: string;
  patternType: AtmospherePatternType;
  sensitivityScore: number;
  confidence: number;
  tags: AtmosphereSensitivityTag[];
}

export interface AtmospherePatternsContext {
  active: AtmospherePatternMatch[];
  modifier: number;
  tags: AtmosphereSensitivityTag[];
  provenance: string[];
}