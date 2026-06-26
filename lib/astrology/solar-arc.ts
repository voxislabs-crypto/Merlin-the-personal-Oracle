import type { PlanetPosition } from '@/types/astrology';

export type SolarArcAspectName = 'Conjunction' | 'Opposition' | 'Square' | 'Trine' | 'Sextile';

export interface SolarArcHit {
  directedPlanet: string;
  natalPlanet: string;
  aspect: SolarArcAspectName;
  orb: number;
  arcAge: number;
  peakYear: number;
  windowStartYear: number;
  windowEndYear: number;
  score: number;
}

export interface SolarArcPeakMarker {
  id: string;
  year: number;
  age: number;
  directedPlanet: string;
  natalPlanet: string;
  aspect: SolarArcAspectName;
  orb: number;
  oneLiner: string;
}

export interface SolarArcSnapshot {
  arcDegrees: number;
  ageYears: number;
  activeHits: SolarArcHit[];
  peakMarkers: SolarArcPeakMarker[];
}

const DIRECTED_BODIES = [
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
] as const;

const NATAL_TARGETS = [...DIRECTED_BODIES, 'Ascendant', 'Midheaven'] as const;

const ASPECTS: Array<{ name: SolarArcAspectName; angle: number; orb: number }> = [
  { name: 'Conjunction', angle: 0, orb: 1 },
  { name: 'Opposition', angle: 180, orb: 1 },
  { name: 'Square', angle: 90, orb: 1 },
  { name: 'Trine', angle: 120, orb: 1 },
  { name: 'Sextile', angle: 60, orb: 1 },
];

function normalizeAngle(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function angleSeparation(left: number, right: number): number {
  const diff = Math.abs(normalizeAngle(left) - normalizeAngle(right));
  return diff > 180 ? 360 - diff : diff;
}

export function computeArcDegreesForAge(ageYears: number): number {
  return Math.max(0, ageYears);
}

export function directLongitude(natalLongitude: number, arcDegrees: number): number {
  return normalizeAngle(natalLongitude + arcDegrees);
}

function scoreHit(orb: number, aspect: SolarArcAspectName): number {
  const base =
    aspect === 'Conjunction' || aspect === 'Opposition' || aspect === 'Square' ? 78 : 68;
  return Math.max(45, Math.round(base - orb * 12));
}

function buildNatalLongitudeMap(
  natalPlanets: PlanetPosition[],
  ascendantLongitude?: number,
  mcLongitude?: number
): Record<string, number> {
  const map: Record<string, number> = {};

  natalPlanets.forEach((planet) => {
    if (typeof planet.longitude === 'number' && Number.isFinite(planet.longitude)) {
      map[planet.name] = planet.longitude;
    }
  });

  if (typeof ascendantLongitude === 'number') {
    map.Ascendant = ascendantLongitude;
  }

  if (typeof mcLongitude === 'number') {
    map.Midheaven = mcLongitude;
  }

  return map;
}

export function detectSolarArcHitsAtAge(
  natalLongitudes: Record<string, number>,
  ageYears: number,
  birthYear: number,
  maxOrb = 1
): SolarArcHit[] {
  const arcDegrees = computeArcDegreesForAge(ageYears);
  const hits: SolarArcHit[] = [];

  for (const directedPlanet of DIRECTED_BODIES) {
    const natalDirectedLongitude = natalLongitudes[directedPlanet];
    if (typeof natalDirectedLongitude !== 'number') continue;

    const directedLongitudeValue = directLongitude(natalDirectedLongitude, arcDegrees);

    for (const natalPlanet of NATAL_TARGETS) {
      const natalLongitude = natalLongitudes[natalPlanet];
      if (typeof natalLongitude !== 'number') continue;
      if (directedPlanet === natalPlanet && natalPlanet !== 'Ascendant' && natalPlanet !== 'Midheaven') {
        continue;
      }

      for (const aspect of ASPECTS) {
        const orb = Math.abs(angleSeparation(directedLongitudeValue, natalLongitude) - aspect.angle);
        if (orb > maxOrb) continue;

        const peakYear = birthYear + Math.round(ageYears);
        hits.push({
          directedPlanet,
          natalPlanet,
          aspect: aspect.name,
          orb: Math.round(orb * 100) / 100,
          arcAge: ageYears,
          peakYear,
          windowStartYear: Math.max(birthYear, peakYear - 1),
          windowEndYear: peakYear + 1,
          score: scoreHit(orb, aspect.name),
        });
      }
    }
  }

  return hits.sort((left, right) => left.orb - right.orb || right.score - left.score);
}

export function findSolarArcPeakMarkers(options: {
  natalPlanets: PlanetPosition[];
  birthYear: number;
  startAge?: number;
  endAge?: number;
  peakOrbThreshold?: number;
  ascendantLongitude?: number;
  mcLongitude?: number;
}): SolarArcPeakMarker[] {
  const {
    natalPlanets,
    birthYear,
    startAge = 0,
    endAge = 85,
    peakOrbThreshold = 0.25,
    ascendantLongitude,
    mcLongitude,
  } = options;

  const natalLongitudes = buildNatalLongitudeMap(natalPlanets, ascendantLongitude, mcLongitude);
  const bestByKey = new Map<string, SolarArcPeakMarker>();

  for (let age = startAge; age <= endAge; age += 0.25) {
    const hits = detectSolarArcHitsAtAge(natalLongitudes, age, birthYear, 1);
    hits.forEach((hit) => {
      if (hit.orb > peakOrbThreshold) return;

      const key = `${hit.directedPlanet}-${hit.aspect}-${hit.natalPlanet}`;
      const candidate: SolarArcPeakMarker = {
        id: `sa-${Math.round(age * 4)}-${key.toLowerCase()}`,
        year: hit.peakYear,
        age: Math.round(age * 10) / 10,
        directedPlanet: hit.directedPlanet,
        natalPlanet: hit.natalPlanet,
        aspect: hit.aspect,
        orb: hit.orb,
        oneLiner: `Solar arc ${hit.directedPlanet} ${hit.aspect.toLowerCase()} natal ${hit.natalPlanet} peaks near age ${Math.round(age)}.`,
      };

      const existing = bestByKey.get(key);
      if (!existing || candidate.orb < existing.orb) {
        bestByKey.set(key, candidate);
      }
    });
  }

  return Array.from(bestByKey.values()).sort((left, right) => left.year - right.year);
}

export function computeSolarArcSnapshot(options: {
  natalPlanets: PlanetPosition[];
  birthDate: string;
  referenceDate?: Date;
  ascendantLongitude?: number;
  mcLongitude?: number;
}): SolarArcSnapshot {
  const referenceDate = options.referenceDate ?? new Date();
  const birth = new Date(
    options.birthDate.includes('T') ? options.birthDate : `${options.birthDate}T12:00:00`
  );
  const birthYear = birth.getFullYear();
  const ageYears = Math.max(
    0,
    (referenceDate.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  const arcDegrees = computeArcDegreesForAge(ageYears);
  const natalLongitudes = buildNatalLongitudeMap(
    options.natalPlanets,
    options.ascendantLongitude,
    options.mcLongitude
  );

  const activeHits = detectSolarArcHitsAtAge(natalLongitudes, ageYears, birthYear, 1);
  const peakMarkers = findSolarArcPeakMarkers({
    natalPlanets: options.natalPlanets,
    birthYear,
    startAge: Math.max(0, ageYears - 2),
    endAge: ageYears + 10,
    ascendantLongitude: options.ascendantLongitude,
    mcLongitude: options.mcLongitude,
  });

  return {
    arcDegrees,
    ageYears,
    activeHits,
    peakMarkers,
  };
}