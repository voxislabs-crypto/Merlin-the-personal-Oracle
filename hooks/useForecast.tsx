import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';
import { calculateForecastClient } from '@/lib/astrology/client-insights';

export interface DailyForecast {
  date: string;
  summary: string;
  planetaryHighlights: string[];
  moonPhase: string;
  moonSign?: string;
  sunSign?: string;
  transits: string[];
  advice: string;
  summary_raw?: string;
  summary_mbti_adjusted?: string;
  day_rating?: 'Very Positive' | 'Positive' | 'Neutral' | 'Challenging' | 'Very Challenging';
  focusAreas?: {
    love: string;
    career: string;
    mind: string;
    mood: string;
  };
  mbti_overlay?: {
    type: string;
    confidence: number;
    breakdown: any;
    reasoning: string;
    cosmicTendencies: string[];
  };
}

export function useForecast() {
  const [forecast, setForecast] = useState<DailyForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateForecast = useCallback(async (birthData: BirthData): Promise<DailyForecast | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await calculateForecastClient(birthData);
      setForecast(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Forecast error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setForecast(null);
    setError(null);
  }, []);

  return { forecast, loading, error, calculateForecast, reset };
}
