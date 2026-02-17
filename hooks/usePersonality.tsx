import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';
import { MBTIType } from '@/lib/mbti-overlay';

export function usePersonality() {
  const [mbtiType, setMbtiType] = useState<MBTIType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculatePersonality = useCallback(
    async (birthData: BirthData): Promise<MBTIType | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/personality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: birthData.date,
            birthTime: birthData.time,
            lat: birthData.latitude,
            lon: birthData.longitude
          })
        });

        if (!response.ok) {
          // Silently handle personality calculation failures
          console.log('Personality calculation unavailable:', response.statusText);
          return null;
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to derive personality');
        }

        setMbtiType(result.data.mbtiType);
        return result.data.mbtiType;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Personality error:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setMbtiType(null);
    setError(null);
  }, []);

  return { mbtiType, loading, error, calculatePersonality, reset };
}
