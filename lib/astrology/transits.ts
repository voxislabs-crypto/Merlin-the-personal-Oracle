import "server-only";
import { PlanetPosition } from '@/types/astrology';

const normalizeAngle = (deg: number): number => ((deg % 360) + 360) % 360;

// Function to safely get sweph at runtime
function getSweph() {
  try {
    const s = require("sweph");
    console.log("[transits.getSweph] ✓ sweph loaded successfully");
    return s;
  } catch (error) {
    console.warn("[transits.getSweph] ✗ Cannot load sweph:", String(error).slice(0, 150));
    return null;
  }
}

// Calculate current planetary positions using sweph
const calculateCurrentPlanets = (): PlanetPosition[] => {
  const sweph = getSweph();
  if (!sweph) {
    console.warn("[transits] sweph not available, cannot calculate real transits");
    return [];
  }

  try {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();

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
    console.log(`[transits] Calculating current positions for JD ${jd}`);

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

export const getCurrentTransits = (natalPlanets: PlanetPosition[]): Array<{
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  exact: boolean;
  tags?: string[];
}> => {
  console.log("[transits] Calculating current transits vs natal chart");
  
  // Calculate where planets are RIGHT NOW
  const currentPositions = calculateCurrentPlanets();
  
  if (currentPositions.length === 0) {
    console.warn("[transits] No current positions calculated, cannot compute transits");
    return [];
  }

  // Log current positions for debugging
  console.log(`[transits] Current planetary positions:`);
  currentPositions.forEach(p => {
    console.log(`  ${p.name}: ${p.longitude.toFixed(2)}° (${p.sign} ${p.degree}°${p.minute}')`);
  });

  const aspects = [];
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
          const aspect = {
            transitingPlanet: trans.name,
            natalPlanet: natal.name,
            aspect: asp.type,
            orb: orbDiff,
            exact: orbDiff < 1,
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

// getPlanetId and constants removed (no sweph)
