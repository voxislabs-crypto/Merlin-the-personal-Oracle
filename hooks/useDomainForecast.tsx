import { useState, useCallback } from 'react';

import { BirthData } from '@/components/astrology/BirthChartCalculator';
import type { DomainScore, WeatherForecastReport } from '@/types/astrology';

export interface DomainForecastData {
  timezoneOffsetHours: number | null;
  generatedAt: string;
  windowDays: number;
  domains: DomainScore[];
  weather?: WeatherForecastReport;
  daily: Array<{
    date: string;
    domains: DomainScore[];
  }>;
}

export function useDomainForecast() {
  const [forecast, setForecast] = useState<DomainForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateDomainForecast = useCallback(
    async (
      birthData: BirthData,
      options?: { mbtiType?: string; userId?: string; windowDays?: number }
    ): Promise<DomainForecastData | null> => {
      setLoading(true);
      setError(null);
      const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;

      try {
        const response = await fetch('/api/domain-forecast', {
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
            windowDays: options?.windowDays,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          const message = result?.error || `Error: ${response.statusText}`;
          throw new Error(message);
        }

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to calculate domain forecast');
        }

        setForecast(result.data);
        return result.data;
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error('Unknown error');
        setError(wrapped);
        console.error('Domain forecast error:', wrapped);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setForecast(null);
    setError(null);
  }, []);

  return { forecast, loading, error, calculateDomainForecast, reset };
}
