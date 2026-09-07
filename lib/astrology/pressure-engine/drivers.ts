import type { LifeDomain, TransitDriver } from '@/types/astrology';
import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import { inferValence, rewriteLayReason } from './lay-reason';
import { lifeDomainsForDriver, mapPredictiveDomainName } from './domains';

export interface PredictiveDriverSource {
  eventId?: string;
  transitId?: string;
  scores?: { intensity?: number; confidence?: number };
  transit?: {
    transitingPlanet?: string;
    aspect?: string;
    natalPlanet?: string;
    orbNow?: number;
    orb?: number;
  };
  domains?: Array<{ name?: string; impact?: number; valence?: number }>;
  narrative?: { whisper?: string; opportunity?: string; risk?: string };
}

export function toTransitDriver(event: PredictiveDriverSource, index = 0): TransitDriver {
  const transitingPlanet = event.transit?.transitingPlanet;
  const natalPlanet = event.transit?.natalPlanet;
  const aspect = event.transit?.aspect;
  const orbRaw = event.transit?.orbNow ?? event.transit?.orb;
  const orbDeg = typeof orbRaw === 'number' && Number.isFinite(orbRaw) ? orbRaw : undefined;
  const label = [transitingPlanet, aspect, natalPlanet].filter(Boolean).join(' ') || `driver-${index}`;
  const mapped = (event.domains || [])
    .map((row) => mapPredictiveDomainName(String(row.name || '')))
    .filter((name): name is LifeDomain => Boolean(name));
  const valenceHits = (event.domains || [])
    .map((row) => row.valence)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const valence =
    valenceHits.length > 0
      ? valenceHits.reduce((sum, value) => sum + value, 0) / valenceHits.length
      : inferValence(aspect);
  const reason = sanitizeCopyText(event.narrative?.whisper || event.narrative?.risk || label);

  const driver: TransitDriver = {
    transitId: event.eventId || event.transitId || `driver-${index}-${label}`,
    label,
    strength: typeof event.scores?.intensity === 'number' ? event.scores.intensity : 0,
    confidence:
      typeof event.scores?.confidence === 'number'
        ? event.scores.confidence <= 1
          ? Math.round(event.scores.confidence * 100)
          : Math.round(event.scores.confidence)
        : 50,
    reason,
    layReason: rewriteLayReason(reason),
    domains: mapped,
    valence,
    aspect,
    transitingPlanet,
    natalPlanet,
    orbDeg,
  };

  return {
    ...driver,
    domains: driver.domains?.length ? driver.domains : lifeDomainsForDriver(driver),
  };
}

export function toTransitDrivers(events: PredictiveDriverSource[], limit = 16): TransitDriver[] {
  return (events || []).slice(0, limit).map((event, index) => toTransitDriver(event, index));
}
