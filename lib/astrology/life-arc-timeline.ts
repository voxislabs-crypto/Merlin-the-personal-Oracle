/**
 * Life Arc Timeline - Raw transit-based life events
 * No phases. No scaffolding. Just what happened and when.
 */

import { toJulianDay, getPlanetPositions } from '../swiss-ephemeris-core';
import type { PlanetPositions } from '../swiss-ephemeris-core';

export interface LifeEvent {
  id: string;
  year: number;
  age: number;
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  oneLiner: string;
  weight: 'strike' | 'echo' | 'whisper'; // strike = major, echo = significant, whisper = minor
}

export interface LifeTimeline {
  events: LifeEvent[];
  birthYear: number;
  currentAge: number;
}

const MAJOR_PLANETS = ['sun', 'moon', 'mars', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'];
const ASPECT_TYPES = [
  { name: 'conjunction', angle: 0, orb: 8, weight: 10 },
  { name: 'opposition', angle: 180, orb: 8, weight: 10 },
  { name: 'square', angle: 90, orb: 6, weight: 9 },
  { name: 'trine', angle: 120, orb: 6, weight: 6 },
  { name: 'sextile', angle: 60, orb: 4, weight: 4 }
];

/**
 * Calculate if an aspect exists between two planetary positions
 */
function calculateAspect(lon1: number, lon2: number): { aspect: string; orb: number; weight: number } | null {
  let diff = Math.abs(lon1 - lon2);
  if (diff > 180) diff = 360 - diff;

  for (const aspectType of ASPECT_TYPES) {
    const orbDiff = Math.abs(diff - aspectType.angle);
    if (orbDiff <= aspectType.orb) {
      return {
        aspect: aspectType.name,
        orb: orbDiff,
        weight: aspectType.weight - orbDiff // Tighter orb = higher weight
      };
    }
  }
  return null;
}

/**
 * Generate a raw one-liner for a transit event
 */
function generateOneLiner(
  transitingPlanet: string,
  natalPlanet: string,
  aspect: string,
  year: number,
  age: number
): string {
  const templates: Record<string, Record<string, string[]>> = {
    saturn: {
      conjunction: [
        `Saturn met your ${natalPlanet}. The wall appeared.`,
        `Saturn touched ${natalPlanet}. Time to pay the toll.`,
        `Saturn on ${natalPlanet}. The test began.`
      ],
      square: [
        `Saturn squared ${natalPlanet}. First real wall. You didn't break. You bent.`,
        `Saturn blocked ${natalPlanet}. The hard way became the only way.`,
        `Saturn challenged ${natalPlanet}. No shortcuts left.`
      ],
      opposition: [
        `Saturn opposed ${natalPlanet}. The pressure peak.`,
        `Saturn versus ${natalPlanet}. Choose or be chosen.`,
        `Saturn faced ${natalPlanet}. The final exam.`
      ]
    },
    pluto: {
      conjunction: [
        `Pluto conjunct ${natalPlanet}. Death wasn't literal. Just everything else.`,
        `Pluto touched ${natalPlanet}. The excavation began.`,
        `Pluto met ${natalPlanet}. Not death. Birth.`
      ],
      square: [
        `Pluto squared ${natalPlanet}. The reckoning.`,
        `Pluto cut into ${natalPlanet}. What's left is real.`,
        `Pluto versus ${natalPlanet}. Transform or be transformed.`
      ],
      opposition: [
        `Pluto opposed ${natalPlanet}. The power struggle.`,
        `Pluto faced ${natalPlanet}. No more hiding.`,
        `Pluto versus ${natalPlanet}. Death of the old self.`
      ]
    },
    uranus: {
      conjunction: [
        `Uranus hit ${natalPlanet}. The lightning strike.`,
        `Uranus met ${natalPlanet}. Everything changed. Overnight.`,
        `Uranus on ${natalPlanet}. The awakening.`
      ],
      square: [
        `Uranus squared ${natalPlanet}. The rebellion.`,
        `Uranus shook ${natalPlanet}. You broke the chain.`,
        `Uranus versus ${natalPlanet}. Freedom had a price.`
      ],
      opposition: [
        `Uranus opposed ${natalPlanet}. The scream. The move. The night you left.`,
        `Uranus faced ${natalPlanet}. Mid-life wasn't a crisis. It was a birth.`,
        `Uranus versus ${natalPlanet}. You finally laughed back.`
      ]
    },
    neptune: {
      conjunction: [
        `Neptune touched ${natalPlanet}. Fog rolled in.`,
        `Neptune met ${natalPlanet}. Lies felt soft. Truth felt loud.`,
        `Neptune on ${natalPlanet}. You learned to swim blind.`
      ],
      square: [
        `Neptune squared ${natalPlanet}. Illusions cracked.`,
        `Neptune confused ${natalPlanet}. Nothing was clear.`,
        `Neptune versus ${natalPlanet}. Reality dissolved.`
      ]
    },
    jupiter: {
      trine: [
        `Jupiter trine ${natalPlanet}. Luck tasted like sugar. You didn't trust it.`,
        `Jupiter blessed ${natalPlanet}. The door opened.`,
        `Jupiter smiled on ${natalPlanet}. Expansion.`
      ],
      conjunction: [
        `Jupiter met ${natalPlanet}. Growth or excess. Your choice.`,
        `Jupiter on ${natalPlanet}. Opportunities multiplied.`
      ]
    },
    chiron: {
      conjunction: [
        `Chiron returned. The wound talks back. You finally listened.`,
        `Chiron met ${natalPlanet}. Not how to heal. How to carry.`,
        `Chiron touched ${natalPlanet}. The teacher appeared.`
      ]
    }
  };

  const planetTemplates = templates[transitingPlanet.toLowerCase()]?.[aspect];
  if (planetTemplates && planetTemplates.length > 0) {
    return planetTemplates[Math.floor(Math.random() * planetTemplates.length)];
  }

  // Generic fallback
  return `${transitingPlanet} ${aspect} ${natalPlanet}. Age ${age}. ${year}.`;
}

/**
 * Calculate life timeline from birth chart
 */
export async function calculateLifeTimeline(
  birthDate: string,
  birthTime: string,
  lat: number,
  lon: number
): Promise<LifeTimeline> {
  const birth = new Date(`${birthDate}T${birthTime}`);
  const birthYear = birth.getFullYear();
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  // Calculate natal positions
  const natalPlanets = await getPlanetPositions(birth);

  const events: LifeEvent[] = [];

  // Loop through each year from birth to current age + 3 years
  for (let age = 7; age <= currentAge + 3; age++) {
    const year = birthYear + age;
    const yearDate = new Date(year, 6, 1); // Mid-year check

    try {
      const transitPlanets = await getPlanetPositions(yearDate);

      // Check all major transit-to-natal aspects
      for (const transitPlanet of MAJOR_PLANETS) {
        for (const natalPlanet of MAJOR_PLANETS) {
          const transitLon = (transitPlanets as any)[transitPlanet]?.longitude;
          const natalLon = (natalPlanets as any)[natalPlanet]?.longitude;

          if (transitLon === undefined || natalLon === undefined) continue;

          const aspectResult = calculateAspect(transitLon, natalLon);
          if (aspectResult && aspectResult.weight >= 7) { // Only major aspects
            const weight = aspectResult.weight >= 9 ? 'strike' : aspectResult.weight >= 7 ? 'echo' : 'whisper';
            
            events.push({
              id: `${year}-${transitPlanet}-${aspectResult.aspect}-${natalPlanet}`,
              year,
              age,
              transitingPlanet: transitPlanet,
              natalPlanet: natalPlanet,
              aspect: aspectResult.aspect,
              orb: aspectResult.orb,
              oneLiner: generateOneLiner(transitPlanet, natalPlanet, aspectResult.aspect, year, age),
              weight
            });
          }
        }
      }
    } catch (error) {
      console.log(`Skipping year ${year}:`, error);
    }
  }

  // Sort by year, then by weight (strikes first)
  events.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    const weightOrder = { strike: 0, echo: 1, whisper: 2 };
    return weightOrder[a.weight] - weightOrder[b.weight];
  });

  return {
    events,
    birthYear,
    currentAge
  };
}
