import 'server-only';

/**
 * Fixed Stars Database
 * Pre-computed star positions with meanings
 * These are used for natal chart analysis and transit overlays
 */

export interface FixedStar {
  name: string;
  longitude: number; // Tropical zodiac position (approximate, varies with precession)
  latitude: number;
  magnitude: number;
  constellation: string;
  meaning: string;
  keywords: string[];
  orb: number; // Maximum orb for conjunction (typically 1-2°)
}

// Royal/Major Fixed Stars (visible, historically significant)
export const MAJOR_FIXED_STARS: FixedStar[] = [
  {
    name: 'Regulus',
    longitude: 29.85, // Leo ~29°-30°
    latitude: -0.43,
    magnitude: 1.35,
    constellation: 'Leo',
    meaning: 'The Heart of the Lion. Royal power, leadership, pride. Rewards courage, punishes arrogance.',
    keywords: ['kingship', 'courage', 'pride', 'fame', 'ambition', 'authority'],
    orb: 2,
  },
  {
    name: 'Aldebaran',
    longitude: 9.73, // Gemini ~9°-10°
    latitude: 5.49,
    magnitude: 0.87,
    constellation: 'Taurus',
    meaning: 'Eye of Taurus. Prosperity, protection, revenge if wronged. Mars-like intensity.',
    keywords: ['prosperity', 'protection', 'strength', 'vengeance', 'reliability'],
    orb: 2,
  },
  {
    name: 'Antares',
    longitude: 9.72, // Scorpio ~9°-10°
    latitude: -4.65,
    magnitude: 0.92,
    constellation: 'Scorpio',
    meaning: 'Heart of Scorpio. Transformation, depth, shadow work. Mars mirror.',
    keywords: ['transformation', 'depths', 'shadow', 'intensity', 'rebirth'],
    orb: 2,
  },
  {
    name: 'Spica',
    longitude: 23.57, // Virgo ~23°-24°
    latitude: -2.05,
    magnitude: 0.98,
    constellation: 'Virgo',
    meaning: 'Ear of Wheat. Success through virtue, skill, discrimination. Grace under pressure.',
    keywords: ['virtue', 'skill', 'success', 'grace', 'discrimination', 'harvest'],
    orb: 2,
  },
  {
    name: 'Fomalhaut',
    longitude: 3.5, // Pisces ~3°-4°
    latitude: -29.38,
    magnitude: 1.16,
    constellation: 'Piscis Austrinus',
    meaning: 'Mouth of the Fish. Psychic gifts, intuition, occult knowledge. Water magic.',
    keywords: ['intuition', 'psychic', 'occult', 'water', 'mystery', 'revelation'],
    orb: 2,
  },
  {
    name: 'Algol',
    longitude: 26.16, // Taurus ~26°-27°
    latitude: 22.61,
    magnitude: 2.1,
    constellation: 'Perseus',
    meaning: 'Head of Medusa. Caution. Sudden change, transformation, seeing truth. Power of gaze.',
    keywords: ['caution', 'sudden change', 'truth-seeing', 'transformation', 'power'],
    orb: 1.5,
  },
  {
    name: 'Sirius',
    longitude: 14.1, // Cancer ~14°-15°
    latitude: -39.74,
    magnitude: -1.46,
    constellation: 'Canis Major',
    meaning: 'The Brightest Star. Nobility, genius, illumination. Dog star loyalty.',
    keywords: ['brilliance', 'illumination', 'loyalty', 'genius', 'fame', 'protection'],
    orb: 2,
  },
];

export interface NatalFixedStarAlignment {
  star: FixedStar;
  planet: string; // Planet name (Sun, Moon, etc.)
  longitude: number; // Planet's tropical longitude
  orb: number; // Actual orb to the star
  exact: boolean; // orb < 0.5°
  meaning: string; // Personalized interpretation
}

/**
 * Detect fixed star alignments in a natal chart
 * @param planets - Array of planet positions from BirthChartData
 * @returns Array of significant alignments
 */
export function detectNatalFixedStarAlignments(
  planets: Array<{ name: string; longitude: number }>
): NatalFixedStarAlignment[] {
  const alignments: NatalFixedStarAlignment[] = [];

  // Only check personal + transpersonal planets (skip chart angles for simplicity)
  const significantPlanets = [
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
    'Chiron',
  ];

  for (const planet of planets) {
    if (!significantPlanets.includes(planet.name)) continue;

    for (const star of MAJOR_FIXED_STARS) {
      const orb = Math.abs(
        ((planet.longitude - star.longitude + 180) % 360) - 180
      );

      // Check if within orb
      if (orb <= star.orb) {
        const exact = orb < 0.5;
        const meaning = generateFixedStarMeaning(planet.name, star);

        alignments.push({
          star,
          planet: planet.name,
          longitude: planet.longitude,
          orb,
          exact,
          meaning,
        });
      }
    }
  }

  // Sort by tightness (closest orbs first)
  return alignments.sort((a, b) => a.orb - b.orb);
}

/**
 * Generate personalized meaning for planet-star alignment
 */
function generateFixedStarMeaning(planetName: string, star: FixedStar): string {
  const planetMeanings: Record<string, string> = {
    Sun: 'your core identity',
    Moon: 'your emotional nature',
    Mercury: 'your thinking',
    Venus: 'your values and loves',
    Mars: 'your drive',
    Jupiter: 'your expansion',
    Saturn: 'your discipline',
    Uranus: 'your revolution',
    Neptune: 'your spirituality',
    Pluto: 'your transformation',
    Chiron: 'your wound and gift',
  };

  const planetAspect = planetMeanings[planetName] || 'your chart';
  const starQuality = star.keywords[0]; // First keyword

  return `${planetName} conjunct ${star.name} marks ${planetAspect} with ${starQuality}—${star.meaning}`;
}

/**
 * Check if any active transit conjuncts a natal fixed star
 * Used for real-time oracle readings
 * @param transitPlanet - Current transit planet position
 * @param natalAlignments - Pre-computed natal fixed-star alignments
 * @param maxOrb - Maximum orb for transit hit (typically 2°)
 * @returns Matching alignments if any
 */
export function checkTransitFixedStarHits(
  transitPlanet: { name: string; longitude: number },
  natalAlignments: NatalFixedStarAlignment[],
  maxOrb: number = 2
): NatalFixedStarAlignment[] {
  return natalAlignments.filter((alignment) => {
    // Check if transit is within orb of the natal fixed star
    const orb = Math.abs(
      ((transitPlanet.longitude - alignment.star.longitude + 180) % 360) - 180
    );
    return orb <= maxOrb;
  });
}

export default {
  MAJOR_FIXED_STARS,
  detectNatalFixedStarAlignments,
  checkTransitFixedStarHits,
};
