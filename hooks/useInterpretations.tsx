import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';

interface SynthesisData {
  unifiedReading: string;
  dominantThemes: string[];
  timingHighlights: string[];
  resonanceNote: string;
  natalFoundation: string;
}

interface ConfluenceTheme {
  theme: 'transformation' | 'love' | 'career' | 'inner work' | 'communication' | 'abundance';
  title: string;
  headline: string;
  summary: string;
  score: number;
  signalCount: number;
  dominantPhase: 'building' | 'peak' | 'integrating';
}

interface TransitWindow {
  eventId: string;
  title: string;
  exactAt: string;
  currentPhase: 'building' | 'peak' | 'integrating';
}

export interface InterpretationData {
  chartSummary: string;
  synthesis?: SynthesisData;
  confluence?: ConfluenceTheme[];
  transitWindows?: TransitWindow[];
  planetInterpretations: Array<{
    planet: string;
    interpretation: string;
  }>;
  aspectInterpretations: Array<{
    planets: string;
    interpretation: string;
  }>;
  metadata: {
    generatedAt: string;
    birthDate: string;
    birthTime: string;
  };
  interpreter?: 'grok' | 'traditional';
}

export function useInterpretations() {
  const [interpretations, setInterpretations] = useState<InterpretationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  const generateInterpretations = useCallback(
    async (
      birthData: BirthData,
      mode: 'grok' | 'traditional' = 'traditional',
      options?: { userId?: string; mbtiType?: string }
    ): Promise<InterpretationData | null> => {
      setLoading(true);
      setError(null);
      setCacheHit(false);
      const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;

      try {
        const response = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: birthData.date,
            birthTime: birthData.time,
            lat: birthData.latitude,
            lon: birthData.longitude,
            mode: mode,
            userId: options?.userId,
            mbtiType: options?.mbtiType,
            timezoneOffset: timezoneOffsetHours,
          })
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to generate interpretations');
        }

        // Check if response indicates cache hit
        if (result.cached || result.cacheHit) {
          setCacheHit(true);
        }

        // Add interpreter info to data
        const dataWithInterpreter = {
          ...result.data,
          interpreter: result.interpreter || mode
        };

        setInterpretations(dataWithInterpreter);
        return dataWithInterpreter;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Interpretations error:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setInterpretations(null);
    setError(null);
    setCacheHit(false);
  }, []);

  return { interpretations, loading, error, cacheHit, generateInterpretations, reset };
}
