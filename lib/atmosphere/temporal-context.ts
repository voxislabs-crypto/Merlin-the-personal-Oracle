import { computeProfectionFromBirth } from '@/lib/astrology/profections';
import { computeSolarArcSnapshot } from '@/lib/astrology/solar-arc';
import type { AtmosphereTemporalInput } from '@/lib/atmosphere/types';
import type { PlanetPosition } from '@/types/astrology';

export interface BuildAtmosphereTemporalOptions {
  ascendantSign?: string;
  birthDate?: string;
  natalPlanets?: PlanetPosition[];
  ascendantLongitude?: number;
  mcLongitude?: number;
  referenceDate?: Date;
}

export function buildAtmosphereTemporalInput(
  options: BuildAtmosphereTemporalOptions
): AtmosphereTemporalInput | null {
  const { ascendantSign, birthDate, natalPlanets } = options;
  if (!ascendantSign || !birthDate || !natalPlanets?.length) {
    return null;
  }

  const referenceDate = options.referenceDate ?? new Date();
  const profection = computeProfectionFromBirth(ascendantSign, birthDate, referenceDate);
  const solarArc = computeSolarArcSnapshot({
    natalPlanets,
    birthDate,
    referenceDate,
    ascendantLongitude: options.ascendantLongitude,
    mcLongitude: options.mcLongitude,
  });

  return {
    profection,
    solarArc: {
      ageYears: solarArc.ageYears,
      arcDegrees: solarArc.arcDegrees,
      activeHits: solarArc.activeHits.slice(0, 4).map((hit) => ({
        directedPlanet: hit.directedPlanet,
        natalPlanet: hit.natalPlanet,
        aspect: hit.aspect,
        orb: hit.orb,
        score: hit.score,
      })),
    },
  };
}