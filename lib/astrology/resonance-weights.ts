import 'server-only';

import { resonanceDB } from '@/lib/resonance-database';
import type { PredictiveTransitEvent } from '@/lib/astrology/predictive-transits';
import { isPrismaStoreUnavailableError } from '@/lib/prisma-errors';
import { hasResonanceStore } from '@/lib/prisma';

const KNOWN_PLANETS = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
  'Ascendant',
  'Midheaven',
] as const;

type KnownPlanet = (typeof KNOWN_PLANETS)[number];

export interface ResonanceTimelineEntry {
  feedbackId: string;
  date: string;
  label: string;
  theme: string;
  resonated: boolean;
  accuracyScore: number;
  planets: string[];
}

export interface PlanetResonanceBreakdown {
  multiplier: number;
  sampleSize: number;
  averageSignal: number;
  averageAccuracy: number;
  wins: number;
  misses: number;
}

export interface ResonanceWeightsProfile {
  multipliers: Partial<Record<KnownPlanet, number>>;
  planetBreakdown: Partial<Record<KnownPlanet, PlanetResonanceBreakdown>>;
  history: ResonanceTimelineEntry[];
  summary: {
    feedbackCount: number;
    strongestPlanet?: KnownPlanet;
    strongestMultiplier?: number;
  };
}

const EMPTY_RESONANCE_PROFILE: ResonanceWeightsProfile = {
  multipliers: {},
  planetBreakdown: {},
  history: [],
  summary: {
    feedbackCount: 0,
    strongestPlanet: undefined,
    strongestMultiplier: undefined,
  },
};

function isMissingResonanceTableError(error: unknown): boolean {
  if (isPrismaStoreUnavailableError(error)) {
    return true;
  }

  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message || '';

  if (code === 'P2021') {
    return true;
  }

  return (
    message.includes('does not exist in the current database') &&
    (message.includes('ResonanceUser') ||
      message.includes('PersonalResonanceRecord') ||
      message.includes('GlobalResonanceRecord') ||
      message.includes('ClusterResonanceRecord') ||
      message.includes('ResonanceFeedbackRecord'))
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function extractPlanets(value: string): string[] {
  return KNOWN_PLANETS.filter((planet) => value.includes(planet));
}

function humanizeAspectId(aspectId: string): string {
  if (aspectId.includes(':')) {
    return aspectId.split(':').join(' ');
  }
  if (aspectId.includes('-')) {
    return aspectId
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return aspectId;
}

export async function getResonanceWeightsProfile(userId: string): Promise<ResonanceWeightsProfile> {
  if (!hasResonanceStore()) {
    return EMPTY_RESONANCE_PROFILE;
  }

  let logs;
  try {
    logs = await resonanceDB.getFeedbackHistory(userId, 80);
  } catch (error) {
    if (isMissingResonanceTableError(error)) {
      console.warn('[ResonanceWeights] Resonance tables missing, using empty profile');
      return EMPTY_RESONANCE_PROFILE;
    }
    throw error;
  }
  const buckets = new Map<KnownPlanet, { signalTotal: number; accuracyTotal: number; wins: number; misses: number }>();

  const history: ResonanceTimelineEntry[] = logs.map((entry) => {
    const planets = Array.from(new Set(extractPlanets(`${entry.aspectId} ${entry.notes || ''}`)));
    const signal = entry.resonated ? entry.accuracyScore : -entry.accuracyScore;

    planets.forEach((planet) => {
      const current = buckets.get(planet as KnownPlanet) || {
        signalTotal: 0,
        accuracyTotal: 0,
        wins: 0,
        misses: 0,
      };
      current.signalTotal += signal;
      current.accuracyTotal += entry.accuracyScore;
      if (entry.resonated) {
        current.wins += 1;
      } else {
        current.misses += 1;
      }
      buckets.set(planet as KnownPlanet, current);
    });

    return {
      feedbackId: entry.feedbackId,
      date: entry.date,
      label: humanizeAspectId(entry.aspectId),
      theme: entry.theme,
      resonated: entry.resonated,
      accuracyScore: entry.accuracyScore,
      planets,
    };
  });

  const multipliers: ResonanceWeightsProfile['multipliers'] = {};
  const planetBreakdown: ResonanceWeightsProfile['planetBreakdown'] = {};

  buckets.forEach((bucket, planet) => {
    const sampleSize = bucket.wins + bucket.misses;
    const averageSignal = bucket.signalTotal / sampleSize;
    const averageAccuracy = bucket.accuracyTotal / sampleSize;
    const confidence = clamp(Math.sqrt(sampleSize / 6), 0.2, 1);
    const multiplier = clamp(1 + averageSignal * 0.3 * confidence, 0.75, 1.35);

    multipliers[planet] = Number(multiplier.toFixed(2));
    planetBreakdown[planet] = {
      multiplier: Number(multiplier.toFixed(2)),
      sampleSize,
      averageSignal: Number(averageSignal.toFixed(2)),
      averageAccuracy: Number(averageAccuracy.toFixed(2)),
      wins: bucket.wins,
      misses: bucket.misses,
    };
  });

  const strongest = Object.entries(multipliers).sort((left, right) => Math.abs((right[1] || 1) - 1) - Math.abs((left[1] || 1) - 1))[0];

  return {
    multipliers,
    planetBreakdown,
    history,
    summary: {
      feedbackCount: history.length,
      strongestPlanet: strongest?.[0] as KnownPlanet | undefined,
      strongestMultiplier: strongest?.[1],
    },
  };
}

export function applyPlanetResonanceWeights(
  events: PredictiveTransitEvent[],
  multipliers: Partial<Record<KnownPlanet, number>>
): PredictiveTransitEvent[] {
  return events.map((event) => {
    const transitingMultiplier = multipliers[event.transit.transitingPlanet as KnownPlanet] || 1;
    const natalMultiplier = multipliers[event.transit.natalPlanet as KnownPlanet] || 1;
    const resonanceMultiplier = Number((((transitingMultiplier + natalMultiplier) / 2) || 1).toFixed(2));
    const adjustedIntensity = clamp(Math.round(event.scores.intensity * resonanceMultiplier), 0, 100);
    const learnedAdjustment = Number(
      (event.scores.learnedAdjustment + (adjustedIntensity - event.scores.intensity) / 100).toFixed(2)
    );

    return {
      ...event,
      scores: {
        ...event.scores,
        intensity: adjustedIntensity,
        learnedAdjustment,
        resonanceMultiplier,
      },
      explanation: {
        ...event.explanation,
        learnedAdjustment,
      },
    };
  });
}