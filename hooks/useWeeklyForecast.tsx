import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';
import { readJsonResponse, resolveApiUrl } from '@/lib/api-client';
import { isStandaloneMobileClient } from '@/lib/runtime-mode';
import { calculateForecastClient } from '@/lib/astrology/client-insights';

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

      // In standalone, generate week forecast from client-side calculations
      if (isStandaloneMobileClient) {
        try {
          const today = await calculateForecastClient(birthData);
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const now = new Date();
          const padL = (n: number) => String(n).padStart(2, '0');
          const week: DayWhisper[] = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now);
            d.setDate(now.getDate() + i);
            const dayName = dayNames[d.getDay()];
            // Use local date to avoid UTC-offset day shift
            const dateStr = `${d.getFullYear()}-${padL(d.getMonth() + 1)}-${padL(d.getDate())}`;
            const whisper =
              i === 0
                ? today.advice || today.summary
                : `${dayName}: ${today.moonPhase} energy continues. ${today.planetaryHighlights?.[i % (today.planetaryHighlights.length || 1)] || 'Steady forward motion.'}`;
            return { day: dayName, date: dateStr, whisper };
          });

          const forecast: WeeklyForecast = {
            week,
            startDate: week[0].date,
            endDate: week[6].date,
          };
          setWeeklyForecast(forecast);
          return forecast;
        } catch (err) {
          console.error('[useWeeklyForecast] Client fallback error:', err);
          setLoading(false);
          return null;
        } finally {
          setLoading(false);
        }
      }

      try {
        const response = await fetch(resolveApiUrl('/api/weekly-forecast'), {
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

        const result = await readJsonResponse<{ success: boolean; error?: string; data: WeeklyForecast }>(
          response,
          'weekly forecast'
        );
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
