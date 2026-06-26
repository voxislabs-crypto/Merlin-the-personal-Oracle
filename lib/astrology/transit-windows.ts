import type { PredictiveTransitEvent } from '@/lib/astrology/predictive-transits';

export type TransitWindowPhase = 'building' | 'peak' | 'integrating';

export interface TransitWindowPoint {
  label: string;
  phase: TransitWindowPhase;
  at: string;
}

export interface TransitWindow {
  eventId: string;
  title: string;
  subtitle: string;
  startsAt: string;
  exactAt: string;
  endsAt: string;
  currentPhase: TransitWindowPhase;
  durationHours: number;
  points: TransitWindowPoint[];
  intensity: number;
}

function mapPhase(phase: PredictiveTransitEvent['timing']['phase']): TransitWindowPhase {
  if (phase === 'peaking') return 'peak';
  if (phase === 'releasing') return 'integrating';
  return 'building';
}

function toHours(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60)));
}

export function buildTransitWindows(events: PredictiveTransitEvent[]): TransitWindow[] {
  return events
    .map((event): TransitWindow => {
      const points: TransitWindowPoint[] = [
        {
          label: 'Entered orb',
          phase: 'building',
          at: event.timing.startsAt,
        },
        {
          label: 'Exact peak',
          phase: 'peak',
          at: event.timing.peakAt,
        },
        {
          label: 'Leaving orb',
          phase: 'integrating',
          at: event.timing.endsAt,
        },
      ];

      return {
        eventId: event.eventId,
        title: `${event.transit.transitingPlanet} ${event.transit.aspect} ${event.transit.natalPlanet}`,
        subtitle: `${event.transit.transitingPlanet} enters orb, peaks, and integrates through this window.`,
        startsAt: event.timing.startsAt,
        exactAt: event.timing.peakAt,
        endsAt: event.timing.endsAt,
        currentPhase: mapPhase(event.timing.phase),
        durationHours: toHours(event.timing.startsAt, event.timing.endsAt),
        intensity: event.scores.intensity,
        points,
      };
    })
    .sort((left, right) => {
      const leftTime = new Date(left.exactAt).getTime();
      const rightTime = new Date(right.exactAt).getTime();
      return leftTime - rightTime || right.intensity - left.intensity;
    });
}