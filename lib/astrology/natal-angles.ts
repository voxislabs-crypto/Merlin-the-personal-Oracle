/**
 * Natal angles + houses for transit scoring.
 *
 * Most engines underweight ASC / MC / IC / DSC. Lived impact often
 * shows up when an outer planet crosses an angle — more than a
 * Venus-square-Moon at the same orb.
 */

import type { HousePosition, PlanetPosition } from '@/types/astrology';

export interface HouseIngressHit {
  transitingPlanet: string;
  natalPlanet: string;
  aspect: 'Ingress';
  orb: number;
  date: string;
  house: number;
}

const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);

const ANGLE_NAMES = new Set([
  'ascendant',
  'rising',
  'midheaven',
  'mc',
  'descendant',
  'dsc',
  'imum coeli',
  'ic',
]);

export function normalizeLongitude(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function isAngularPoint(name: string): boolean {
  return ANGLE_NAMES.has((name || '').trim().toLowerCase());
}

export function isAngularHouse(house?: number): boolean {
  return typeof house === 'number' && ANGULAR_HOUSES.has(house);
}

export function pointFromLongitude(name: string, longitude: number): PlanetPosition {
  const lon = normalizeLongitude(longitude);
  const signIndex = Math.floor(lon / 30) % 12;
  const degreeInSign = lon % 30;
  return {
    name,
    longitude: lon,
    latitude: 0,
    distance: 0,
    sign: SIGNS[signIndex],
    degree: Math.floor(degreeInSign),
    minute: Math.floor((degreeInSign - Math.floor(degreeInSign)) * 60),
  };
}

function hasNamedPoint(points: PlanetPosition[], name: string): boolean {
  const want = name.trim().toLowerCase();
  return points.some((point) => (point.name || '').trim().toLowerCase() === want);
}

export function appendAngularPoints(
  natalPlanets: PlanetPosition[],
  ascendant?: { longitude: number } | null,
  mc?: { longitude: number } | null,
): PlanetPosition[] {
  const next = [...natalPlanets];

  if (ascendant && Number.isFinite(ascendant.longitude)) {
    if (!hasNamedPoint(next, 'Ascendant') && !hasNamedPoint(next, 'Rising')) {
      next.push(pointFromLongitude('Ascendant', ascendant.longitude));
    }
    if (!hasNamedPoint(next, 'Descendant')) {
      next.push(pointFromLongitude('Descendant', ascendant.longitude + 180));
    }
  }

  if (mc && Number.isFinite(mc.longitude)) {
    if (!hasNamedPoint(next, 'Midheaven') && !hasNamedPoint(next, 'MC')) {
      next.push(pointFromLongitude('Midheaven', mc.longitude));
    }
    if (!hasNamedPoint(next, 'Imum Coeli') && !hasNamedPoint(next, 'IC')) {
      next.push(pointFromLongitude('Imum Coeli', mc.longitude + 180));
    }
  }

  return next;
}

export function natalPointsForTransits(chart: {
  positions?: PlanetPosition[] | null;
  planets?: PlanetPosition[] | null;
  ascendant?: { longitude: number } | null;
  mc?: { longitude: number } | null;
}): PlanetPosition[] {
  const base = chart.planets?.length ? chart.planets : chart.positions || [];
  return appendAngularPoints(base, chart.ascendant, chart.mc);
}

export function natalHouseOf(
  longitude: number,
  houses: HousePosition[] | undefined,
): number | undefined {
  if (!houses || houses.length < 2) return undefined;
  const lon = normalizeLongitude(longitude);
  const cusps = [...houses].sort((a, b) => a.house - b.house);

  for (let i = 0; i < cusps.length; i += 1) {
    const start = normalizeLongitude(cusps[i].longitude ?? cusps[i].position ?? 0);
    const end = normalizeLongitude(
      cusps[(i + 1) % cusps.length].longitude ?? cusps[(i + 1) % cusps.length].position ?? start + 30,
    );
    if (start <= end) {
      if (lon >= start && lon < end) return cusps[i].house;
    } else if (lon >= start || lon < end) {
      return cusps[i].house;
    }
  }

  return cusps[0]?.house;
}

const CUSP_ANGLE_NAME: Record<number, string> = {
  1: 'Ascendant',
  4: 'Imum Coeli',
  7: 'Descendant',
  10: 'Midheaven',
};

/**
 * Slow-planet house ingress / cusp crossing. Angular cusps are skipped —
 * those already fire as conjunctions to ASC/IC/DSC/MC once angles are
 * injected into the natal set.
 */
export function detectHouseIngressHits(
  transiting: Array<Pick<PlanetPosition, 'name' | 'longitude'>>,
  houses: HousePosition[] | undefined,
  date: string,
  options?: { orb?: number; planets?: string[] },
): HouseIngressHit[] {

  if (!houses || houses.length < 2) return [];
  const orb = options?.orb ?? 1.2;
  const allow = new Set(
    (options?.planets || ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']).map((p) =>
      p.toLowerCase(),
    ),
  );
  const hits: HouseIngressHit[] = [];

  for (const planet of transiting) {
    if (!allow.has((planet.name || '').toLowerCase())) continue;
    const lon = normalizeLongitude(planet.longitude);

    for (const cusp of houses) {
      const house = cusp.house;
      if (isAngularHouse(house)) continue;
      const cuspLon = normalizeLongitude(cusp.longitude ?? cusp.position ?? 0);
      const afterCusp = (lon - cuspLon + 360) % 360;
      if (afterCusp > orb) continue;

      hits.push({
        transitingPlanet: planet.name,
        natalPlanet: `House ${house}`,
        aspect: 'Ingress',
        orb: afterCusp,
        date,
        house,
      });
    }
  }

  return hits;
}

export function angleNameForHouse(house: number): string | undefined {
  return CUSP_ANGLE_NAME[house];
}
