import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';
import { calculateTransitsClient } from '@/lib/astrology/client-insights';

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

    try {
      const result = await calculateTransitsClient(birthData);
      setTransits(result);
      return result;
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
