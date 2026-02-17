/**
 * Life Timeline Engine - Raw transit calculator
 * Scans entire lifespan for major planetary hits
 * No phases. Just what happened and when.
 */

import { toJulianDay, getPlanetPositions } from '../swiss-ephemeris-core';
import type { PlanetPositions } from '../swiss-ephemeris-core';
import { PlanetPosition } from '@/types/astrology';

export interface TimelineStrike {
  id: string;
  year: number;
  age: number;
  month: number; // 1-12
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string; // 'conjunction', 'opposition', 'square', 'trine', 'sextile'
  orb: number;
  exactDate: string; // YYYY-MM-DD
  oneLiner: string;
  intensity: 'strike' | 'burn' | 'shift'; // strike = life-changing, burn = intense, shift = notable
  raw: string; // Raw aspect notation like "Saturn square Sun"
}

export interface LifeTimeline {
  events: TimelineStrike[];
  birthYear: number;
  currentAge: number;
  birthDate: string;
}

// Major outer planets + personal stress points
const MAJOR_TRANSITING_PLANETS = ['saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'jupiter', 'mars'];
const SENSITIVE_NATAL_POINTS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'ascendant', 'midheaven'];

const MAJOR_ASPECTS = [
  { name: 'conjunction', symbol: '☌', angle: 0, orb: 8 },
  { name: 'opposition', symbol: '☍', angle: 180, orb: 8 },
  { name: 'square', symbol: '□', angle: 90, orb: 6 },
  { name: 'trine', symbol: '△', angle: 120, orb: 6 },
  { name: 'sextile', symbol: '⚹', angle: 60, orb: 4 }
];

/**
 * Calculate aspect between two longitudes
 */
function findAspect(lon1: number, lon2: number): { aspect: string; symbol: string; orb: number } | null {
  let diff = Math.abs(lon1 - lon2);
  if (diff > 180) diff = 360 - diff;

  for (const aspectType of MAJOR_ASPECTS) {
    const orbDiff = Math.abs(diff - aspectType.angle);
    if (orbDiff <= aspectType.orb) {
      return {
        aspect: aspectType.name,
        symbol: aspectType.symbol,
        orb: orbDiff
      };
    }
  }
  return null;
}

/**
 * Generate raw one-liner for a transit
 */
function generateStrikeOneLiner(
  transitingPlanet: string,
  natalPlanet: string,
  aspect: string,
  year: number
): string {
  const planet = transitingPlanet.charAt(0).toUpperCase() + transitingPlanet.slice(1);
  const natal = natalPlanet.charAt(0).toUpperCase() + natalPlanet.slice(1);

  // Saturn strikes
  if (transitingPlanet === 'saturn') {
    if (aspect === 'conjunction') return `Saturn conjunct ${natal}. Test arrives.`;
    if (aspect === 'square') return `Saturn square ${natal}. First real wall.`;
    if (aspect === 'opposition') return `Saturn opposite ${natal}. Pressure peaks.`;
    if (aspect === 'trine') return `Saturn trine ${natal}. Structure builds.`;
  }

  // Pluto strikes
  if (transitingPlanet === 'pluto') {
    if (aspect === 'conjunction') return `Pluto conjunct ${natal}. Death wasn't literal. Everything else.`;
    if (aspect === 'square') return `Pluto square ${natal}. Reckoning.`;
    if (aspect === 'opposition') return `Pluto opposite ${natal}. Power stripped. Or seized.`;
    if (aspect === 'trine') return `Pluto trine ${natal}. Transformation, no fight.`;
  }

  // Uranus strikes
  if (transitingPlanet === 'uranus') {
    if (aspect === 'conjunction') return `Uranus conjunct ${natal}. Lightning hit.`;
    if (aspect === 'square') return `Uranus square ${natal}. Everything shook.`;
    if (aspect === 'opposition') return `Uranus opposite ${natal}. Rebellion.`;
    if (aspect === 'trine') return `Uranus trine ${natal}. Change invited. You said yes.`;
  }

  // Neptune strikes
  if (transitingPlanet === 'neptune') {
    if (aspect === 'conjunction') return `Neptune conjunct ${natal}. Fog rolled in.`;
    if (aspect === 'square') return `Neptune square ${natal}. Lies soft. Truth loud.`;
    if (aspect === 'opposition') return `Neptune opposite ${natal}. Illusion cracked.`;
    if (aspect === 'trine') return `Neptune trine ${natal}. Dreams felt real.`;
  }

  // Chiron strikes
  if (transitingPlanet === 'chiron') {
    if (aspect === 'conjunction') return `Chiron return. Wound became teacher.`;
    if (aspect === 'square') return `Chiron square ${natal}. Pain with purpose.`;
    if (aspect === 'opposition') return `Chiron opposite ${natal}. Healing through fire.`;
  }

  // Jupiter strikes
  if (transitingPlanet === 'jupiter') {
    if (aspect === 'conjunction') return `Jupiter conjunct ${natal}. Window opened.`;
    if (aspect === 'square') return `Jupiter square ${natal}. Too much, too fast.`;
    if (aspect === 'trine') return `Jupiter trine ${natal}. Luck tasted like sugar.`;
    if (aspect === 'opposition') return `Jupiter opposite ${natal}. Excess revealed the edge.`;
  }

  // Mars strikes
  if (transitingPlanet === 'mars') {
    if (aspect === 'conjunction' && ['sun', 'moon'].includes(natalPlanet)) {
      return `Mars conjunct ${natal}. Fire lit.`;
    }
    if (aspect === 'square' && ['saturn', 'pluto'].includes(natalPlanet)) {
      return `Mars square ${natal}. Force met wall.`;
    }
    if (aspect === 'opposition' && natalPlanet === 'sun') {
      return `Mars opposite Sun. Fight or freeze.`;
    }
  }

  // Generic fallback
  return `${planet} ${aspect} ${natal}`;
}

/**
 * Determine intensity level
 */
function getIntensity(transitingPlanet: string, aspect: string, orb: number): 'strike' | 'burn' | 'shift' {
  // Tight orbs (< 1°) are always strikes
  if (orb < 1) return 'strike';

  // Major planets with hard aspects
  if (['saturn', 'pluto', 'uranus', 'chiron'].includes(transitingPlanet)) {
    if (['conjunction', 'opposition', 'square'].includes(aspect)) {
      return orb < 3 ? 'strike' : 'burn';
    }
  }

  // Neptune can be a slow dissolve (burn)
  if (transitingPlanet === 'neptune' && ['conjunction', 'square', 'opposition'].includes(aspect)) {
    return 'burn';
  }

  return 'shift';
}

/**
 * Calculate transits for a specific year
 */
async function calculateYearTransits(
  year: number,
  natalPlanets: Record<string, number>,
  birthDate: string
): Promise<TimelineStrike[]> {
  const strikes: TimelineStrike[] = [];
  const birthYear = parseInt(birthDate.split('-')[0]);
  const age = year - birthYear;

  // Sample 12 points throughout the year (one per month)
  for (let month = 1; month <= 12; month++) {
    try {
      const date = new Date(year, month - 1, 15, 12, 0, 0); // month is 0-indexed in Date
      const transitPositions = await getPlanetPositions(date);

      // Check each major transiting planet against each natal point
      for (const transitingPlanet of MAJOR_TRANSITING_PLANETS) {
        const transitLon = (transitPositions as any)[transitingPlanet]?.longitude;
        if (!transitLon) continue;

        for (const natalPoint of SENSITIVE_NATAL_POINTS) {
          const natalLon = natalPlanets[natalPoint];
          if (!natalLon) continue;

          const aspectData = findAspect(transitLon, natalLon);
          if (aspectData) {
            const oneLiner = generateStrikeOneLiner(transitingPlanet, natalPoint, aspectData.aspect, year);
            const intensity = getIntensity(transitingPlanet, aspectData.aspect, aspectData.orb);

            strikes.push({
              id: `${year}-${month}-${transitingPlanet}-${aspectData.aspect}-${natalPoint}`,
              year,
              age,
              month,
              transitingPlanet,
              natalPlanet: natalPoint,
              aspect: aspectData.aspect,
              orb: aspectData.orb,
              exactDate: `${year}-${month.toString().padStart(2, '0')}-15`,
              oneLiner,
              intensity,
              raw: `${transitingPlanet.charAt(0).toUpperCase() + transitingPlanet.slice(1)} ${aspectData.symbol} ${natalPoint.charAt(0).toUpperCase() + natalPoint.slice(1)}`
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error calculating transits for ${year}-${month}:`, error);
    }
  }

  return strikes;
}

/**
 * Build complete life timeline
 */
export async function buildLifeTimeline(
  birthDate: string,
  natalChart: PlanetPosition[]
): Promise<LifeTimeline> {
  const birthYear = parseInt(birthDate.split('-')[0]);
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  // Build natal planet lookup
  const natalPlanets: Record<string, number> = {};
  natalChart.forEach(planet => {
    natalPlanets[planet.name.toLowerCase()] = planet.longitude;
  });

  // Calculate from birth to 85 years old (or current + 10 if past that)
  const endYear = Math.max(birthYear + 85, currentYear + 10);
  const allStrikes: TimelineStrike[] = [];

  console.log(`[Life Timeline] Scanning ${birthYear} to ${endYear} (${endYear - birthYear} years)...`);

  // Scan each year
  for (let year = birthYear; year <= endYear; year++) {
    const yearStrikes = await calculateYearTransits(year, natalPlanets, birthDate);
    allStrikes.push(...yearStrikes);
  }

  // Filter out duplicates (same transit appearing in multiple months)
  const uniqueStrikes = allStrikes.filter((strike, index, self) =>
    index === self.findIndex(s =>
      s.transitingPlanet === strike.transitingPlanet &&
      s.natalPlanet === strike.natalPlanet &&
      s.aspect === strike.aspect &&
      s.year === strike.year
    )
  );

  // Sort by year, then by intensity
  const intensityOrder = { strike: 3, burn: 2, shift: 1 };
  uniqueStrikes.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return intensityOrder[b.intensity] - intensityOrder[a.intensity];
  });

  console.log(`[Life Timeline] Found ${uniqueStrikes.length} major events`);

  return {
    events: uniqueStrikes,
    birthYear,
    currentAge,
    birthDate
  };
}
