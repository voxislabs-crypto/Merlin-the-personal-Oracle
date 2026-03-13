import type { BirthChartData, HousePosition, PlanetPosition } from "@/types/astrology";
import { calculateBirthChart as calculateFallbackBirthChart } from "@/lib/engine-fallback";

type SweInstance = {
  julianDay: (year: number, month: number, day: number, hour?: number, calendarType?: number) => number;
  calculatePosition: (jd: number, body: number, flags?: number) => {
    longitude: number;
    latitude: number;
    distance: number;
    longitudeSpeed: number;
  };
  calculateHouses: (jd: number, latitude: number, longitude: number, houseSystem: string) => {
    cusps: number[];
    ascendant: number;
    mc: number;
    vertex: number;
  };
};

type SweCore = {
  Planet: Record<string, number>;
  LunarPoint: Record<string, number>;
  HouseSystem: Record<string, string>;
  CommonCalculationFlags: Record<string, number>;
  CalendarType: Record<string, number>;
};

let sweInitPromise: Promise<{ swe: SweInstance; core: SweCore }> | null = null;

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function getZodiacPosition(lon: number) {
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

  return { sign: signs[signIndex], degree, minute };
}

function assignHousesToPlanets(planets: PlanetPosition[], houses: HousePosition[]): PlanetPosition[] {
  return planets.map((planet) => {
    const normalized = normalizeAngle(planet.longitude);
    let houseNum = 1;

    for (let i = 0; i < 12; i++) {
      const current = houses[i]?.longitude ?? houses[i]?.position ?? 0;
      let next = houses[(i + 1) % 12]?.longitude ?? houses[(i + 1) % 12]?.position ?? 0;

      if (next < current) next += 360;

      if (normalized >= current && normalized < next) {
        houseNum = houses[i]?.house ?? 1;
        break;
      }
    }

    return { ...planet, house: houseNum };
  });
}

function calculateAspects(planets: PlanetPosition[]): BirthChartData["aspects"] {
  const aspects: BirthChartData["aspects"] = [];
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
}

function mapHouseSystem(houseSystem: string | undefined, core: SweCore): string {
  switch (houseSystem) {
    case "Koch":
      return core.HouseSystem.Koch;
    case "Equal":
      return core.HouseSystem.Equal;
    case "Whole":
      return core.HouseSystem.WholeSign;
    case "Placidus":
    default:
      return core.HouseSystem.Placidus;
  }
}

async function getWasmEngine() {
  if (!sweInitPromise) {
    sweInitPromise = (async () => {
      const browserPkg = await import("@swisseph/browser");
      const core = (await import("@swisseph/core")) as unknown as SweCore;

      const swe = new browserPkg.SwissEphemeris() as SweInstance & { init: (wasmPath?: string) => Promise<void> };
      // Explicitly point to the WASM binary in the public/ directory.
      // This is critical for the Capacitor standalone app where import.meta.url
      // resolves to a webpack bundle path that doesn't contain the .wasm file.
      await swe.init("/swisseph.wasm");

      return { swe, core };
    })();
  }

  return sweInitPromise;
}

export interface WasmBirthChartRequest {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  houseSystem?: "Placidus" | "Koch" | "Equal" | "Whole";
}

export async function calculateBirthChartWasm(
  request: WasmBirthChartRequest
): Promise<BirthChartData> {
  const base = calculateFallbackBirthChart(
    request.birthDate,
    request.birthTime,
    request.latitude,
    request.longitude
  );

  const [year, month, day] = request.birthDate.split("-").map(Number);
  const [hour, minute] = request.birthTime.split(":").map(Number);

  const { swe, core } = await getWasmEngine();
  const jd = swe.julianDay(
    year,
    month,
    day,
    hour + minute / 60,
    core.CalendarType.Gregorian
  );

  const calcFlags =
    core.CommonCalculationFlags.DefaultSwissEphemeris ??
    core.CommonCalculationFlags.DefaultMoshier;

  const planetDefs: Array<{ id: number; name: string }> = [
    { id: core.Planet.Sun, name: "Sun" },
    { id: core.Planet.Moon, name: "Moon" },
    { id: core.Planet.Mercury, name: "Mercury" },
    { id: core.Planet.Venus, name: "Venus" },
    { id: core.Planet.Mars, name: "Mars" },
    { id: core.Planet.Jupiter, name: "Jupiter" },
    { id: core.Planet.Saturn, name: "Saturn" },
    { id: core.Planet.Uranus, name: "Uranus" },
    { id: core.Planet.Neptune, name: "Neptune" },
    { id: core.Planet.Pluto, name: "Pluto" },
    { id: core.LunarPoint.MeanNode, name: "North Node" },
  ];

  const rawPlanets: PlanetPosition[] = planetDefs.map((planet) => {
    const pos = swe.calculatePosition(jd, planet.id, calcFlags);
    const longitude = normalizeAngle(pos.longitude);
    const zodiac = getZodiacPosition(longitude);

    return {
      name: planet.name,
      longitude,
      latitude: pos.latitude,
      distance: pos.distance,
      speed: pos.longitudeSpeed,
      sign: zodiac.sign,
      degree: zodiac.degree,
      minute: zodiac.minute,
      retrograde: pos.longitudeSpeed < 0,
    };
  });

  const houseSystem = mapHouseSystem(request.houseSystem, core);
  const houseData = swe.calculateHouses(jd, request.latitude, request.longitude, houseSystem);

  const houses: HousePosition[] = Array.from({ length: 12 }, (_, i) => {
    const cusp = houseData.cusps[i + 1] ?? houseData.cusps[i] ?? 0;
    const longitude = normalizeAngle(cusp);
    const zodiac = getZodiacPosition(longitude);

    return {
      house: i + 1,
      position: longitude,
      longitude,
      sign: zodiac.sign,
      degree: zodiac.degree,
      minute: zodiac.minute,
    };
  });

  const planets = assignHousesToPlanets(rawPlanets, houses);
  const aspects = calculateAspects(planets);

  const asc = normalizeAngle(houseData.ascendant);
  const mc = normalizeAngle(houseData.mc);
  const ascendant = { longitude: asc, ...getZodiacPosition(asc) };
  const mcPoint = { longitude: mc, ...getZodiacPosition(mc) };

  return {
    ...base,
    jd,
    positions: planets,
    planets,
    houses,
    aspects,
    ascendant,
    mc: mcPoint,
    houseSystem: {
      cusps: houses.map((house) => house.longitude ?? house.position ?? 0),
      ascendant: asc,
      mc,
      vertex: normalizeAngle(houseData.vertex ?? 0),
    },
  };
}
