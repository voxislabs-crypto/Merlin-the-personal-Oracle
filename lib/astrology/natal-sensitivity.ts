/**
 * Natal sensitivity — the same transit is not the same event
 * for every chart.
 *
 * Chart ruler, angularity, and natal integration often matter
 * more than a half-degree of orb.
 */

import type { Aspect, HousePosition, PlanetPosition } from '@/types/astrology';
import { isAngularHouse, natalHouseOf } from '@/lib/astrology/natal-angles';

const TRADITIONAL_RULERS: Record<string, string> = {
  aries: 'Mars',
  taurus: 'Venus',
  gemini: 'Mercury',
  cancer: 'Moon',
  leo: 'Sun',
  virgo: 'Mercury',
  libra: 'Venus',
  scorpio: 'Mars',
  sagittarius: 'Jupiter',
  capricorn: 'Saturn',
  aquarius: 'Saturn',
  pisces: 'Jupiter',
};

const ANGLE_ALIASES: Record<string, string[]> = {
  sun: ['sun'],
  moon: ['moon'],
  mercury: ['mercury'],
  venus: ['venus'],
  mars: ['mars'],
  jupiter: ['jupiter'],
  saturn: ['saturn'],
  uranus: ['uranus'],
  neptune: ['neptune'],
  pluto: ['pluto'],
  ascendant: ['ascendant', 'rising'],
  midheaven: ['midheaven', 'mc'],
  descendant: ['descendant', 'dsc'],
  'imum coeli': ['imum coeli', 'ic'],
};

export interface NatalSensitivityContext {
  planets: PlanetPosition[];
  houses?: HousePosition[];
  aspects?: Array<Pick<Aspect, 'type'> & {
    planet1?: { name?: string };
    planet2?: { name?: string };
  }>;
  ascendantSign?: string;
}

function norm(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function traditionalRuler(sign: string | undefined): string | null {
  const ruler = TRADITIONAL_RULERS[norm(sign)];
  return ruler || null;
}

export function isChartRuler(planet: string, ascendantSign?: string): boolean {
  const ruler = traditionalRuler(ascendantSign);
  return Boolean(ruler && norm(ruler) === norm(planet));
}

function nameMatches(planet: string, candidate: string | undefined): boolean {
  const want = norm(planet);
  const have = norm(candidate);
  if (!want || !have) return false;
  if (want === have) return true;
  const aliases = ANGLE_ALIASES[want] || [want];
  return aliases.includes(have);
}

export function countNatalAspects(
  planet: string,
  aspects: NatalSensitivityContext['aspects'] = [],
): number {
  return aspects.filter(
    (aspect) =>
      nameMatches(planet, aspect.planet1?.name) || nameMatches(planet, aspect.planet2?.name),
  ).length;
}

export function natalHouseForPlanet(
  planet: string,
  context: NatalSensitivityContext,
): number | undefined {
  const body = context.planets.find((item) => nameMatches(planet, item.name));
  if (body?.house) return body.house;
  if (body && context.houses) return natalHouseOf(body.longitude, context.houses);
  if (norm(planet) === 'ascendant' || norm(planet) === 'rising') return 1;
  if (norm(planet) === 'midheaven' || norm(planet) === 'mc') return 10;
  if (norm(planet) === 'descendant') return 7;
  if (norm(planet) === 'imum coeli' || norm(planet) === 'ic') return 4;
  return undefined;
}

/**
 * 0–100. How much this natal point usually "speaks" in the chart.
 */
export function natalImportance(planet: string, context: NatalSensitivityContext): number {
  let score = 38;
  const house = natalHouseForPlanet(planet, context);
  const aspectCount = countNatalAspects(planet, context.aspects);
  const angular = isAngularHouse(house) || ['ascendant', 'rising', 'midheaven', 'mc', 'descendant', 'imum coeli', 'ic'].includes(norm(planet));

  if (isChartRuler(planet, context.ascendantSign)) score += 24;
  if (angular) score += 20;
  score += Math.min(20, aspectCount * 4);
  if (['sun', 'moon'].includes(norm(planet))) score += 6;

  return Math.max(8, Math.min(100, Math.round(score)));
}

export function findNatalAspect(
  left: string,
  right: string,
  aspects: NatalSensitivityContext['aspects'] = [],
): { type: string } | null {
  const match = aspects.find((aspect) => {
    const a = aspect.planet1?.name;
    const b = aspect.planet2?.name;
    return (
      (nameMatches(left, a) && nameMatches(right, b)) ||
      (nameMatches(left, b) && nameMatches(right, a))
    );
  });
  return match ? { type: match.type } : null;
}
