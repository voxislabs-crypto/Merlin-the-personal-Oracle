import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';

export interface InterpretationData {
  chartSummary: string;
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
    async (birthData: BirthData, mode: 'grok' | 'traditional' = 'traditional'): Promise<InterpretationData | null> => {
      setLoading(true);
      setError(null);
      setCacheHit(false);

      try {
        const response = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: birthData.date,
            birthTime: birthData.time,
            lat: birthData.latitude,
            lon: birthData.longitude,
            mode: mode
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
