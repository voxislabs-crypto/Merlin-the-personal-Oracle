import { useCallback, useState } from 'react';

import type { ReturnsPacket } from '@/lib/astrology/returns-types';
import type { BirthData } from '@/components/astrology/BirthChartCalculator';

export type { ReturnsPacket } from '@/lib/astrology/returns-types';

export function useReturns() {
  const [returnsPacket, setReturnsPacket] = useState<ReturnsPacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateReturns = useCallback(async (birthData: BirthData): Promise<ReturnsPacket | null> => {
    setLoading(true);
    setError(null);

    const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;
    const cacheKey = `merlin_returns_${birthData.date}_${birthData.time}_${birthData.latitude.toFixed(3)}_${birthData.longitude.toFixed(3)}`;

    try {
      if (typeof window !== 'undefined') {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as { data: ReturnsPacket; timestamp: number };
            if (Date.now() - cached.timestamp < 12 * 60 * 60 * 1000) {
              setReturnsPacket(cached.data);
              return cached.data;
            }
          } catch {
            // ignore malformed cache
          }
        }
      }

      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: birthData.date,
          birthTime: birthData.time,
          lat: birthData.latitude,
          lon: birthData.longitude,
          timezoneOffset: timezoneOffsetHours,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to load return charts');
      }

      const packet = result.data as ReturnsPacket;
      setReturnsPacket(packet);

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: packet,
            timestamp: Date.now(),
          })
        );
      }

      return packet;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error('Failed to load return charts');
      setError(nextError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setReturnsPacket(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    returnsPacket,
    loading,
    error,
    calculateReturns,
    reset,
  };
}