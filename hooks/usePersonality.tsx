import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';
import { MBTIType } from '@/lib/mbti-overlay';
import type { BirthChartData } from '@/types/astrology';
import { derivePersonalityFromChart, type DualOverlay } from '@/lib/personality/dual-overlay';

export type { DualOverlay };

export interface PersonalityProfile {
  mbtiType: MBTIType;
  dualOverlay?: DualOverlay;
  source?: 'swiss-real' | 'mock-fallback' | 'chart-derived';
}

export function usePersonality() {
  const [mbtiType, setMbtiType] = useState<MBTIType | null>(null);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const applyChartPersonality = useCallback((chartData: BirthChartData): MBTIType | null => {
    setError(null);

    const derived = derivePersonalityFromChart(chartData);
    if (!derived) {
      setMbtiType(null);
      setProfile(null);
      return null;
    }

    setMbtiType(derived.mbtiType);
    setProfile({
      mbtiType: derived.mbtiType,
      dualOverlay: derived.dualOverlay,
      source: 'chart-derived',
    });
    return derived.mbtiType;
  }, []);

  const calculatePersonality = useCallback(
    async (birthData: BirthData, chartData?: BirthChartData | null): Promise<MBTIType | null> => {
      if (chartData) {
        return applyChartPersonality(chartData);
      }

      setLoading(true);
      setError(null);
      setMbtiType(null);
      setProfile(null);

      const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;

      try {
        const response = await fetch('/api/personality', {
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

        if (!response.ok) {
          console.log('Personality calculation unavailable:', response.statusText);
          return null;
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to derive personality');
        }

        const nextMbti = (result.data.finalType || result.data.mbtiType) as MBTIType;
        setMbtiType(nextMbti);
        setProfile({
          mbtiType: nextMbti,
          dualOverlay: result.data.dualOverlay,
          source: result.source,
        });
        return nextMbti;
      } catch (err) {
        const nextError = err instanceof Error ? err : new Error('Unknown error');
        setError(nextError);
        console.error('Personality error:', nextError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [applyChartPersonality]
  );

  const reset = useCallback(() => {
    setMbtiType(null);
    setProfile(null);
    setError(null);
  }, []);

  return {
    mbtiType,
    profile,
    dualOverlay: profile?.dualOverlay || null,
    loading,
    error,
    calculatePersonality,
    applyChartPersonality,
    reset,
  };
}