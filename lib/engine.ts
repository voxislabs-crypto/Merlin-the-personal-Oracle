// lib/engine.ts
import "server-only";
import { utc_to_jd, calc_ut, constants, houses_ex } from "sweph";
import {
  PlanetPosition,
  BirthChartData,
  ProgressedChart,
  ElectionalWindow,
  LunarPhase,
  Transit,
  AspectPattern,
  Midpoint,
  FixedStar,
  KarmicIndicator,
  HousePosition,
} from "@/types/astrology";
import { getCurrentTransits } from "./astrology/transits";
import { createPlacidusHouses } from "./astrology/calculate";
import {
  calculateDignities,
  detectPatterns,
  calculateMidpoints,
  getFixedStarAspects,
  getKarmicIndicators,
  getProgressed,
  getElectionalWindows,
  calculateLunarPhase,
} from "./astrology/advanced";
import { computeMBTI } from "./personality/fusion";

export const normalizeAngle = (deg: number): number =>
  ((deg % 360) + 360) % 360;

const getZodiacPosition = (lon: number) => {
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];
  const normalized = normalizeAngle(lon);
  const signIndex = Math.floor(normalized / 30);
  const degreeInSign = normalized % 30;
  const degree = Math.floor(degreeInSign);
  const minute = Math.floor((degreeInSign - degree) * 60);
  return {
    sign: signs[signIndex],
    degree,
    minute,
  };
};

interface Aspect {
  planet1: { name: string; longitude: number };
  planet2: { name: string; longitude: number };
  type: string;
  orb: number;
  exact: boolean;
}

const calculateHouses = (jd: number, lat: number, lon: number) => {
  const hsys = "P"; // Placidus
  const houseResult = houses_ex(jd, 0, lat, lon, "P");

  const houses = (houseResult as any).house || []; // 12 houses
  const points = (houseResult as any).points || []; // Ascendant, MC, etc.

  const housePositions: HousePosition[] = [];
  for (let i = 0; i < 12; i++) {
    const pos = normalizeAngle(Number(houses[i]));
    const zodiac = getZodiacPosition(pos);
    housePositions.push({
      house: i + 1,
      position: pos,
      ...zodiac,
      longitude: pos,
    });
  }

  const ascendant = normalizeAngle(Number(points[0])); // First point is usually Ascendant
  const mc = normalizeAngle(Number(points[1])); // Second point is usually MC

  return {
    houses: housePositions,
    ascendant: { longitude: ascendant, ...getZodiacPosition(ascendant) },
    mc: { longitude: mc, ...getZodiacPosition(mc) },
  };
};

const assignHousesToPlanets = (
  planets: PlanetPosition[],
  houses: HousePosition[]
) => {
  return planets.map((planet) => {
    const normalized = normalizeAngle(planet.longitude);
    let houseNum = 1;
    for (let i = 0; i < 12; i++) {
      const current = houses[i]?.position ?? 0;
      let next = houses[(i + 1) % 12]?.position ?? 0;
      if (next < current) next += 360; // Handle wrap
      if (normalized >= current && normalized < next) {
        houseNum = houses[i]?.house ?? 1;
        break;
      }
    }
    return { ...planet, house: houseNum };
  });
};

const calculateAspects = (planets: PlanetPosition[]): Aspect[] => {
  const aspects: Aspect[] = [];
  const major = [
    { type: "Conjunction", angle: 0, orb: 10 },
    { type: "Sextile", angle: 60, orb: 6 },
    { type: "Square", angle: 90, orb: 8 },
    { type: "Trine", angle: 120, orb: 8 },
    { type: "Opposition", angle: 180, orb: 10 },
  ];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const asp of major) {
        const orbDiff = Math.abs(diff - asp.angle);
        if (orbDiff <= asp.orb) {
          aspects.push({
            planet1: { name: p1.name, longitude: p1.longitude },
            planet2: { name: p2.name, longitude: p2.longitude },
            type: asp.type,
            orb: orbDiff,
            exact: orbDiff < 1,
          });
          break;
        }
      }
    }
  }
  return aspects;
};

export const calculateNatalPositions = (
  birthDate: string,
  birthTime: string = "12:00"
) => {
  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime.split(":").map(Number);

  const jdResult = utc_to_jd(
    year,
    month,
    day,
    hour,
    minute,
    0,
    constants.SE_GREG_CAL
  );
  if (jdResult.flag !== constants.OK) throw new Error("JD calculation failed");

  const jd = jdResult.data[0];

  const planets = [
    { id: constants.SE_SUN, name: "Sun" },
    { id: constants.SE_MOON, name: "Moon" },
    { id: constants.SE_MERCURY, name: "Mercury" },
    { id: constants.SE_VENUS, name: "Venus" },
    { id: constants.SE_MARS, name: "Mars" },
    { id: constants.SE_JUPITER, name: "Jupiter" },
    { id: constants.SE_SATURN, name: "Saturn" },
    { id: constants.SE_URANUS, name: "Uranus" },
    { id: constants.SE_NEPTUNE, name: "Neptune" },
    { id: constants.SE_PLUTO, name: "Pluto" },
    { id: constants.SE_MEAN_NODE, name: "North Node" },
  ];

  const positions = planets.map((planet) => {
    const result = calc_ut(jd, planet.id, constants.SEFLG_SWIEPH);
    if (result.flag < 1) throw new Error(`Failed ${planet.name}`);

    const longitude = result.data[0];
    const latitude = result.data[1];
    const distance = result.data[2];
    const normalized = normalizeAngle(longitude);
    const zodiac = getZodiacPosition(normalized);

    return {
      name: planet.name,
      longitude: normalized,
      latitude,
      distance,
      ...zodiac,
    };
  });

  return { jd, positions };
};

const calculatePlanets = (jd: number): PlanetPosition[] => {
  const planets = [
    { id: constants.SE_SUN, name: "Sun" },
    { id: constants.SE_MOON, name: "Moon" },
    { id: constants.SE_MERCURY, name: "Mercury" },
    { id: constants.SE_VENUS, name: "Venus" },
    { id: constants.SE_MARS, name: "Mars" },
    { id: constants.SE_JUPITER, name: "Jupiter" },
    { id: constants.SE_SATURN, name: "Saturn" },
    { id: constants.SE_URANUS, name: "Uranus" },
    { id: constants.SE_NEPTUNE, name: "Neptune" },
    { id: constants.SE_PLUTO, name: "Pluto" },
    { id: constants.SE_MEAN_NODE, name: "North Node" },
  ];

  return planets.map((planet) => {
    const result = calc_ut(jd, planet.id, constants.SEFLG_SWIEPH);
    if (result.flag < 1) throw new Error(`Failed ${planet.name}`);

    const longitude = result.data[0];
    const latitude = result.data[1];
    const distance = result.data[2];
    const normalized = normalizeAngle(longitude);
    const zodiac = getZodiacPosition(normalized);

    return {
      name: planet.name,
      longitude: normalized,
      latitude,
      distance,
      ...zodiac,
    };
  });
};

export const calculateTransits = (natalPositions: PlanetPosition[]) => {
  return getCurrentTransits(natalPositions);
};

export const calculateBirthChart = (
  birthDate: string,
  birthTime?: string,
  lat?: number,
  lon?: number,
  options?: {
    includePatterns?: boolean;
    includeMidpoints?: boolean;
    includeFixedStars?: boolean;
    includeKarmic?: boolean;
    includeProgressed?: boolean;
    includeElectional?: boolean;
    includeTransits?: boolean;
    progressedYears?: number;
  }
): BirthChartData => {
  // Parse birth date and time
  const date = new Date(birthDate);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  let hour = 0,
    minute = 0,
    second = 0;

  if (birthTime) {
    const [h, m, s] = birthTime.split(":").map(Number);
    hour = h || 0;
    minute = m || 0;
    second = s || 0;
  }

  // Convert to Julian Day
  const jdResult = utc_to_jd(
    year,
    month,
    day,
    hour,
    minute,
    second,
    constants.SE_GREG_CAL
  );
  const jd = jdResult.data[0];

  // Calculate natal positions
  const positions = calculateNatalPositions(
    date.toISOString().split("T")[0],
    birthTime
  );
  const planetsWithDignities = calculateDignities(positions.positions);

  // Calculate houses if location provided
  let houses: HousePosition[] = [];
  let ascendant = { longitude: 0, sign: "Aries", degree: 0, minute: 0 };
  let mc = { longitude: 0, sign: "Aries", degree: 0, minute: 0 };
  let houseSystemData = null;

  if (lat !== undefined && lon !== undefined) {
    // Create Placidus house system for additional data
    houseSystemData = createPlacidusHouses(jd, lat, lon);

    const houseResult = houses_ex(jd, 0, lat, lon, "P" as any);
    const houseLongitudes = (houseResult as any).house || [];

    houses = houseLongitudes.map((cusp: any, i: number) => {
      const { sign, degree, minute } = getZodiacPosition(Number(cusp));
      return {
        house: i + 1,
        position: Number(cusp),
        sign,
        degree,
        minute,
        longitude: Number(cusp), // Add longitude for compatibility
      };
    });

    // Add house positions to planets
    const planetsWithHouses = planetsWithDignities.map((planet) => {
      const house = houses.find((h) => {
        const nextHouse = houses[(houses.indexOf(h) + 1) % 12];
        return (
          planet.longitude >= (h.position ?? 0) &&
          planet.longitude < (nextHouse?.position ?? 360)
        );
      });
      return { ...planet, house: house?.house || 1 };
    });

    // Calculate angles
    const ascResult = calc_ut(
      jd,
      constants.SE_ASC,
      constants.SEFLG_SIDEREAL | constants.SEFLG_SWIEPH
    );
    const mcResult = calc_ut(
      jd,
      constants.SE_MC,
      constants.SEFLG_SIDEREAL | constants.SEFLG_SWIEPH
    );

    const ascLong = normalizeAngle(ascResult.data[0]);
    const mcLong = normalizeAngle(mcResult.data[0]);

    ascendant = { longitude: ascLong, ...getZodiacPosition(ascLong) };
    mc = { longitude: mcLong, ...getZodiacPosition(mcLong) };
  }

  // Calculate aspects
  const aspects = calculateAspects(planetsWithDignities);

  // Initialize advanced features
  let aspectPatterns: AspectPattern[] = [];
  let midpoints: Midpoint[] = [];
  let fixedStars: FixedStar[] = [];
  let karmic: KarmicIndicator[] = [];
  let progressed: ProgressedChart | undefined;
  let electional: ElectionalWindow[] = [];
  let moonPhase: LunarPhase | undefined;
  let transits: Transit[] = [];

  // Calculate advanced features based on options
  if (options?.includePatterns !== false) {
    aspectPatterns = detectPatterns(planetsWithDignities, aspects);
  }

  if (options?.includeMidpoints !== false) {
    midpoints = calculateMidpoints(planetsWithDignities);
  }

  if (options?.includeFixedStars !== false) {
    fixedStars = getFixedStarAspects(planetsWithDignities);
  }

  if (options?.includeKarmic !== false) {
    karmic = getKarmicIndicators(planetsWithDignities, aspects);
  }

  if (options?.includeProgressed !== false) {
    progressed = getProgressed(
      planetsWithDignities,
      options?.progressedYears || 42,
      birthDate
    );
  }

  if (options?.includeElectional !== false) {
    electional = getElectionalWindows();
  }

  // Always include moon phase
  moonPhase = calculateLunarPhase(jd);

  if (options?.includeTransits !== false) {
    const transitData = getCurrentTransits(planetsWithDignities);
    transits = transitData.map((t) => ({
      transitingPlanet: t.transitingPlanet,
      natalPlanet: t.natalPlanet,
      aspect: t.aspect,
      orb: t.orb,
      exact: t.exact,
      applying: t.orb < 1, // Simplified
      separating: t.orb > 2, // Simplified
      currentPosition: 0, // Would need actual transiting position
      natalPosition: 0, // Would need natal position
      starts: new Date().toISOString(), // Simplified
      peaks: new Date().toISOString(),
      ends: new Date().toISOString(),
      intensity: t.exact ? "strong" : t.orb < 2 ? "moderate" : "weak",
      theme: `${t.transitingPlanet} ${t.aspect} ${t.natalPlanet}`,
    }));
  }

  // Calculate MBTI personality type from birth chart
  const chartData: BirthChartData = {
    jd,
    positions: planetsWithDignities,
    houses,
    ascendant,
    mc,
    aspects,
    aspectPatterns,
    midpoints,
    fixedStars,
    karmic,
    progressed: progressed || {
      date: new Date().toISOString(),
      positions: [],
      aspects: [],
      solarReturn: false,
      lunarReturn: false,
      progressedMoon: { phase: "Unknown", sign: "Unknown", house: 1 },
      progressedSun: { sign: "Unknown", house: 1 },
    },
    electional,
    moonPhase: moonPhase || {
      type: "New Moon",
      phase: "Unknown",
      illumination: 0,
      angle: 0,
      nextNewMoon: "",
      nextFullMoon: "",
    },
    transits,
    houseSystem: houseSystemData
      ? {
          cusps: houseSystemData.cusps,
          ascendant: houseSystemData.ascendant,
          mc: houseSystemData.mc,
          vertex: houseSystemData.vertex,
        }
      : undefined,
    birthData: {
      birthDate,
      birthTime,
      coordinates:
        lat !== undefined && lon !== undefined ? { lat, lon } : undefined,
    },
  };

  // Compute MBTI after chart data is assembled
  const mbti = computeMBTI(chartData);

  return {
    ...chartData,
    mbti,
  };
};
