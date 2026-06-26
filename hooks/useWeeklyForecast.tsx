import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';

export interface DayWhisper {
  day: string;
  date: string;
  whisper: string;
}

export interface WeeklyForecast {
  week: DayWhisper[];
  startDate: string;
  endDate: string;
}

export function useWeeklyForecast() {
  const [weeklyForecast, setWeeklyForecast] = useState<WeeklyForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateWeeklyForecast = useCallback(
    async (birthData: BirthData): Promise<WeeklyForecast | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/weekly-forecast', {
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
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to generate weekly forecast');
        }

        setWeeklyForecast(result.data);
        return result.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Weekly forecast error:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setWeeklyForecast(null);
    setError(null);
  }, []);

  return { weeklyForecast, loading, error, calculateWeeklyForecast, reset };
}
