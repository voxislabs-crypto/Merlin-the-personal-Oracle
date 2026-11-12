import { useCallback, useState } from 'react';
import { useLatestRequest } from '@/hooks/useLatestRequest';

import { BirthData } from '@/components/astrology/BirthChartCalculator';
import type { AtmospherePacket } from '@/lib/atmosphere/types';
import { getLocalCalendarDate } from '@/lib/datetime/local-calendar';

export type { AtmospherePacket };

export type AtmosphereRequestOptions = {
  mbtiType?: string;
  /** User mask override. Omitted means the chart mask. */
  mbtiMask?: string;
  userId?: string;
  clientDate?: string;
  windowDays?: number;
};

export function useAtmosphere() {
  const [atmosphere, setAtmosphere] = useState<AtmospherePacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { begin, invalidate } = useLatestRequest();

  const calculateAtmosphere = useCallback(
    async (birthData: BirthData, options?: AtmosphereRequestOptions): Promise<AtmospherePacket | null> => {
      const isCurrent = begin();
      setLoading(true);
      setError(null);

      const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;

      try {
        const response = await fetch('/api/atmosphere', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: birthData.date,
            birthTime: birthData.time,
            lat: birthData.latitude,
            lon: birthData.longitude,
            timezoneOffset: timezoneOffsetHours,
            clientDate: options?.clientDate || getLocalCalendarDate(),
            mbtiType: options?.mbtiType,
            mbtiMask: options?.mbtiMask,
            userId: options?.userId,
            windowDays: options?.windowDays ?? 30,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          const message =
            result?.error ||
            (response.status === 403
              ? 'Atmosphere forecasting is currently unavailable for your plan.'
              : `Error: ${response.statusText}`);
          throw new Error(message);
        }

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to generate atmosphere packet');
        }

        if (!isCurrent()) return null;
        setAtmosphere(result.data);
        return result.data;
      } catch (err) {
        if (!isCurrent()) return null;
        const wrapped = err instanceof Error ? err : new Error('Unknown error');
        setError(wrapped);
        console.error('Atmosphere error:', wrapped);
        return null;
      } finally {
        if (isCurrent()) setLoading(false);
      }
    },
    [begin]
  );

  const applyAtmosphere = useCallback((packet: AtmospherePacket | null) => {
    setAtmosphere(packet);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    invalidate();
    setAtmosphere(null);
    setError(null);
  }, [invalidate]);

  return {
    atmosphere,
    loading,
    error,
    calculateAtmosphere,
    applyAtmosphere,
    reset,
  };
}