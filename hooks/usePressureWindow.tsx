import { useState, useCallback } from 'react';

import { BirthData } from '@/components/astrology/BirthChartCalculator';
import { getLocalCalendarDate } from '@/lib/datetime/local-calendar';
import type { AtmospherePatternProfile } from '@/lib/atmosphere/pattern-types';
import type { ExplainabilityPacket } from '@/types/astrology';

export interface PressureWindowData {
  timezoneOffsetHours: number | null;
  explainability: ExplainabilityPacket;
  calibrationProvenance?: {
    feedbackCount: number;
    strongestPlanet?: string;
    strongestMultiplier?: number;
    activePlanetModifiers: Array<{ planet: string; multiplier: number }>;
  };
  patternProfile?: AtmospherePatternProfile | null;
  predictive: {
    generatedAt: string;
    windowDays: number;
    events: Array<{
      eventId: string;
      scores: {
        intensity: number;
        confidence: number;
        volatility?: number;
      };
      transit: {
        transitingPlanet: string;
        natalPlanet: string;
        aspect: string;
      };
      timing?: {
        phase?: 'building' | 'peaking' | 'releasing';
        startsAt?: string;
        peakAt?: string;
        endsAt?: string;
        daysToPeak?: number;
        hoursToPeak?: number;
      };
      domains?: Array<{
        name: 'love' | 'career' | 'money' | 'family' | 'health' | 'self';
        impact: number;
        valence: number;
      }>;
      narrative: {
        whisper: string;
        risk?: string;
        opportunity?: string;
      };
    }>;
    lunarTiming: {
      phase: string;
      actionBias: 'initiate' | 'build' | 'review' | 'release';
      guidance: string;
      illumination: number;
    };
    progressedMoon: {
      sign: string;
      degree: number;
      yearsProgressed: number;
      emphasis: Array<'love' | 'career' | 'money' | 'family' | 'health' | 'self'>;
    };
  };
}

export function usePressureWindow() {
  const [pressureWindow, setPressureWindow] = useState<PressureWindowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculatePressureWindow = useCallback(
    async (
      birthData: BirthData,
      options?: { mbtiType?: string; userId?: string; windowDays?: number }
    ): Promise<PressureWindowData | null> => {
      setLoading(true);
      setError(null);
      const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;

      try {
        const response = await fetch('/api/pressure-window', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: birthData.date,
            birthTime: birthData.time,
            lat: birthData.latitude,
            lon: birthData.longitude,
            timezoneOffset: timezoneOffsetHours,
            clientDate: getLocalCalendarDate(),
            mbtiType: options?.mbtiType,
            userId: options?.userId,
            windowDays: options?.windowDays ?? 30,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          const message = result?.error || `Error: ${response.statusText}`;
          throw new Error(message);
        }

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to calculate pressure window');
        }

        setPressureWindow(result.data);
        return result.data;
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error('Unknown error');
        setError(wrapped);
        console.error('Pressure window error:', wrapped);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setPressureWindow(null);
    setError(null);
  }, []);

  return { pressureWindow, loading, error, calculatePressureWindow, reset };
}
