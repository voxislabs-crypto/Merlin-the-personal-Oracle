import { useState, useCallback, useRef } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';
import { MBTIType } from '@/lib/mbti-overlay';
import type { DualOverlay } from '@/lib/personality/dual-overlay';

export type { DualOverlay };

export interface PersonalityProfile {
  mbtiType: MBTIType;
  dualOverlay?: DualOverlay;
  source?: 'swiss-real' | 'mock-fallback' | 'chart-derived';
}

export type PersonalityCalcOptions = {
  retrogradeOverlay?: boolean;
};

export function usePersonality() {
  const [mbtiType, setMbtiType] = useState<MBTIType | null>(null);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const calculatePersonality = useCallback(
    async (birthData: BirthData, options?: PersonalityCalcOptions): Promise<MBTIType | null> => {
      if (!birthData?.date || !birthData?.time) return null;

      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;

      try {
        const response = await fetch('/api/personality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            birthDate: birthData.date,
            birthTime: birthData.time,
            lat: birthData.latitude,
            lon: birthData.longitude,
            timezoneOffset: timezoneOffsetHours,
            retrogradeOverlay: Boolean(options?.retrogradeOverlay),
          }),
        });

        if (!response.ok) {
          console.log('Personality calculation unavailable:', response.statusText);
          return null;
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to derive personality');
        }

        if (requestId !== requestIdRef.current) return null;

        const nextMbti = (result.data.firmware || result.data.finalType || result.data.mbtiType) as MBTIType;
        setMbtiType(nextMbti);
        setProfile({
          mbtiType: nextMbti,
          dualOverlay: result.data.dualOverlay,
          source: result.source,
        });
        return nextMbti;
      } catch (err) {
        if (requestId !== requestIdRef.current) return null;
        const nextError = err instanceof Error ? err : new Error('Unknown error');
        setError(nextError);
        console.error('Personality error:', nextError);
        return null;
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setMbtiType(null);
    setProfile(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mbtiType,
    profile,
    dualOverlay: profile?.dualOverlay || null,
    loading,
    error,
    calculatePersonality,
    reset,
  };
}