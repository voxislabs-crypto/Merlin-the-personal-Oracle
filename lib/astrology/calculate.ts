// Astronomical calculation functions
// Note: Custom implementation to avoid external dependencies
// that were causing import errors with the 'astronomia' package
const toRad = (deg: number) => deg * (Math.PI / 180);
const toDeg = (rad: number) => (rad * 180) / Math.PI;
const sin = (deg: number) => Math.sin(toRad(deg));
const cos = (deg: number) => Math.cos(toRad(deg));
const tan = (deg: number) => Math.tan(toRad(deg));
const asin = (x: number) => toDeg(Math.asin(x));
const acos = (x: number) => toDeg(Math.acos(x));
const atan2 = (y: number, x: number) => toDeg(Math.atan2(y, x));

// Ecliptic obliquity (axial tilt) in degrees
const eclipticObliquity = (jde: number) => {
  const T = (jde - 2451545.0) / 36525.0;
  const U = T / 100.0;
  return (
    23.4392911 -
    1.3002583 * U -
    0.0004305 * U * U +
    0.5553477 * U * U * U -
    0.0142729 * U * U * U * U
  );
};

// Convert ecliptic to equatorial coordinates
const eclipticToEquatorial = (
  lambda: number,
  beta: number,
  epsilon: number
) => {
  const sinEps = sin(epsilon);
  const cosEps = cos(epsilon);
  const sinBeta = sin(beta);
  const cosBeta = cos(beta);
  const sinLambda = sin(lambda);
  const cosLambda = cos(lambda);

  const ra = atan2(sinLambda * cosEps - tan(beta) * sinEps, cosLambda);

  const dec = asin(sinBeta * cosEps + cosBeta * sinEps * sinLambda);

  return { ra: (ra + 360) % 360, dec };
};

// Mean anomaly calculation
const meanAnomaly = (T: number, a: number, b: number, c: number) => {
  return a + b * T + c * T * T;
};

// Solve Kepler's equation for eccentric anomaly
const solveKepler = (M: number, e: number, precision = 1e-6) => {
  let E = M;
  let delta = 1;

  while (Math.abs(delta) > precision) {
    delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= delta;
  }

  return E;
};

export interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  distance: number;
  sign: string;
  degree: number;
  minute: number;
  house: number;
}

export interface House {
  number: number;
  position: number;
  sign: string;
  degree: number;
  minute: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  aspect: string;
  orb: number;
}

/**
 * Creates a Placidus house system calculation
 * @param jde Julian Ephemeris Day
 * @param lat Latitude in degrees
 * @param lon Longitude in degrees
 * @returns HouseSystem object with house cusps and calculation methods
 */
export const createPlacidusHouses = (
  jde: number,
  lat: number,
  lon: number
): HouseSystem => {
  // This is a simplified version - a full Placidus calculation would be more complex
  const T = (jde - 2451545.0) / 36525.0;
  const epsilon = eclipticObliquity(jde);

  // Sidereal time at Greenwich (simplified)
  const GMST =
    280.46061837 +
    360.98564736629 * (jde - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  const LST = (GMST + lon) % 360;

  // Calculate MC (Midheaven)
  const MC = atan2(Math.tan(toRad(LST)) * cos(epsilon), 1);

  // Calculate Ascendant
  const ASC = atan2(
    -cos(toRad(LST)),
    sin(epsilon) * Math.tan(toRad(lat)) + cos(epsilon) * sin(toRad(LST))
  );

  // Simplified cusps (equal houses for now, but offset by ASC)
  const cusps = Array.from({ length: 12 }, (_, i) => (ASC + i * 30) % 360);

  return {
    cusps,
    ascendant: ASC,
    mc: MC,
    vertex: (ASC + 90) % 360, // Simplified vertex calculation
    getHouse: (longitude: number) => {
      const normalized = (longitude - ASC + 360) % 360;
      return Math.floor(normalized / 30) + 1;
    },
    house: (houseNumber: number) => {
      return cusps[houseNumber - 1] || 0;
    },
  };
};

const SIGNS = [
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

const PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "True Node",
];

const ASPECTS = [
  { name: "Conjunction", degrees: 0, orb: 8 },
  { name: "Sextile", degrees: 60, orb: 5 },
  { name: "Square", degrees: 90, orb: 6 },
  { name: "Trine", degrees: 120, orb: 6 },
  { name: "Opposition", degrees: 180, orb: 6 },
];

// House system types
export type HouseSystem = {
  cusps: number[];
  ascendant: number;
  mc: number;
  vertex: number;
  getHouse: (longitude: number) => number;
  house: (houseNumber: number) => number;
};

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
}) {
  console.log(
    "Starting calculateAll with params:",
    JSON.stringify(params, null, 2)
  );

  if (!params.year || !params.month || !params.day) {
    throw new Error("Invalid date parameters");
  }

  if (isNaN(params.latitude) || isNaN(params.longitude)) {
    throw new Error("Invalid coordinates");
  }
  const {
    year,
    month,
    day,
    hours,
    minutes,
    latitude,
    longitude,
    houseSystem = "Placidus",
    zodiac = "Tropical",
    orb = 6,
  } = params;

  // Calculate Julian Day
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jd =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Add time of day and convert to Julian Ephemeris Day
  const jde = jd + (hours + minutes / 60) / 24 - 0.5;

  // Create Placidus house system
  const h = createPlacidusHouses(jde, latitude, longitude);

  // Define planetary elements (simplified for demonstration)
  const planets = [
    {
      name: "Sun",
      a: 1.000001018,
      e: 0.01670862,
      i: 0,
      L0: 100.46457166,
      L1: 35999.37244981,
      L2: 0.00000568,
      P: 0,
      N: 0,
      w: 102.93768193,
    },
    {
      name: "Moon",
      a: 60.2666,
      e: 0.0549,
      i: 5.1454,
      L0: 218.3164477,
      L1: 481267.88123421,
      L2: -0.0015786,
      P: 0.11140408,
      N: 125.04452,
      w: 318.0634,
    },
    {
      name: "Mercury",
      a: 0.38709893,
      e: 0.20563069,
      i: 7.00487,
      L0: 252.2503235,
      L1: 149472.67411175,
      L2: 0.0003039,
      P: 0.12240408,
      N: 48.33167,
      w: 29.12478,
    },
    {
      name: "Venus",
      a: 0.72333199,
      e: 0.00677323,
      i: 3.39471,
      L0: 181.9790995,
      L1: 58517.81538729,
      L2: 0.00031014,
      P: 0.05925105,
      N: 76.68069,
      w: 54.89101,
    },
    {
      name: "Mars",
      a: 1.52366231,
      e: 0.09341233,
      i: 1.85061,
      L0: -4.55343205,
      L1: 19140.30268499,
      L2: 0.00083778,
      P: 0.03228437,
      N: 49.57854,
      w: 286.50162,
    },
    {
      name: "Jupiter",
      a: 5.20336301,
      e: 0.04839266,
      i: 1.3053,
      L0: 34.39644051,
      L1: 3034.74612775,
      L2: 0.00008501,
      P: 0.01173129,
      N: 100.55615,
      w: 273.87741,
    },
    {
      name: "Saturn",
      a: 9.53707032,
      e: 0.0541506,
      i: 2.48446,
      L0: 49.95424423,
      L1: 1222.49362201,
      L2: -0.00049506,
      P: 0.00148017,
      N: 113.71504,
      w: 339.3919,
    },
    {
      name: "Uranus",
      a: 19.19126393,
      e: 0.04716771,
      i: 0.76986,
      L0: 313.23810451,
      L1: 428.48202785,
      L2: 0.0003046,
      P: 0.00152025,
      N: 74.22988,
      w: 96.99886,
    },
    {
      name: "Neptune",
      a: 30.06896348,
      e: 0.00858587,
      i: 1.76917,
      L0: -55.12002969,
      L1: 218.45945325,
      L2: 0.00031596,
      P: 0.00076812,
      N: 131.72169,
      w: 272.846,
    },
    {
      name: "Pluto",
      a: 39.48168677,
      e: 0.24880766,
      i: 17.14175,
      L0: 238.92903833,
      L1: 145.20780515,
      L2: 0.00031596,
      P: 0.00000569,
      N: 110.30347,
      w: 113.76349,
    },
    {
      name: "True Node",
      a: 0,
      e: 0,
      i: 5.15,
      L0: 125.04452,
      L1: -1934.136261,
      L2: 0.0020756,
      P: 0,
      N: 0,
      w: 0,
    }, // Simplified
  ];

  // Calculate planet positions
  const positions = calculatePlanetPositions(jde, h, planets);

  // Calculate aspects
  const aspects = calculateAspects(positions, orb);

  // Extract ascendant and midheaven from house system
  const ascendantData = {
    longitude: h.ascendant,
    sign: SIGNS[Math.floor(h.ascendant / 30) % 12],
    degree: Math.floor(h.ascendant % 30),
    minute: Math.floor((h.ascendant % 1) * 60),
  };

  const mcData = {
    longitude: h.mc,
    sign: SIGNS[Math.floor(h.mc / 30) % 12],
    degree: Math.floor(h.mc % 30),
    minute: Math.floor((h.mc % 1) * 60),
  };

  return {
    positions,
    houses: calculateHouses(h),
    aspects,
    ascendant: ascendantData,
    mc: mcData,
    metadata: {
      system: "Tropical",
      houseSystem,
      date: new Date(year, month - 1, day, hours, minutes).toISOString(),
      location: { latitude, longitude },
    },
  };
}

function calculatePlanetPositions(
  jde: number,
  h: HouseSystem,
  planets: any[]
): PlanetPosition[] {
  console.log("Calculating planet positions for JDE:", jde);

  return planets.map((planet) => {
    console.log(`Calculating position for ${planet.name}`);
    let lon: number = 0;
    let lat: number = 0;
    let dist: number = planet.a * 149.6; // AU to million km

    try {
      // Skip calculation for Earth (handled by Sun's position)
      if (planet.name === "Earth") {
        return {
          name: "Earth",
          longitude: 0,
          latitude: 0,
          distance: 0,
          sign: "Aries",
          degree: 0,
          minute: 0,
          house: 1,
        };
      }

      // Calculate position based on planet
      switch (planet.name) {
        case "Sun": {
          // Heliocentric coordinates (Earth is at the opposite point)
          lon = (180 + (jde % 360)) % 360;
          break;
        }

        case "Moon": {
          // Moon's position relative to Earth (simplified)
          const T = (jde - 2451545.0) / 36525.0;
          const L = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
          lon = ((L % 360) + 360) % 360;
          lat = 5.145 * sin(lon);
          break;
        }

        default: {
          // Calculate position using Kepler's equation
          const T = (jde - 2451545.0) / 36525.0;

          // Mean longitude
          const L = (planet.L0 + planet.L1 * T + planet.L2 * T * T) % 360;

          // Mean anomaly
          const M = (L - planet.w) % 360;

          // Solve Kepler's equation for eccentric anomaly
          const E = solveKepler(toRad(M), planet.e);

          // True anomaly
          const v = atan2(
            Math.sqrt(1 - planet.e * planet.e) * Math.sin(E),
            Math.cos(E) - planet.e
          );

          // Distance from focus
          const r = planet.a * (1 - planet.e * Math.cos(E));

          // Ecliptic longitude
          lon = (v + planet.w) % 360;

          // Ecliptic latitude (simplified)
          lat = planet.i * sin(lon - planet.N);

          // Distance in AU
          dist = r;

          console.log(
            `${planet.name} position: ${lon.toFixed(
              4
            )}° longitude, ${lat.toFixed(4)}° latitude`
          );
          break;
        }
      }
    } catch (error) {
      console.error(`Error calculating position for ${planet.name}:`, error);
      // Set default values if calculation fails
      lon = 0;
      lat = 0;
      dist = 0;
    }

    // Normalize longitude to 0-360
    lon = ((lon % 360) + 360) % 360;

    // Calculate sign, degree, and minute
    const signIndex = Math.floor(lon / 30) % 12;
    const sign = SIGNS[signIndex];
    const degree = Math.floor(lon % 30);
    const minute = Math.floor((lon % 1) * 60);

    // Determine house using house system
    const house = h.getHouse(lon);

    return {
      name: planet.name,
      longitude: lon,
      latitude: lat,
      distance: dist,
      sign,
      degree,
      minute,
      house,
    };
  });
}

function determineHouse(longitude: number, h: HouseSystem): number {
  // Use the house system's getHouse method
  return h.getHouse(longitude);
}

function calculateHouses(h: HouseSystem): House[] {
  return h.cusps.map((cusp, index) => {
    const houseNum = index + 1;
    const signIndex = Math.floor(cusp / 30);
    const sign = SIGNS[signIndex];
    const degree = Math.floor(cusp % 30);
    const minute = Math.floor((cusp % 1) * 60);

    return {
      number: houseNum,
      position: cusp,
      sign,
      degree,
      minute,
    };
  });
}

function calculateAspects(
  positions: PlanetPosition[],
  maxOrb: number
): Aspect[] {
  const aspects: Aspect[] = [];

  // Compare each pair of planets
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i];
      const p2 = positions[j];

      // Calculate angular distance
      let angle = Math.abs(p1.longitude - p2.longitude);
      angle = angle > 180 ? 360 - angle : angle;

      // Check for aspects
      for (const aspect of ASPECTS) {
        const diff = Math.abs(angle - aspect.degrees);
        if (diff <= aspect.orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            aspect: aspect.name,
            orb: diff,
          });
        }
      }
    }
  }

  return aspects;
}
