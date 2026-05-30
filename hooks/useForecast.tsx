import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';
import type { CafeForecastResponse, TimeHorizonHours } from '@/shared/cafe-contracts';
import type { ForecastProvenance } from '@/types/astrology';

export interface ForecastIntakeOptions {
  userId?: string;
  mbtiType?: string;
  horizonHours?: TimeHorizonHours;
  behavioral?: {
    energy?: number;
    focus?: number;
    emotionalLoad?: number;
  };
  mood?: string;
  journalText?: string;
  intention?: string;
  goals?: string[];
  situation?: string;
  lastFeedbackNotes?: string;
}

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
  day_rating?: 'Very Positive' | 'Positive' | 'Neutral' | 'Challenging' | 'Very Challenging';
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
  cafe?: {
    cafeIndex: number;
    phase: string;
    confidence: number;
    dimensions: {
      cognitiveClarity: number;
      emotionalPressure: number;
      socialFriction: number;
      recoveryCapacity: number;
      opportunityWindow: number;
    };
  };
  provenance?: ForecastProvenance;
}

function mapCafeIndexToDayRating(index: number): DailyForecast['day_rating'] {
  if (index >= 80) return 'Very Positive';
  if (index >= 65) return 'Positive';
  if (index >= 45) return 'Neutral';
  if (index >= 25) return 'Challenging';
  return 'Very Challenging';
}

function normalizeCafeToDailyForecast(response: CafeForecastResponse): DailyForecast {
  const payload = response.data;
  return {
    date: response.generatedAt.slice(0, 10),
    summary: `CAFE index ${payload.cafeIndex}/100 (${payload.phase.replace('_', ' ')} phase).`,
    planetaryHighlights: payload.guidance.slice(0, 3),
    moonPhase: payload.symbolicNote || 'Contextual symbolic signal',
    transits: payload.guidance,
    advice: payload.cautionNote || 'Use this forecast as guidance, not as a verdict.',
    day_rating: mapCafeIndexToDayRating(payload.cafeIndex),
    conversationalPrompts: [
      payload.opportunitySignal || 'What is the highest leverage action for today?',
      payload.recoveryWindow || 'Where can you create recovery space?',
    ],
    cafe: {
      cafeIndex: payload.cafeIndex,
      phase: payload.phase,
      confidence: payload.confidence,
      dimensions: payload.dimensions,
    },
    provenance: {
      source: `${response.meta.executionMode}:${response.meta.provider}`,
      signalSources: response.meta.provenance.signalSources,
      confidence: response.meta.confidence,
      generatedAt: response.generatedAt,
      fallbackUsed: response.meta.usedFallback,
      freshnessHours: response.meta.provenance.freshnessHours,
      notes: response.meta.provenance.notes,
    },
  };
}

function clampSignal(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function moodToEmotionalLoad(mood?: string): number {
  const normalized = (mood || '').toLowerCase();
  if (normalized.includes('overwhelm')) return 76;
  if (normalized.includes('anx')) return 72;
  if (normalized.includes('griev')) return 79;
  if (normalized.includes('hope')) return 42;
  if (normalized.includes('steady')) return 35;
  return 50;
}

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
    options?: ForecastIntakeOptions
  ): Promise<DailyForecast | null> => {
    setLoading(true);
    setError(null);
    const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;
    const resolvedUserId = options?.userId || 'local-user';
    const resolvedHorizon = options?.horizonHours || 24;

    const energy = clampSignal(options?.behavioral?.energy, 55);
    const focus = clampSignal(options?.behavioral?.focus, 60);
    const emotionalLoad = clampSignal(
      options?.behavioral?.emotionalLoad,
      moodToEmotionalLoad(options?.mood)
    );

    const mergedJournalText = [
      options?.journalText,
      options?.situation,
      options?.lastFeedbackNotes,
    ]
      .filter((line): line is string => Boolean(line && line.trim().length > 0))
      .join('\n\n');

    const resolvedIntention =
      options?.intention ||
      (Array.isArray(options?.goals) ? options?.goals.find((goal) => goal?.trim().length > 0) : undefined);

    try {
      let merlinContext: unknown;
      try {
        const merlinContextResponse = await fetch('/api/internal/merlin/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: resolvedUserId,
            location: {
              lat: birthData.latitude,
              lon: birthData.longitude,
            },
            includeTransits: true,
          }),
        });

        if (merlinContextResponse.ok) {
          merlinContext = await merlinContextResponse.json();
        }
      } catch {
        // Merlin context is optional for v1; forecast should still proceed.
      }

      const v1Payload = {
        version: 'cafe-forecast-v1' as const,
        requestId: `req_${Date.now()}`,
        userId: resolvedUserId,
        horizonHours: resolvedHorizon,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        intake: {
          mbtiType: options?.mbtiType,
          journalText: mergedJournalText || undefined,
          intention: resolvedIntention,
          behavioral: {
            energy,
            focus,
            emotionalLoad,
          },
        },
        location: {
          lat: birthData.latitude,
          lon: birthData.longitude,
        },
        merlinContext,
      };

      const v1Response = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v1Payload),
      });

      const v1Result = await v1Response.json();

      if (v1Response.ok && v1Result?.success && v1Result?.version === 'cafe-forecast-v1') {
        const normalized = normalizeCafeToDailyForecast(v1Result as CafeForecastResponse);
        setForecast(normalized);

        try {
          const payload = v1Result as CafeForecastResponse;
          await fetch('/api/internal/forecast-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: resolvedUserId,
              record: {
                generatedAt: payload.generatedAt,
                horizonHours: resolvedHorizon,
                phase: payload.data.phase,
                cafeIndex: payload.data.cafeIndex,
                dimensions: payload.data.dimensions,
              },
            }),
          });
        } catch {
          // History persistence should not break forecast rendering.
        }

        return normalized;
      }

      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: birthData.date,
          birthTime: birthData.time,
          lat: birthData.latitude,
          lon: birthData.longitude,
          timezoneOffset: timezoneOffsetHours,
          clientDate: getClientLocalDateString()
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
