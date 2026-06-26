import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';

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
  day_rating?:
    | 'Very Positive'
    | 'Positive'
    | 'Neutral'
    | 'Challenging'
    | 'Very Challenging'
    | 'green'
    | 'yellow'
    | 'red';
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
  timingWindows?: {
    next24Hours: string;
    next72Hours: string;
    weekAhead: string;
  };
  futureSignals?: Array<{
    domain: 'Love' | 'Career' | 'Mind' | 'Mood';
    signal: string;
    probability: number;
    timeframe: '24h' | '72h' | '7d';
    action: string;
    intensity: 'low' | 'medium' | 'high';
  }>;
  conversationalPrompts?: string[];
  primaryTheme?: string;
  secondaryThemes?: string[];
  transitLookup?: Array<{
    do?: string[];
    dont?: string[];
    transit_aspect?: string;
  }>;
}

export type ForecastRequestOptions = {
  mbtiType?: string;
  userId?: string;
};

export function useForecast() {
  const [forecast, setForecast] = useState<DailyForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  function getClientLocalDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const calculateForecast = useCallback(async (
    birthData: BirthData,
    options?: ForecastRequestOptions
  ): Promise<DailyForecast | null> => {
    setLoading(true);
    setError(null);
    const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;

    try {
      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: birthData.date,
          birthTime: birthData.time,
          lat: birthData.latitude,
          lon: birthData.longitude,
          timezoneOffset: timezoneOffsetHours,
          clientDate: getClientLocalDateString(),
          mbtiType: options?.mbtiType,
          userId: options?.userId,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const message =
          result?.error ||
          (response.status === 403
            ? 'Daily forecast is currently unavailable for your plan.'
            : `Error: ${response.statusText}`);
        throw new Error(message);
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to generate forecast');
      }

      setForecast(result.data);
      return result.data;
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
