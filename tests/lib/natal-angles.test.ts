import {
  appendAngularPoints,
  detectHouseIngressHits,
  isAngularHouse,
  natalHouseOf,
  natalPointsForTransits,
} from '@/lib/astrology/natal-angles';
import type { HousePosition, PlanetPosition } from '@/types/astrology';

function planet(name: string, longitude: number): PlanetPosition {
  return {
    name,
    longitude,
    latitude: 0,
    distance: 0,
    sign: 'Aries',
    degree: 0,
    minute: 0,
  };
}

function housesFromAsc(asc: number): HousePosition[] {
  return Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    longitude: (asc + i * 30) % 360,
    position: (asc + i * 30) % 360,
    sign: 'Aries',
    degree: 0,
    minute: 0,
  }));
}

describe('natal angles', () => {
  it('injects ASC, DSC, MC, IC without duplicating existing points', () => {
    const points = appendAngularPoints([planet('Sun', 120)], { longitude: 10 }, { longitude: 280 });
    const names = points.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Sun', 'Ascendant', 'Descendant', 'Midheaven', 'Imum Coeli']));
    expect(points.find((p) => p.name === 'Descendant')?.longitude).toBe(190);
    expect(points.find((p) => p.name === 'Imum Coeli')?.longitude).toBe(100);

    const again = appendAngularPoints(points, { longitude: 10 }, { longitude: 280 });
    expect(again.filter((p) => p.name === 'Ascendant')).toHaveLength(1);
  });

  it('reads angles from a chart object', () => {
    const points = natalPointsForTransits({
      planets: [planet('Moon', 40)],
      ascendant: { longitude: 80 },
      mc: { longitude: 350 },
    });
    expect(points.some((p) => p.name === 'Ascendant')).toBe(true);
    expect(points.some((p) => p.name === 'Midheaven')).toBe(true);
  });

  it('finds natal house and angular houses', () => {
    const houses = housesFromAsc(0);
    expect(natalHouseOf(5, houses)).toBe(1);
    expect(natalHouseOf(95, houses)).toBe(4);
    expect(isAngularHouse(1)).toBe(true);
    expect(isAngularHouse(2)).toBe(false);
  });

  it('detects non-angular house ingress and skips angular cusps', () => {
    const houses = housesFromAsc(0);
    const hits = detectHouseIngressHits([planet('Saturn', 30.4)], houses, '2026-08-19');
    expect(hits).toHaveLength(1);
    expect(hits[0].natalPlanet).toBe('House 2');
    expect(hits[0].aspect).toBe('Ingress');

    const angular = detectHouseIngressHits([planet('Pluto', 0.3)], houses, '2026-08-19');
    expect(angular).toHaveLength(0);
  });
});
