import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';

export interface TransitData {
  all: Array<{
    transitingPlanet: string;
    natalPlanet: string;
    aspect: string;
    orb: number;
    exact: boolean;
  }>;
  significant: Array<{
    transitingPlanet: string;
    natalPlanet: string;
    aspect: string;
    orb: number;
    exact: boolean;
  }>;
  approaching: Array<{
    transitingPlanet: string;
    natalPlanet: string;
    aspect: string;
    orb: number;
    exact: boolean;
  }>;
  summary: {
    total: number;
    exact: number;
    approaching: number;
  };
}

export function useTransits() {
  const [transits, setTransits] = useState<TransitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateTransits = useCallback(async (birthData: BirthData): Promise<TransitData | null> => {
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
          timezoneOffset: timezoneOffsetHours
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
