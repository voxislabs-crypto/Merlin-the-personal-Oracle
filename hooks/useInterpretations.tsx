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

        const contentType = response.headers.get('content-type') || '';
        const rawBody = await response.text();
        type InterpretationApiResult = {
          success?: boolean;
          error?: string;
          cached?: boolean;
          cacheHit?: boolean;
          interpreter?: string;
          data?: InterpretationData;
        };
        let result: InterpretationApiResult | null = null;

        if (contentType.includes('application/json')) {
          try {
            result = JSON.parse(rawBody) as InterpretationApiResult;
          } catch {
            throw new Error('Interpretation service returned invalid JSON.');
          }
        } else if (!response.ok) {
          throw new Error(
            response.status === 403
              ? 'Chart interpretations are currently unavailable for your plan.'
              : `Interpretation service failed (${response.status}). Restart the dev server after running "npx prisma generate".`
          );
        } else {
          throw new Error('Interpretation service returned an unexpected response format.');
        }

        if (!response.ok) {
          const message =
            result?.error ||
            (response.status === 403
              ? 'Chart interpretations are currently unavailable for your plan.'
              : `Error: ${response.statusText || `HTTP ${response.status}`}`);
          throw new Error(message);
        }

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to generate interpretations');
        }

        // Check if response indicates cache hit
        if (result.cached || result.cacheHit) {
          setCacheHit(true);
        }

        // Add interpreter info to data
        const dataWithInterpreter: InterpretationData = {
          chartSummary: result.data?.chartSummary || '',
          synthesis: result.data?.synthesis,
          confluence: result.data?.confluence,
          transitWindows: result.data?.transitWindows,
          planetInterpretations: result.data?.planetInterpretations || [],
          aspectInterpretations: result.data?.aspectInterpretations || [],
          metadata: result.data?.metadata || {
            generatedAt: new Date().toISOString(),
            birthDate: birthData.date,
            birthTime: birthData.time,
          },
          interpreter: (result.interpreter as InterpretationData['interpreter']) || mode,
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
