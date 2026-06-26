import {
  computeArcDegreesForAge,
  computeSolarArcSnapshot,
  detectSolarArcHitsAtAge,
  directLongitude,
} from '@/lib/astrology/solar-arc';
import type { PlanetPosition } from '@/types/astrology';

function makePlanet(name: string, longitude: number): PlanetPosition {
  return {
    name,
    longitude,
    latitude: 0,
    distance: 1,
    sign: 'Aries',
    degree: 0,
    minute: 0,
  };
}

describe('solar arc directions', () => {
  it('advances longitude by one degree per year', () => {
    expect(computeArcDegreesForAge(42)).toBe(42);
    expect(directLongitude(120, 42)).toBeCloseTo(162, 5);
  });

  it('detects a tight directed Sun conjunction to natal Moon', () => {
    const natal = {
      Sun: 10,
      Moon: 52,
    };

    const hits = detectSolarArcHitsAtAge(natal, 42, 1983, 1);
    const sunMoon = hits.find(
      (hit) => hit.directedPlanet === 'Sun' && hit.natalPlanet === 'Moon' && hit.aspect === 'Conjunction'
    );

    expect(sunMoon).toBeDefined();
    expect(sunMoon?.orb).toBeLessThanOrEqual(1);
  });

  it('returns active hits and peak markers in a snapshot', () => {
    const snapshot = computeSolarArcSnapshot({
      natalPlanets: [makePlanet('Sun', 120), makePlanet('Moon', 162)],
      birthDate: '1983-08-14',
      referenceDate: new Date('2026-06-25T12:00:00'),
      ascendantLongitude: 145,
      mcLongitude: 55,
    });

    expect(snapshot.arcDegrees).toBeGreaterThan(40);
    expect(Array.isArray(snapshot.activeHits)).toBe(true);
    expect(Array.isArray(snapshot.peakMarkers)).toBe(true);
  });
});