import 'server-only';

import { calculateNatalPositions } from '@/lib/engine';

import type { BodyLongitudeResolver } from '@/lib/astrology/returns-utils';

export function resolveBodyLongitude(bodyName: string): BodyLongitudeResolver {
  return (date: string, time: string) => {
    try {
      const result = calculateNatalPositions(date, time);
      const body = result.positions.find((planet) => planet.name === bodyName);
      return typeof body?.longitude === 'number' ? body.longitude : null;
    } catch {
      return null;
    }
  };
}