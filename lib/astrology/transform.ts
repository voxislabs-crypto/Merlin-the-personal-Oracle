// lib/astrology/transform.ts
import type { ChartData } from "./newWheelTypes";

export function transformChartData(raw: any): ChartData {
  if (!raw)
    return { planets: [], aspects: [], houses: [], ascendant: 0, midheaven: 0 };

  console.log("Raw data keys:", Object.keys(raw));
  console.log("Raw planets:", raw.planets);
  console.log("Raw positions:", raw.positions);

  // Transform planets - the API returns 'positions' not 'planets'
  const rawPlanets = raw.positions || [];
  console.log("Using rawPlanets:", rawPlanets);
  const planets = rawPlanets.map((p: any) => ({
    name: p.name,
    glyph: getPlanetGlyph(p.name),
    angle: p.longitude || 0,
    sign: p.sign || "Aries",
    degree: p.degree || 0,
    element: getElementForSign(p.sign),
    color: getPlanetColor(p.name),
    orbitalDistance: getOrbitalDistance(p.name),
  }));

  // Transform aspects - API returns planet1/planet2 and aspect name
  const aspects = (raw.aspects || []).map((a: any) => ({
    from: a.planet1,
    to: a.planet2,
    type: (a.aspect || "conjunction").toLowerCase(),
    angle: 0, // Can be calculated if needed
    color: getAspectColor(a.aspect),
    label: a.aspect || "Aspect",
  }));

  // Transform houses - API returns houses with position field
  const houses = Array.isArray(raw.houses)
    ? raw.houses.map((h: any) => h.position || 0)
    : Array.from({ length: 12 }, (_, i) => i * 30);

  return {
    planets,
    aspects,
    houses,
    ascendant: raw.ascendant?.longitude || 0,
    midheaven: raw.mc?.longitude || 0,
  };
}

// Helper functions
function getPlanetGlyph(name: string): string {
  const glyphs: Record<string, string> = {
    sun: "☉",
    moon: "☽",
    mercury: "☿",
    venus: "♀",
    mars: "♂",
    jupiter: "♃",
    saturn: "♄",
    uranus: "♅",
    neptune: "♆",
    pluto: "♇",
    chiron: "⚷",
    northnode: "☊",
    southnode: "☋",
  };
  return glyphs[name.toLowerCase()] || "•";
}

function getPlanetColor(name: string): string {
  const colors: Record<string, string> = {
    sun: "hsl(45, 100%, 60%)",
    moon: "hsl(200, 70%, 70%)",
    mercury: "hsl(280, 70%, 65%)",
    venus: "hsl(320, 80%, 65%)",
    mars: "hsl(0, 80%, 60%)",
    jupiter: "hsl(30, 80%, 60%)",
    saturn: "hsl(210, 50%, 50%)",
    uranus: "hsl(185, 70%, 65%)",
    neptune: "hsl(220, 70%, 65%)",
    pluto: "hsl(280, 60%, 50%)",
  };
  return colors[name.toLowerCase()] || "hsl(0, 0%, 80%)";
}

function getElementForSign(sign: string): "Fire" | "Earth" | "Air" | "Water" {
  const elements: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
    aries: "Fire",
    taurus: "Earth",
    gemini: "Air",
    cancer: "Water",
    leo: "Fire",
    virgo: "Earth",
    libra: "Air",
    scorpio: "Water",
    sagittarius: "Fire",
    capricorn: "Earth",
    aquarius: "Air",
    pisces: "Water",
  };
  return elements[sign?.toLowerCase()] || "Fire";
}

function getOrbitalDistance(planetName: string): number {
  const distances: Record<string, number> = {
    sun: 0.7,
    moon: 0.5,
    mercury: 0.6,
    venus: 0.65,
    mars: 0.75,
    jupiter: 0.85,
    saturn: 0.9,
    uranus: 0.95,
    neptune: 0.98,
    pluto: 1.0,
  };
  return distances[planetName.toLowerCase()] || 0.5;
}

function getAspectColor(aspectType: string): string {
  const colors: Record<string, string> = {
    conjunction: "hsl(45, 88%, 68%)",
    opposition: "hsl(320, 80%, 65%)",
    trine: "hsl(185, 70%, 65%)",
    square: "hsl(0, 62%, 50%)",
    sextile: "hsl(45, 88%, 68%)",
  };
  return colors[aspectType?.toLowerCase()] || "hsl(45, 88%, 68%)";
}
