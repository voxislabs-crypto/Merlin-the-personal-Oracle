import "server-only";
import { PlanetPosition } from '@/types/astrology';
import { getSweph } from '@/lib/sweph-runtime';

const normalizeAngle = (deg: number): number => ((deg % 360) + 360) % 360;

const PLANET_THEMES: Record<string, string> = {
  Sun: 'identity, vitality, and confidence',
  Moon: 'emotions, safety needs, and daily rhythms',
  Mercury: 'thinking, communication, and decisions',
  Venus: 'relationships, values, and attraction',
  Mars: 'drive, conflict style, and initiative',
  Jupiter: 'growth, faith, and expansion',
  Saturn: 'discipline, boundaries, and responsibility',
  Uranus: 'freedom, disruption, and breakthroughs',
  Neptune: 'intuition, imagination, and surrender',
  Pluto: 'power, transformation, and deep renewal',
};

const ASPECT_MEANINGS: Record<string, string> = {
  Conjunction: 'This combines both energies into one concentrated force that demands expression.',
  Sextile: 'This opens opportunities through conscious effort, collaboration, and practical action.',
  Square: 'This creates productive tension that pushes change, course-correction, and growth.',
  Trine: 'This supports a natural flow, making integration and progress easier than usual.',
  Opposition: 'This highlights polarity and balance, asking for awareness and integration of extremes.',
};

const SIGN_THEMES: Record<string, string> = {
  Aries: 'bold action, urgency, and leadership',
  Taurus: 'stability, resources, and embodiment',
  Gemini: 'information flow, dialogue, and adaptability',
  Cancer: 'home, emotional security, and care',
  Leo: 'creative self-expression and heart-centered visibility',
  Virgo: 'refinement, health routines, and practical service',
  Libra: 'relationship balance, fairness, and diplomacy',
  Scorpio: 'intensity, trust dynamics, and deep change',
  Sagittarius: 'beliefs, exploration, and long-range vision',
  Capricorn: 'structure, responsibility, and long-term outcomes',
  Aquarius: 'innovation, systems change, and collective perspective',
  Pisces: 'sensitivity, spiritual integration, and release',
};

function getTransitIntensity(orb: number): string {
  if (orb < 0.5) return 'very exact and strongly felt now';
  if (orb < 1.5) return 'strong and active';
  if (orb < 3) return 'building and increasingly noticeable';
  return 'present in the background';
}

function buildTransitDescription(params: {
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  transitingSign: string;
}): string {
  const { transitingPlanet, natalPlanet, aspect, orb, transitingSign } = params;
  const transitingTheme = PLANET_THEMES[transitingPlanet] || transitingPlanet.toLowerCase();
  const natalTheme = PLANET_THEMES[natalPlanet] || natalPlanet.toLowerCase();
  const aspectMeaning = ASPECT_MEANINGS[aspect] || 'This aspect marks an important interaction between these two planetary themes.';
  const signTheme = SIGN_THEMES[transitingSign] || 'the current sign backdrop shapes how this plays out.';
  const intensity = getTransitIntensity(orb);

  return `${transitingPlanet} ${aspect.toLowerCase()} natal ${natalPlanet} connects ${transitingTheme} with your ${natalTheme}. ${aspectMeaning} Because ${transitingPlanet} is in ${transitingSign}, themes of ${signTheme} are emphasized. With an orb of ${orb.toFixed(1)}°, this transit is ${intensity}.`;
}

function buildTransitShortDescription(params: {
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
}): string {
  const { transitingPlanet, natalPlanet, aspect, orb } = params;
  const intensity = getTransitIntensity(orb);
  const actionMap: Record<string, string> = {
    Conjunction: 'amplify and focus this area',
    Sextile: 'use this opening through intentional action',
    Square: 'work through friction and make adjustments',
    Trine: 'lean into what is flowing naturally',
    Opposition: 'balance competing pulls with awareness',
  };
  const action = actionMap[aspect] || 'pay close attention to this pattern';

  return `${transitingPlanet} ${aspect.toLowerCase()} natal ${natalPlanet}: ${action}; this energy is ${intensity}.`;
}

export interface TransitMatch {
  transitingPlanet: string;
  transitingSign: string;
  natalPlanet: string;
  natalSign?: string;
  aspect: string;
  orb: number;
  exact: boolean;
  shortDescription: string;
  description: string;
  tags?: string[];
}

// Calculate planetary positions for a specific date/time using sweph
const calculateCurrentPlanets = (asOfDate: Date = new Date()): PlanetPosition[] => {
  const sweph = getSweph();
  if (!sweph) {
    console.warn("[transits] sweph not available, cannot calculate real transits");
    return [];
  }

  try {
    const year = asOfDate.getUTCFullYear();
    const month = asOfDate.getUTCMonth() + 1;
    const day = asOfDate.getUTCDate();
    const hour = asOfDate.getUTCHours();
    const minute = asOfDate.getUTCMinutes();

    // Get Julian Day for current time
    const jdResult = sweph.utc_to_jd(
      year,
      month,
      day,
      hour,
      minute,
      0,
      sweph.constants.SE_GREG_CAL
    );

    if (jdResult.flag !== sweph.constants.OK) {
      console.error("[transits] JD calculation failed");
      return [];
    }

    const jd = jdResult.data[0];
    console.log(`[transits] Calculating positions for ${asOfDate.toISOString()} (JD ${jd})`);

    // Calculate current positions for all planets
    const planets = [
      { id: sweph.constants.SE_SUN, name: "Sun" },
      { id: sweph.constants.SE_MOON, name: "Moon" },
      { id: sweph.constants.SE_MERCURY, name: "Mercury" },
      { id: sweph.constants.SE_VENUS, name: "Venus" },
      { id: sweph.constants.SE_MARS, name: "Mars" },
      { id: sweph.constants.SE_JUPITER, name: "Jupiter" },
      { id: sweph.constants.SE_SATURN, name: "Saturn" },
      { id: sweph.constants.SE_URANUS, name: "Uranus" },
      { id: sweph.constants.SE_NEPTUNE, name: "Neptune" },
      { id: sweph.constants.SE_PLUTO, name: "Pluto" },
    ];

    const currentPositions: PlanetPosition[] = planets.map((planet) => {
      const result = sweph.calc_ut(jd, planet.id, sweph.constants.SEFLG_SWIEPH);
      if (result.flag < 1) {
        console.error(`[transits] Failed to calculate ${planet.name}`);
        throw new Error(`Failed ${planet.name}`);
      }

      const longitude = normalizeAngle(result.data[0]);
      const latitude = result.data[1];
      const distance = result.data[2];

      // Get zodiac position
      const signs = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
      ];
      const signIndex = Math.floor(longitude / 30);
      const degreeInSign = longitude % 30;
      const degree = Math.floor(degreeInSign);
      const minute = Math.floor((degreeInSign - degree) * 60);

      return {
        name: planet.name,
        longitude,
        latitude,
        distance,
        sign: signs[signIndex],
        degree,
        minute,
        house: 0, // Transits don't have houses until compared to natal chart
      };
    });

    return currentPositions;
  } catch (error) {
    console.error("[transits] Error calculating current planets:", error);
    return [];
  }
};

export const getTransitsForDate = (
  natalPlanets: PlanetPosition[],
  asOfDate: Date
): TransitMatch[] => {
  console.log(`[transits] Calculating transits vs natal chart for ${asOfDate.toISOString()}`);
  
  // Calculate where planets are RIGHT NOW
  const currentPositions = calculateCurrentPlanets(asOfDate);
  
  if (currentPositions.length === 0) {
    console.warn("[transits] No current positions calculated, cannot compute transits");
    return [];
  }

  // Log current positions for debugging
  console.log(`[transits] Current planetary positions:`);
  currentPositions.forEach(p => {
    console.log(`  ${p.name}: ${p.longitude.toFixed(2)}° (${p.sign} ${p.degree}°${p.minute}')`);
  });

  const aspects: TransitMatch[] = [];
  const major = [
    { type: 'Conjunction', angle: 0, orb: 10 },
    { type: 'Sextile', angle: 60, orb: 6 },
    { type: 'Square', angle: 90, orb: 8 },
    { type: 'Trine', angle: 120, orb: 8 },
    { type: 'Opposition', angle: 180, orb: 10 },
  ];

  // Compare current (transiting) positions with natal positions
  for (const trans of currentPositions) {
    for (const natal of natalPlanets) {
      let diff = Math.abs(trans.longitude - natal.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const asp of major) {
        const orbDiff = Math.abs(diff - asp.angle);
        if (orbDiff <= asp.orb) {
          const description = buildTransitDescription({
            transitingPlanet: trans.name,
            natalPlanet: natal.name,
            aspect: asp.type,
            orb: orbDiff,
            transitingSign: trans.sign,
          });
          const shortDescription = buildTransitShortDescription({
            transitingPlanet: trans.name,
            natalPlanet: natal.name,
            aspect: asp.type,
            orb: orbDiff,
          });

          const aspect: TransitMatch = {
            transitingPlanet: trans.name,
            transitingSign: trans.sign,
            natalPlanet: natal.name,
            natalSign: natal.sign,
            aspect: asp.type,
            orb: orbDiff,
            exact: orbDiff < 1,
            shortDescription,
            description,
          };
          aspects.push(aspect);
          console.log(`[transits] Found: ${trans.name} ${asp.type} natal ${natal.name} (orb: ${orbDiff.toFixed(2)}°)`);
          break;
        }
      }
    }
  }

  console.log(`[transits] Total transits found: ${aspects.length}`);


  return aspects;
};

export const getCurrentTransits = (natalPlanets: PlanetPosition[]): TransitMatch[] => {
  return getTransitsForDate(natalPlanets, new Date());
};

// getPlanetId and constants removed (no sweph)
