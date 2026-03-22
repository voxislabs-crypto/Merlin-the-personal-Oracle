import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';

interface PredictiveLifeStage {
  id: string;
  label: string;
  active: boolean;
  windowStartAge: number;
  windowEndAge: number;
  note: string;
}

interface PredictiveEvent {
  eventId: string;
  transit: {
    transitingPlanet: string;
    transitingSign: string;
    natalPlanet: string;
    natalSign?: string;
    aspect: string;
    orb: number;
    exact: boolean;
    shortDescription: string;
    description: string;
    orbNow: number;
    orbAtPeak: number;
  };
  timing: {
    phase: 'building' | 'peaking' | 'releasing';
    startsAt: string;
    peakAt: string;
    endsAt: string;
    daysToPeak: number;
    hoursToPeak: number;
  };
  scores: {
    intensity: number;
    confidence: number;
    volatility: number;
    learnedAdjustment: number;
    resonanceMultiplier?: number;
  };
  explanation: {
    aspectWeight: number;
    transitPlanetWeight: number;
    natalPointWeight: number;
    orbFactor: number;
    lifeStageBoost: number;
    mbtiModifier: number;
    contextMultiplier: number;
    progressedMoonBoost: number;
    lunarTimingModifier: number;
    learnedAdjustment: number;
    contextSignals: string[];
    lunarSignals: string[];
  };
  domains: Array<{
    name: 'love' | 'career' | 'money' | 'family' | 'health' | 'self';
    impact: number;
    valence: number;
  }>;
  lifeStage: {
    tag: string;
    active: boolean;
    note: string;
  };
  mbtiLens: {
    likelyPattern: string;
    blindSpot: string;
    bestMove24h: string;
    avoidNow: string;
  };
  narrative: {
    vibe: string;
    risk: string;
    opportunity: string;
    whisper: string;
  };
}

interface ConfluenceSignal {
  signalId: string;
  source: 'transit' | 'lunar' | 'progressed-moon';
  label: string;
  score: number;
  phase: 'building' | 'peak' | 'integrating';
  details?: string;
}

interface ConfluenceTheme {
  theme: 'transformation' | 'love' | 'career' | 'inner work' | 'communication' | 'abundance';
  title: string;
  headline: string;
  summary: string;
  score: number;
  signalCount: number;
  dominantPhase: 'building' | 'peak' | 'integrating';
  signals: ConfluenceSignal[];
}

interface TransitWindowPoint {
  label: string;
  phase: 'building' | 'peak' | 'integrating';
  at: string;
}

interface TransitWindow {
  eventId: string;
  title: string;
  subtitle: string;
  startsAt: string;
  exactAt: string;
  endsAt: string;
  currentPhase: 'building' | 'peak' | 'integrating';
  durationHours: number;
  intensity: number;
  points: TransitWindowPoint[];
}

interface ResonanceTimelineEntry {
  feedbackId: string;
  date: string;
  label: string;
  theme: string;
  resonated: boolean;
  accuracyScore: number;
  planets: string[];
}

interface ResonanceProfile {
  multipliers: Record<string, number>;
  planetBreakdown: Record<string, {
    multiplier: number;
    sampleSize: number;
    averageSignal: number;
    averageAccuracy: number;
    wins: number;
    misses: number;
  }>;
  history: ResonanceTimelineEntry[];
  summary: {
    feedbackCount: number;
    strongestPlanet?: string;
    strongestMultiplier?: number;
  };
}

export interface TransitData {
  all: Array<{
    transitingPlanet: string;
    transitingSign: string;
    natalPlanet: string;
    natalSign?: string;
    aspect: string;
    orb: number;
    exact: boolean;
    shortDescription: string;
    description: string;
  }>;
  significant: Array<{
    transitingPlanet: string;
    transitingSign: string;
    natalPlanet: string;
    natalSign?: string;
    aspect: string;
    orb: number;
    exact: boolean;
    shortDescription: string;
    description: string;
  }>;
  approaching: Array<{
    transitingPlanet: string;
    transitingSign: string;
    natalPlanet: string;
    natalSign?: string;
    aspect: string;
    orb: number;
    exact: boolean;
    shortDescription: string;
    description: string;
  }>;
  summary: {
    total: number;
    exact: number;
    approaching: number;
  };
  predictive?: {
    generatedAt: string;
    windowDays: number;
    lifeStages: PredictiveLifeStage[];
    lunarTiming: {
      phase: string;
      illumination: number;
      isVoidOfCourse: boolean;
      hoursToNextSign: number;
      nextSignAt: string;
      actionBias: 'initiate' | 'build' | 'review' | 'release';
      guidance: string;
    };
    progressedMoon: {
      sign: string;
      degree: number;
      yearsProgressed: number;
      emphasis: Array<'love' | 'career' | 'money' | 'family' | 'health' | 'self'>;
    };
    events: PredictiveEvent[];
  };
  confluence?: ConfluenceTheme[];
  transitWindows?: TransitWindow[];
  resonance?: ResonanceProfile;
  userContext?: {
    userId: string;
    situation: string;
    mood: string;
    goals: string[];
    lastFeedbackNotes: string;
    updatedAt: string;
  } | null;
}

export function useTransits() {
  const [transits, setTransits] = useState<TransitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateTransits = useCallback(async (
    birthData: BirthData,
    options?: { mbtiType?: string; userId?: string }
  ): Promise<TransitData | null> => {
    setLoading(true);
    setError(null);
    const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;

    try {
      const response = await fetch('/api/transits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: birthData.date,
          birthTime: birthData.time,
          lat: birthData.latitude,
          lon: birthData.longitude,
          timezoneOffset: timezoneOffsetHours,
          mbtiType: options?.mbtiType,
          userId: options?.userId,
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to calculate transits');
      }

      setTransits(result.data);
      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Transits error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTransits(null);
    setError(null);
  }, []);

  return { transits, loading, error, calculateTransits, reset };
}
