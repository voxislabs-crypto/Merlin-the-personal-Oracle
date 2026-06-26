import { BirthChartData } from "@/types/astrology";

export interface DeepDiveTemplates {
  planetHouse: Record<string, string>;
  intercepted: Record<string, string>;
  rulerAspects: Record<string, string>;
}

export interface DeepDiveCusp {
  house: number;
  longitude: number;
  sign: string;
  degree: number;
  minute: number;
  formatted: string;
}

export interface DeepDivePlanetEntry {
  planet: string;
  sign: string;
  degree: number;
  minute: number;
  longitude: number;
  house: number;
  description: string;
}

export interface DeepDiveInterception {
  sign: string;
  house: number;
  description: string;
}

export interface DeepDiveRulerAspect {
  house: number;
  houseSign: string;
  ruler: string;
  aspectType: string;
  withPlanet: string;
  orb: number;
  description: string;
}

export interface DeepDiveResult {
  generatedAt: string;
  cusps: DeepDiveCusp[];
  planetsInHouses: DeepDivePlanetEntry[];
  interceptions: DeepDiveInterception[];
  rulerAspects: DeepDiveRulerAspect[];
}

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
] as const;

const SIGN_TO_RULER: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Pluto",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Uranus",
  Pisces: "Neptune",
};

interface NormalizedAspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
}

const normalizeAngle = (deg: number): number => ((deg % 360) + 360) % 360;

const zodiacFromLongitude = (longitude: number) => {
  const normalized = normalizeAngle(longitude);
  const signIndex = Math.floor(normalized / 30);
  const degreeInSign = normalized % 30;
  const degree = Math.floor(degreeInSign);
  const minute = Math.floor((degreeInSign - degree) * 60);

  return {
    sign: SIGNS[signIndex],
    degree,
    minute,
  };
};

const ordinal = (house: number): string => {
  if (house % 10 === 1 && house !== 11) return `${house}st`;
  if (house % 10 === 2 && house !== 12) return `${house}nd`;
  if (house % 10 === 3 && house !== 13) return `${house}rd`;
  return `${house}th`;
};

const inArc = (longitude: number, start: number, end: number): boolean => {
  const lon = normalizeAngle(longitude);
  let s = normalizeAngle(start);
  let e = normalizeAngle(end);
  let l = lon;

  if (e <= s) e += 360;
  if (l < s) l += 360;

  return l >= s && l < e;
};

const getCusps = (chart: BirthChartData): DeepDiveCusp[] => {
  const fromHouseSystem = chart.houseSystem?.cusps?.slice(0, 12) ?? [];
  const fromHouses = (chart.houses ?? [])
    .slice()
    .sort((a, b) => (a.house || 0) - (b.house || 0))
    .map((h) => Number(h.longitude ?? h.position ?? 0));

  const cuspLongitudes = (fromHouseSystem.length === 12 ? fromHouseSystem : fromHouses)
    .slice(0, 12)
    .map((lon) => normalizeAngle(Number(lon)));

  return cuspLongitudes.map((longitude, index) => {
    const { sign, degree, minute } = zodiacFromLongitude(longitude);
    return {
      house: index + 1,
      longitude,
      sign,
      degree,
      minute,
      formatted: `${index + 1}${ordinal(index + 1).slice(-2)}: ${sign} ${degree}\u00B0${minute
        .toString()
        .padStart(2, "0")}'`,
    };
  });
};

const houseForLongitude = (longitude: number, cusps: DeepDiveCusp[]): number => {
  if (cusps.length !== 12) return 1;

  for (let i = 0; i < 12; i += 1) {
    const current = cusps[i].longitude;
    const next = cusps[(i + 1) % 12].longitude;
    if (inArc(longitude, current, next)) {
      return i + 1;
    }
  }

  return 1;
};

const normalizeAspects = (chart: BirthChartData): NormalizedAspect[] => {
  return (chart.aspects ?? []).map((aspect) => {
    const planet1 = typeof aspect.planet1 === "string" ? aspect.planet1 : aspect.planet1?.name;
    const planet2 = typeof aspect.planet2 === "string" ? aspect.planet2 : aspect.planet2?.name;

    return {
      planet1: planet1 || "",
      planet2: planet2 || "",
      type: aspect.type || "Aspect",
      orb: Number(aspect.orb ?? 0),
    };
  });
};

const genericPlanetHouseDescription = (planet: string, sign: string, house: number): string => {
  return `${planet} in ${sign} in the ${ordinal(house)} house meets lived experience head-on in this life area. Your expression is strongest when you act with intention instead of reaction. Watch for overcompensation; precision turns this placement into mastery.`;
};

const genericInterceptionDescription = (sign: string, house: number): string => {
  return `${sign} intercepted in the ${ordinal(house)} house can feel present but not immediately accessible. Its gifts mature through conscious practice instead of instant expression. Watch for delay patterns that hide your real leverage.`;
};

const genericRulerAspectDescription = (
  ruler: string,
  house: number,
  aspectType: string,
  withPlanet: string
): string => {
  return `${ruler} ruling the ${ordinal(house)} house in ${aspectType.toLowerCase()} with ${withPlanet} ties this area of life to a repeating pressure pattern. Events in this house often mirror your timing, tone, and emotional pacing. Watch for reflex behavior and direct the aspect into strategy.`;
};

const detectInterceptions = (cusps: DeepDiveCusp[], templates: DeepDiveTemplates): DeepDiveInterception[] => {
  if (cusps.length !== 12) return [];

  const cuspSigns = new Set(cusps.map((cusp) => cusp.sign));
  const results: DeepDiveInterception[] = [];

  SIGNS.forEach((sign, signIndex) => {
    if (cuspSigns.has(sign)) return;

    const signStart = signIndex * 30 + 0.001;
    const signEnd = (signIndex + 1) * 30 - 0.001;

    for (let i = 0; i < cusps.length; i += 1) {
      const current = cusps[i];
      const next = cusps[(i + 1) % 12];
      if (inArc(signStart, current.longitude, next.longitude) && inArc(signEnd, current.longitude, next.longitude)) {
        const key = `${sign}_${current.house}`;
        const description = templates.intercepted[key] || genericInterceptionDescription(sign, current.house);
        results.push({
          sign,
          house: current.house,
          description,
        });
        break;
      }
    }
  });

  return results;
};

const buildPlanetEntries = (
  chart: BirthChartData,
  cusps: DeepDiveCusp[],
  templates: DeepDiveTemplates
): DeepDivePlanetEntry[] => {
  const planets = chart.planets ?? chart.positions ?? [];

  return planets.map((planet) => {
    const longitude = normalizeAngle(Number(planet.longitude ?? 0));
    const sign = planet.sign || zodiacFromLongitude(longitude).sign;
    const degree = Number(planet.degree ?? zodiacFromLongitude(longitude).degree);
    const minute = Number(planet.minute ?? zodiacFromLongitude(longitude).minute);
    const house = Number(planet.house ?? houseForLongitude(longitude, cusps));

    const key = `${planet.name}_${house}_${sign}`;
    const description = templates.planetHouse[key] || genericPlanetHouseDescription(planet.name, sign, house);

    return {
      planet: planet.name,
      sign,
      degree,
      minute,
      longitude,
      house,
      description,
    };
  });
};

const buildRulerAspects = (
  cusps: DeepDiveCusp[],
  aspects: NormalizedAspect[],
  templates: DeepDiveTemplates
): DeepDiveRulerAspect[] => {
  const rows: DeepDiveRulerAspect[] = [];
  const seen = new Set<string>();

  cusps.forEach((cusp) => {
    const ruler = SIGN_TO_RULER[cusp.sign] || "";
    if (!ruler) return;

    aspects.forEach((aspect) => {
      const isRulerLeft = aspect.planet1 === ruler;
      const isRulerRight = aspect.planet2 === ruler;
      if (!isRulerLeft && !isRulerRight) return;

      const withPlanet = isRulerLeft ? aspect.planet2 : aspect.planet1;
      const aspectWord = aspect.type.toLowerCase().replace(/\s+/g, "_");
      const key = `${ruler}_rules_${ordinal(cusp.house)}_${aspectWord}_${withPlanet}`;

      if (seen.has(key)) return;
      seen.add(key);

      rows.push({
        house: cusp.house,
        houseSign: cusp.sign,
        ruler,
        aspectType: aspect.type,
        withPlanet,
        orb: Number(aspect.orb || 0),
        description:
          templates.rulerAspects[key] ||
          genericRulerAspectDescription(ruler, cusp.house, aspect.type, withPlanet),
      });
    });
  });

  return rows;
};

export const calculateDeepDive = (
  chart: BirthChartData,
  templates: DeepDiveTemplates
): DeepDiveResult => {
  const cusps = getCusps(chart);
  const aspects = normalizeAspects(chart);

  return {
    generatedAt: new Date().toISOString(),
    cusps,
    planetsInHouses: buildPlanetEntries(chart, cusps, templates),
    interceptions: detectInterceptions(cusps, templates),
    rulerAspects: buildRulerAspects(cusps, aspects, templates),
  };
};
