// lib/engine-fallback.ts - Fallback calculation system
import {
  BirthChartData,
  PlanetPosition,
  HousePosition as HousePositionType,
  Aspect as AspectType,
} from "@/types/astrology";

// Simplified planetary data for demonstration
const PLANETARY_DATA = {
  Sun: { speed: 0.9856, period: 365.25 },
  Moon: { speed: 13.1764, period: 27.32 },
  Mercury: { speed: 4.0923, period: 87.97 },
  Venus: { speed: 1.6021, period: 224.7 },
  Mars: { speed: 0.524, period: 686.98 },
  Jupiter: { speed: 0.0831, period: 4332.59 },
  Saturn: { speed: 0.0335, period: 10759.22 },
  Uranus: { speed: 0.0117, period: 30688.5 },
  Neptune: { speed: 0.006, period: 60182.0 },
  Pluto: { speed: 0.004, period: 90560.0 },
};

const ZODIAC_SIGNS = [
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

function getZodiacSign(longitude: number): string {
  return ZODIAC_SIGNS[Math.floor(longitude / 30) % 12];
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function getDegreeMinute(longitude: number): {
  degree: number;
  minute: number;
} {
  const degree = Math.floor(longitude % 30);
  const minute = Math.floor((longitude % 1) * 60);
  return { degree, minute };
}

function calculateJulianDay(date: string, time: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  // Simplified Julian Day calculation
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  const jd = jdn + (hour - 12) / 24 + minute / 1440;
  return jd;
}

function calculatePlanetPosition(
  planetName: string,
  jd: number,
  latitude: number = 0,
  longitude: number = 0
): PlanetPosition {
  const planetData = PLANETARY_DATA[planetName as keyof typeof PLANETARY_DATA];

  if (!planetData) {
    throw new Error(`Unknown planet: ${planetName}`);
  }

  // Simplified position calculation
  const daysSinceEpoch = jd - 2451545.0; // J2000.0 epoch
  let meanLongitude = normalizeAngle(daysSinceEpoch * planetData.speed);

  // Use a better deterministic moon model so fallback charts stay astrologically plausible.
  if (planetName === "Moon") {
    const L0 = normalizeAngle(218.316 + 13.176396 * daysSinceEpoch);
    const Mm = normalizeAngle(134.963 + 13.064993 * daysSinceEpoch);
    const Ms = normalizeAngle(357.529 + 0.98560028 * daysSinceEpoch);
    const D = normalizeAngle(297.85 + 12.190749 * daysSinceEpoch);
    const F = normalizeAngle(93.272 + 13.22935 * daysSinceEpoch);

    meanLongitude = normalizeAngle(
      L0 +
        6.289 * Math.sin(toRadians(Mm)) +
        1.274 * Math.sin(toRadians(2 * D - Mm)) +
        0.658 * Math.sin(toRadians(2 * D)) +
        0.214 * Math.sin(toRadians(2 * Mm)) -
        0.186 * Math.sin(toRadians(Ms)) -
        0.059 * Math.sin(toRadians(2 * D - 2 * Mm)) -
        0.057 * Math.sin(toRadians(2 * D - Ms - Mm)) +
        0.053 * Math.sin(toRadians(2 * D + Mm)) +
        0.046 * Math.sin(toRadians(2 * D - Ms)) +
        0.041 * Math.sin(toRadians(Ms - Mm)) -
        0.035 * Math.sin(toRadians(D)) -
        0.031 * Math.sin(toRadians(Ms + Mm)) -
        0.015 * Math.sin(toRadians(2 * F - 2 * D)) +
        0.011 * Math.sin(toRadians(2 * D - 4 * Mm))
    );
  }

  // Add some corrections for more realistic results
  const correction = Math.sin(daysSinceEpoch * 0.1) * 5;
  const finalLongitude = planetName === "Moon"
    ? meanLongitude
    : normalizeAngle(meanLongitude + correction);

  const sign = getZodiacSign(finalLongitude);
  const { degree, minute } = getDegreeMinute(finalLongitude);

  const latitudeBias = Math.sin(daysSinceEpoch * (planetData.speed / 25)) * 2;
  const distanceBias = 1 + 0.2 * Math.cos(daysSinceEpoch * (planetData.speed / 50));
  const retrogradeLike = Math.sin(daysSinceEpoch * (planetData.speed / 80)) < -0.92;

  return {
    name: planetName,
    longitude: finalLongitude,
    latitude: latitudeBias,
    distance: distanceBias,
    speed: planetData.speed,
    sign,
    degree,
    minute,
    retrograde: retrogradeLike,
  };
}

function calculateHousePositions(
  jd: number,
  latitude: number,
  longitude: number
): HousePositionType[] {
  const houses: HousePositionType[] = [];

  // Simplified house calculation (Placidus-like)
  for (let i = 0; i < 12; i++) {
    const houseLongitude = (i * 30 + longitude + jd * 0.1) % 360;
    const sign = getZodiacSign(houseLongitude);
    const { degree, minute } = getDegreeMinute(houseLongitude);

    houses.push({
      house: i + 1,
      position: houseLongitude,
      longitude: houseLongitude,
      sign,
      degree,
      minute,
    });
  }

  return houses;
}

function calculateAspects(planets: PlanetPosition[]): AspectType[] {
  const aspects: AspectType[] = [];
  const majorAspects = [
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

      for (const aspect of majorAspects) {
        const orbDiff = Math.abs(diff - aspect.angle);
        if (orbDiff <= aspect.orb) {
          aspects.push({
            planet1: { name: p1.name, longitude: p1.longitude },
            planet2: { name: p2.name, longitude: p2.longitude },
            type: aspect.type,
            orb: orbDiff,
            exact: orbDiff < 1,
          });
          break;
        }
      }
    }
  }

  return aspects;
}

export function calculateBirthChart(
  birthDate: string,
  birthTime: string,
  lat?: number,
  lon?: number
): BirthChartData {
  const latitude = lat || 0;
  const longitude = lon || 0;

  // Calculate Julian Day
  const jd = calculateJulianDay(birthDate, birthTime);

  // Calculate planetary positions
  const planets: PlanetPosition[] = [];
  for (const planetName of Object.keys(PLANETARY_DATA)) {
    try {
      const position = calculatePlanetPosition(
        planetName,
        jd,
        latitude,
        longitude
      );
      planets.push(position);
    } catch (error) {
      console.warn(`Could not calculate position for ${planetName}:`, error);
    }
  }

  // Calculate house positions
  const houses = calculateHousePositions(jd, latitude, longitude);

  // Calculate aspects
  const aspects = calculateAspects(planets);

  // Calculate ascendant and MC (simplified)
  const ascendantLongitude = (270 + longitude + jd * 0.1) % 360;
  const mcLongitude = (ascendantLongitude + 90) % 360;

  const ascendant = {
    longitude: ascendantLongitude,
    sign: getZodiacSign(ascendantLongitude),
    degree: getDegreeMinute(ascendantLongitude).degree,
    minute: getDegreeMinute(ascendantLongitude).minute,
  };

  const mc = {
    longitude: mcLongitude,
    sign: getZodiacSign(mcLongitude),
    degree: getDegreeMinute(mcLongitude).degree,
    minute: getDegreeMinute(mcLongitude).minute,
  };

  return {
    jd,
    positions: planets,
    planets: planets, // Add for compatibility with components
    houses,
    aspects,
    ascendant,
    mc,
    aspectPatterns: [],
    midpoints: [],
    fixedStars: [],
    karmic: [],
    progressed: {
      date: birthDate,
      positions: [],
      aspects: [],
      solarReturn: false,
      lunarReturn: false,
      progressedSun: { sign: "Aries", house: 1 },
      progressedMoon: { phase: "New", sign: "Aries", house: 1 },
    },
    electional: [],
    moonPhase: {
      type: "New Moon",
      phase: "New Moon",
      illumination: 0,
      angle: 0,
      nextNewMoon: "",
      nextFullMoon: "",
    },
    transits: [],
    birthData: {
      birthDate: birthDate,
      birthTime: birthTime,
      coordinates: {
        lat: latitude,
        lon: longitude,
      },
    },
  };
}

// Wrapper function to match API expectations
export function calculateAll(params: {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  latitude: number;
  longitude: number;
  houseSystem?: string;
  zodiac?: string;
  orb?: number;
}): BirthChartData {
  // Format parameters to match calculateBirthChart signature
  const birthDate = `${params.year}-${String(params.month).padStart(2, '0')}-${String(params.day).padStart(2, '0')}`;
  const birthTime = `${String(params.hours).padStart(2, '0')}:${String(params.minutes).padStart(2, '0')}`;
  
  return calculateBirthChart(birthDate, birthTime, params.latitude, params.longitude);
}
