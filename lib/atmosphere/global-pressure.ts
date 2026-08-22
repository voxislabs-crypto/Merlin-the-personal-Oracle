import { calendarDateFromInstant, getLocalCalendarDate, isValidCalendarDate } from '@/lib/datetime/local-calendar';
import { clampIntensity } from '@/lib/atmosphere/tone';
import type { AtmospherePredictiveEventInput } from '@/lib/atmosphere/types';

const TOP_WEIGHTS = [0.7, 0.2, 0.1] as const;

export interface DaySkyPressure {
  /** 0–100 sky pressure for this local day, or null when nothing is in play today. */
  pressure: number | null;
  /** 0–100, averaged from the same events that set pressure. */
  confidence: number | null;
  activeCount: number;
  provenance: string[];
}

function asOfDay(date?: string | null): string {
  return isValidCalendarDate(date) ? date : getLocalCalendarDate();
}

function eventIntensity(event: AtmospherePredictiveEventInput): number | null {
  const value = event.scores?.intensity;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return clampIntensity(value);
}

function eventConfidence(event: AtmospherePredictiveEventInput): number | null {
  const value = event.scores?.confidence;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value <= 1 ? clampIntensity(value * 100) : clampIntensity(value);
}

/**
 * A transit counts as today's weather if it is already in orb on this local day.
 * Horizon hits that only enter orb later must not dilute today's %.
 */
export function isSkyEventActiveOnDate(
  event: AtmospherePredictiveEventInput,
  today: string
): boolean {
  const timing = event.timing;
  if (!timing) return true;

  const daysToPeak = timing.daysToPeak;
  const hasStart = Boolean(timing.startsAt);
  const hasPeakDays = typeof daysToPeak === 'number' && Number.isFinite(daysToPeak);
  if (!hasStart && !hasPeakDays && !timing.phase) return true;

  if (typeof daysToPeak === 'number' && Number.isFinite(daysToPeak) && daysToPeak <= 0) return true;
  if (timing.phase === 'peaking' || timing.phase === 'releasing') return true;

  if (timing.startsAt) {
    const startDay = calendarDateFromInstant(timing.startsAt);
    if (startDay && startDay <= today) return true;
  }

  return false;
}

function weightedTopIntensities(intensities: number[]): number {
  const top = intensities.slice(0, TOP_WEIGHTS.length);
  const weights = TOP_WEIGHTS.slice(0, top.length);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const weighted = top.reduce((sum, value, index) => sum + value * weights[index], 0);
  return clampIntensity(weighted / weightSum);
}

/**
 * Daily life-weather pressure from transits that are actually in play today.
 *
 * Do not arithmetic-mean the whole predictive window: a 30-day sample is mostly
 * future / wide-orb hits, which pins intensity near ~15% (Clear Flow) for days.
 */
export function computeDaySkyPressure(
  events: AtmospherePredictiveEventInput[] | null | undefined,
  date?: string | null
): DaySkyPressure {
  const today = asOfDay(date);
  const scored = (events ?? [])
    .map((event) => {
      const intensity = eventIntensity(event);
      if (intensity === null) return null;
      return { event, intensity, confidence: eventConfidence(event) };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .filter((row) => isSkyEventActiveOnDate(row.event, today))
    .sort((a, b) => b.intensity - a.intensity);

  if (!scored.length) {
    return {
      pressure: null,
      confidence: null,
      activeCount: 0,
      provenance: [],
    };
  }

  const pressure = weightedTopIntensities(scored.map((row) => row.intensity));
  const confidenceRows = scored
    .slice(0, TOP_WEIGHTS.length)
    .map((row) => row.confidence)
    .filter((value): value is number => value !== null);
  const confidence = confidenceRows.length
    ? clampIntensity(confidenceRows.reduce((sum, value) => sum + value, 0) / confidenceRows.length)
    : null;

  return {
    pressure,
    confidence,
    activeCount: scored.length,
    provenance: ['day-active-transits'],
  };
}
