import { useCallback, useState } from 'react';

import { BirthData } from '@/components/astrology/BirthChartCalculator';
import type { AtmospherePacket } from '@/lib/atmosphere/types';

export type { AtmospherePacket };

export type AtmosphereRequestOptions = {
  mbtiType?: string;
  userId?: string;
  clientDate?: string;
  windowDays?: number;
};

function getClientLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useAtmosphere() {
  const [atmosphere, setAtmosphere] = useState<AtmospherePacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateAtmosphere = useCallback(
    async (birthData: BirthData, options?: AtmosphereRequestOptions): Promise<AtmospherePacket | null> => {
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
            clientDate: options?.clientDate || getClientLocalDateString(),
            mbtiType: options?.mbtiType,
            userId: options?.userId,
            windowDays: options?.windowDays,
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

        setAtmosphere(result.data);
        return result.data;
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error('Unknown error');
        setError(wrapped);
        console.error('Atmosphere error:', wrapped);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const applyAtmosphere = useCallback((packet: AtmospherePacket | null) => {
    setAtmosphere(packet);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setAtmosphere(null);
    setError(null);
  }, []);

  return {
    atmosphere,
    loading,
    error,
    calculateAtmosphere,
    applyAtmosphere,
    reset,
  };
}