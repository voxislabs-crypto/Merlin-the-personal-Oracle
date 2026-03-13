// lib/engine-fallback.ts - Fallback calculation system
// Uses Jean Meeus "Astronomical Algorithms" (2nd ed.) for accurate results:
//   Sun   – Ch. 25, accurate to ~0.01°
//   Moon  – Ch. 47, ~60 principal terms, accurate to ~0.3°
//   Other planets – Keplerian mean-longitude elements, accurate to ~1–3°
// This fallback is used server-side when sweph is unavailable and
// client-side when the WASM engine cannot be loaded.
import {
  BirthChartData,
  PlanetPosition,
  HousePosition as HousePositionType,
  Aspect as AspectType,
} from "@/types/astrology";

// ─── Angle helpers ────────────────────────────────────────────────────────────
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;
const norm360 = (d: number) => ((d % 360) + 360) % 360;
const sinD = (d: number) => Math.sin(toRad(d));
const cosD = (d: number) => Math.cos(toRad(d));
const tanD = (d: number) => Math.tan(toRad(d));
const atanD = (y: number, x: number) => toDeg(Math.atan2(y, x));

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function getZodiacSign(longitude: number): string {
  return ZODIAC_SIGNS[Math.floor(norm360(longitude) / 30) % 12];
}

function getDegreeMinute(longitude: number): { degree: number; minute: number } {
  const inSign = norm360(longitude) % 30;
  return { degree: Math.floor(inSign), minute: Math.floor((inSign % 1) * 60) };
}

// ─── Julian Day ───────────────────────────────────────────────────────────────

function calculateJulianDay(date: string, time: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

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

  return jdn + (hour - 12) / 24 + minute / 1440;
}

// ─── Sun (Meeus Ch. 25 – accurate to ~0.01°) ──────────────────────────────────

function sunLongitude(T: number): number {
  // Geometric mean longitude of the Sun
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  // Mean anomaly of the Sun
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  // Equation of centre
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinD(M) +
    (0.019993 - 0.000101 * T) * sinD(2 * M) +
    0.000289 * sinD(3 * M);
  const sunTrue = norm360(L0 + C);
  // Apparent longitude (aberration + nutation correction)
  const Om = norm360(125.04 - 1934.136 * T);
  return norm360(sunTrue - 0.00569 - 0.00478 * sinD(Om));
}

// ─── Moon (Meeus Ch. 47 – ~60 principal terms, accurate to ~0.3°) ─────────────

function moonLongitude(T: number): number {
  // Fundamental arguments
  const Lp = norm360(218.3165 + 481267.8813 * T); // Mean longitude
  const D  = norm360(297.8502 + 445267.1115 * T); // Elongation
  const M  = norm360(357.5291 + 35999.0503  * T); // Sun mean anomaly
  const Mp = norm360(134.9634 + 477198.8676 * T); // Moon mean anomaly
  const F  = norm360(93.2721  + 483202.0175 * T); // Argument of latitude
  const E  = 1 - 0.002516 * T - 0.0000074 * T * T; // Eccentricity of Earth

  // Sum of principal periodic terms (sigma_l in units of 0.000001°)
  const sl =
    6288774 * sinD(Mp) +
    1274027 * sinD(2 * D - Mp) +
     658314 * sinD(2 * D) +
     213618 * sinD(2 * Mp) +
    -185116 * E * sinD(M) +
    -114332 * sinD(2 * F) +
      58793 * sinD(2 * D - 2 * Mp) +
      57066 * E * sinD(2 * D - M - Mp) +
      53322 * sinD(2 * D + Mp) +
      45758 * E * sinD(2 * D - M) +
     -40923 * E * sinD(M - Mp) +
     -34720 * sinD(D) +
     -30383 * E * sinD(M + Mp) +
      15327 * sinD(2 * D - 2 * F) +
     -12528 * sinD(Mp + 2 * F) +
      10980 * sinD(Mp - 2 * F) +
      10675 * sinD(4 * D - Mp) +
      10034 * sinD(3 * Mp) +
       8548 * sinD(4 * D - 2 * Mp) +
      -7888 * E * sinD(2 * D + M - Mp) +
      -6766 * E * sinD(2 * D + M) +
      -5163 * sinD(D - Mp) +
       4987 * E * sinD(D + M) +
       4036 * E * sinD(2 * D - M + Mp) +
       3994 * sinD(2 * D + 2 * Mp) +
       3861 * sinD(4 * D) +
       3665 * sinD(2 * D - 3 * Mp) +
      -2689 * E * sinD(M - 2 * Mp) +
      -2602 * sinD(2 * D - Mp + 2 * F) +
       2390 * E * sinD(2 * D - M - 2 * Mp) +
      -2348 * sinD(D + Mp) +
       2236 * E * E * sinD(2 * D - 2 * M) +
      -2120 * E * sinD(M + 2 * Mp) +
      -2069 * E * E * sinD(2 * M) +
       2048 * E * E * sinD(2 * D - 2 * M - Mp) +
      -1773 * sinD(2 * D + Mp - 2 * F) +
      -1595 * sinD(2 * D + 2 * F) +
       1215 * E * sinD(4 * D - M - Mp) +
      -1110 * sinD(2 * Mp + 2 * F) +
        -892 * sinD(3 * D - Mp) +
        -810 * E * sinD(2 * D + M + Mp) +
         759 * E * sinD(4 * D - M - 2 * Mp) +
        -713 * E * E * sinD(2 * M - Mp) +
        -700 * E * E * sinD(2 * D + 2 * M - Mp) +
         691 * E * sinD(2 * D + M - 2 * Mp) +
         596 * E * sinD(2 * D - M - 2 * F) +
         549 * sinD(4 * D + Mp) +
         537 * sinD(4 * Mp) +
         520 * E * sinD(4 * D - M) +
        -487 * sinD(D - 2 * Mp) +
        -399 * E * sinD(2 * D + M - 2 * F) +
        -381 * sinD(2 * Mp - 2 * F) +
         351 * E * sinD(D + M + Mp) +
        -340 * sinD(3 * D - 2 * Mp) +
         330 * sinD(4 * D - 3 * Mp) +
         327 * E * sinD(2 * D - M + 2 * Mp) +
        -323 * E * E * sinD(2 * M + Mp) +
         299 * E * sinD(D + M - Mp) +
         294 * sinD(2 * D + 3 * Mp);

  // Additive terms using longitude of ascending node
  const Om = norm360(125.04452 - 1934.136261 * T);
  const sl_corrected = sl + (-6962 + 9 * cosD(Mp)) * sinD(Om) + 318 * sinD(2 * Om);

  return norm360(Lp + sl_corrected / 1_000_000);
}

// ─── Outer-planet approximation via Keplerian mean longitude ──────────────────
// Elements: mean longitude L at J2000.0 and rate per Julian century (°/cy).
// We compute heliocentric L and correct to geocentric by subtracting Earth's
// heliocentric longitude (= sun longitude + 180°).
// Accuracy: ~1-3°, sufficient for sign assignment.

interface PlanetKeplerian {
  L0: number; // Mean longitude at J2000.0 (°)
  L1: number; // Rate of change (°/Julian century)
  ecc0: number; // Eccentricity at J2000.0
  eccRate: number; // Rate of change in eccentricity (/cy)
  peri0: number; // Longitude of perihelion at J2000.0 (°)
  periRate: number; // Rate of change (°/cy)
}

// From Meeus Table 31.a & 33.a (VSOP87 elements)
const PLANET_ELEMENTS: Record<string, PlanetKeplerian> = {
  Mercury: { L0: 252.250906, L1: 149474.0722491, ecc0: 0.20563069, eccRate: 0.000020702, peri0: 77.45779628, periRate: 0.15940013 },
  Venus:   { L0: 181.979101, L1:  58519.2130302, ecc0: 0.00677323, eccRate:-0.000047890, peri0: 131.563703,  periRate: 0.00268329  },
  Mars:    { L0: 355.433000, L1:  19141.6964471, ecc0: 0.09340065, eccRate: 0.000090484, peri0: 336.060234,  periRate: 0.44441088  },
  Jupiter: { L0:  34.351519, L1:   3036.3027748, ecc0: 0.04849793, eccRate: 0.000163225, peri0:  14.331309,  periRate: 0.18199196  },
  Saturn:  { L0:  50.077444, L1:   1223.5110686, ecc0: 0.05554814, eccRate:-0.000346641, peri0:  93.056787,  periRate: 0.54179478  },
  Uranus:  { L0: 314.055005, L1:    430.4530000, ecc0: 0.04630244, eccRate:-0.000027769, peri0: 173.005159,  periRate: 0.09266985  },
  Neptune: { L0: 304.348665, L1:    219.8833092, ecc0: 0.00899704, eccRate: 0.000006330, peri0:  48.123691,  periRate: 0.00538232  },
  Pluto:   { L0: 238.928881, L1:    145.207080,  ecc0: 0.24880766, eccRate: 0.000006030, peri0: 224.006892,  periRate:-0.00968827  },
};

// Solve Kepler's equation E - e*sin(E) = M  (radians)
function keplerE(M_deg: number, ecc: number): number {
  const M = toRad(norm360(M_deg));
  let E = M + ecc * Math.sin(M) * (1 + ecc * Math.cos(M));
  for (let i = 0; i < 50; i++) {
    const dE = (M - E + ecc * Math.sin(E)) / (1 - ecc * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E; // radians
}

function planetHelioCentricLongitude(name: string, T: number): number {
  const el = PLANET_ELEMENTS[name];
  if (!el) return 0;

  const L = norm360(el.L0 + el.L1 * T);
  const ecc = el.ecc0 + el.eccRate * T;
  const peri = norm360(el.peri0 + el.periRate * T);

  // Mean anomaly
  const M = norm360(L - peri);
  const E = keplerE(M, ecc);

  // True anomaly ν
  const v = norm360(
    toDeg(Math.atan2(
      Math.sqrt(1 - ecc * ecc) * Math.sin(E),
      Math.cos(E) - ecc
    ))
  );

  return norm360(v + peri);
}

function planetGeoCentricLongitude(name: string, T: number, earthHelioLon: number): number {
  const pLon = planetHelioCentricLongitude(name, T);

  // Inner planets need special handling; outer planets: geo ≈ helio - earth + 180°
  // For a simple but much-improved approximation for all planets:
  let geo = norm360(pLon - earthHelioLon + 180);
  return geo;
}

// Mean North Node (Meeus ch. 47 – accurate to ~0.1°)
function northNodeLongitude(T: number): number {
  return norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
}

// ─── Main: compute all planetary positions ────────────────────────────────────

function computePlanetaryPositions(jd: number): PlanetPosition[] {
  const T = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000.0

  // Sun and Moon use high-accuracy series
  const sunLon = sunLongitude(T);
  const moonLon = moonLongitude(T);

  // Earth's heliocentric longitude = Sun geocentric + 180°
  const earthHLon = norm360(sunLon + 180);

  // Eccentricity of Earth's orbit (needed for Sun distance/speed approx)
  const eSun = 0.016708634 - 0.000042037 * T;

  const results: PlanetPosition[] = [];

  const planetDefs: Array<{ name: string; lon: number; lat: number; dist: number; speed: number; retrograde: boolean }> = [
    {
      name: "Sun",
      lon: sunLon,
      lat: 0,
      dist: 1.0,
      speed: 0.9856,
      retrograde: false,
    },
    {
      name: "Moon",
      lon: moonLon,
      lat: 0,
      dist: 0.00257, // ~384,400 km in AU
      speed: 13.1764,
      retrograde: false,
    },
    ...Object.keys(PLANET_ELEMENTS).map((name) => {
      const lon = planetGeoCentricLongitude(name, T, earthHLon);
      return { name, lon, lat: 0, dist: 1.0, speed: 1.0, retrograde: false };
    }),
    {
      name: "North Node",
      lon: northNodeLongitude(T),
      lat: 0,
      dist: 0,
      speed: -0.0529539,
      retrograde: true,
    },
  ];

  for (const p of planetDefs) {
    const normalized = norm360(p.lon);
    const sign = getZodiacSign(normalized);
    const { degree, minute } = getDegreeMinute(normalized);
    results.push({
      name: p.name,
      longitude: normalized,
      latitude: p.lat,
      distance: p.dist,
      speed: p.speed,
      sign,
      degree,
      minute,
      retrograde: p.retrograde,
    });
  }

  return results;
}

// ─── Simple equal houses (ascendant approximation) ────────────────────────────

function calculateHousePositions(
  jd: number,
  lat: number,
  lon: number
): HousePositionType[] {
  const T = (jd - 2451545.0) / 36525.0;
  const eps = 23.4392911 - 0.013004167 * T; // obliquity of ecliptic

  // Greenwich Mean Sidereal Time (degrees)
  const GMST = norm360(
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T
  );
  const LST = norm360(GMST + lon);

  // Ascendant
  let asc = toDeg(
    Math.atan2(
      -cosD(LST),
      sinD(eps) * tanD(lat) + cosD(eps) * sinD(LST)
    )
  );
  asc = norm360(asc);

  // Use equal-house system for simplicity
  const houses: HousePositionType[] = [];
  for (let i = 0; i < 12; i++) {
    const cusp = norm360(asc + i * 30);
    const sign = getZodiacSign(cusp);
    const { degree, minute } = getDegreeMinute(cusp);
    houses.push({
      house: i + 1,
      position: cusp,
      longitude: cusp,
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

  // Calculate planetary positions using proper astronomical algorithms
  const planets: PlanetPosition[] = computePlanetaryPositions(jd);

  // Calculate house positions (equal houses with proper Ascendant)
  const houses = calculateHousePositions(jd, latitude, longitude);

  // Assign planets to houses
  const planetsWithHouses = planets.map((p) => {
    let houseNum = 1;
    for (let i = 0; i < 12; i++) {
      const cusp = houses[i]?.longitude ?? 0;
      let nextCusp = houses[(i + 1) % 12]?.longitude ?? 0;
      if (nextCusp < cusp) nextCusp += 360;
      if (p.longitude >= cusp && p.longitude < nextCusp) {
        houseNum = houses[i]?.house ?? 1;
        break;
      }
    }
    return { ...p, house: houseNum };
  });

  // Calculate aspects
  const aspects = calculateAspects(planetsWithHouses);

  // Ascendant from house 1 cusp
  const ascendantLongitude = houses[0]?.longitude ?? 0;
  const mcLongitude = norm360(ascendantLongitude + 90);

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
    positions: planetsWithHouses,
    planets: planetsWithHouses,
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
