import { calculateBirthChart as calculateFallbackBirthChart } from "@/lib/engine-fallback";
import { InterpretationEngine } from "@/lib/astrology/interpretations";
import { calculateBirthChartClient } from "@/lib/astrology/client-calculate";
import type { BirthData } from "@/components/astrology/BirthChartCalculator";
import type { BirthChartData, PlanetPosition } from "@/types/astrology";

export interface ClientTransitItem {
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  exact: boolean;
}

export interface ClientTransitData {
  all: ClientTransitItem[];
  significant: ClientTransitItem[];
  approaching: ClientTransitItem[];
  summary: {
    total: number;
    exact: number;
    approaching: number;
  };
}

export interface ClientDailyForecast {
  date: string;
  summary: string;
  planetaryHighlights: string[];
  moonPhase: string;
  moonSign?: string;
  sunSign?: string;
  transits: string[];
  advice: string;
  day_rating?: "Very Positive" | "Positive" | "Neutral" | "Challenging" | "Very Challenging";
}

export interface ClientInterpretationData {
  chartSummary: string;
  planetInterpretations: Array<{
    planet: string;
    interpretation: string;
  }>;
  aspectInterpretations: Array<{
    planets: string;
    interpretation: string;
  }>;
  metadata: {
    generatedAt: string;
    birthDate: string;
    birthTime: string;
  };
  interpreter?: "grok" | "traditional";
}

const MAJOR_ASPECTS = [
  { type: "Conjunction", angle: 0, orb: 10 },
  { type: "Sextile", angle: 60, orb: 6 },
  { type: "Square", angle: 90, orb: 8 },
  { type: "Trine", angle: 120, orb: 8 },
  { type: "Opposition", angle: 180, orb: 10 },
];

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toHHMM(d: Date): string {
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function findPlanet(planets: PlanetPosition[], name: string): PlanetPosition | undefined {
  return planets.find((p) => p.name === name);
}

function calcMoonPhaseName(sunLongitude: number, moonLongitude: number): string {
  const phaseAngle = (moonLongitude - sunLongitude + 360) % 360;
  if (phaseAngle < 22.5 || phaseAngle >= 337.5) return "New Moon";
  if (phaseAngle < 67.5) return "Waxing Crescent";
  if (phaseAngle < 112.5) return "First Quarter";
  if (phaseAngle < 157.5) return "Waxing Gibbous";
  if (phaseAngle < 202.5) return "Full Moon";
  if (phaseAngle < 247.5) return "Waning Gibbous";
  if (phaseAngle < 292.5) return "Last Quarter";
  return "Waning Crescent";
}

function computeTransitItems(
  natalPlanets: PlanetPosition[],
  transitPlanets: PlanetPosition[]
): ClientTransitItem[] {
  const aspects: ClientTransitItem[] = [];

  for (const trans of transitPlanets) {
    for (const natal of natalPlanets) {
      const diff = angleDiff(trans.longitude, natal.longitude);
      for (const asp of MAJOR_ASPECTS) {
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb) {
          aspects.push({
            transitingPlanet: trans.name,
            natalPlanet: natal.name,
            aspect: asp.type,
            orb: Math.round(orb * 10) / 10,
            exact: orb < 1,
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

function computeDayRating(transits: ClientTransitItem[]): ClientDailyForecast["day_rating"] {
  if (transits.length === 0) return "Neutral";

  let score = 0;
  for (const t of transits) {
    if (t.aspect === "Trine" || t.aspect === "Sextile") score += 1;
    if (t.aspect === "Square" || t.aspect === "Opposition") score -= 1;
    if (t.aspect === "Conjunction") score += 0.25;
    if (t.exact) score += 0.25;
  }

  const norm = score / transits.length;
  if (norm >= 0.75) return "Very Positive";
  if (norm >= 0.2) return "Positive";
  if (norm > -0.2) return "Neutral";
  if (norm > -0.75) return "Challenging";
  return "Very Challenging";
}

function getAdvice(rating: ClientDailyForecast["day_rating"]): string {
  if (rating === "Very Positive") return "Take bold action today; momentum is with you.";
  if (rating === "Positive") return "Prioritize important moves and meaningful conversations.";
  if (rating === "Neutral") return "Keep a steady pace and focus on consistency.";
  if (rating === "Challenging") return "Slow down, simplify decisions, and avoid reactive choices.";
  return "Protect your energy, rest more, and respond rather than react.";
}

async function getNatalAndTransitCharts(birthData: BirthData): Promise<{
  natalChart: BirthChartData;
  transitChart: BirthChartData;
}> {
  const natalChart = await calculateBirthChartClient({
    birthDate: birthData.date,
    birthTime: birthData.time,
    latitude: birthData.latitude,
    longitude: birthData.longitude,
    houseSystem: birthData.houseSystem,
    zodiac: birthData.zodiac,
  });

  const now = new Date();
  const transitChart = calculateFallbackBirthChart(
    toIsoDate(now),
    toHHMM(now),
    birthData.latitude,
    birthData.longitude
  );

  return { natalChart, transitChart };
}

export async function calculateTransitsClient(birthData: BirthData): Promise<ClientTransitData> {
  const { natalChart, transitChart } = await getNatalAndTransitCharts(birthData);
  const all = computeTransitItems(natalChart.positions || [], transitChart.positions || []);
  const significant = all.filter((t) => t.exact || t.orb < 1.5);
  const approaching = all.filter((t) => !t.exact && t.orb >= 1.5 && t.orb < 3);

  return {
    all,
    significant,
    approaching,
    summary: {
      total: all.length,
      exact: significant.length,
      approaching: approaching.length,
    },
  };
}

export async function calculateForecastClient(
  birthData: BirthData
): Promise<ClientDailyForecast> {
  const { natalChart, transitChart } = await getNatalAndTransitCharts(birthData);
  const transits = computeTransitItems(natalChart.positions || [], transitChart.positions || []);
  const top = transits.slice(0, 5);

  const sun = findPlanet(transitChart.positions || [], "Sun");
  const moon = findPlanet(transitChart.positions || [], "Moon");
  const natalSun = findPlanet(natalChart.positions || [], "Sun");

  const moonPhase = sun && moon ? calcMoonPhaseName(sun.longitude, moon.longitude) : "Unknown";
  const day_rating = computeDayRating(transits);

  const transitLines = top.map(
    (t) => `${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet} (${t.orb.toFixed(1)}°)`
  );

  const summary = `${natalSun?.sign || "Your"} energy is active today with ${top.length} close transits. ${
    day_rating === "Very Positive" || day_rating === "Positive"
      ? "The sky supports progress and connection."
      : day_rating === "Neutral"
      ? "The day is balanced and best used with steady focus."
      : "The sky asks for patience and emotional regulation."
  }`;

  return {
    date: new Date().toISOString(),
    summary,
    planetaryHighlights: top.map((t) => `${t.transitingPlanet} ${t.aspect} ${t.natalPlanet}`),
    moonPhase,
    moonSign: moon?.sign,
    sunSign: sun?.sign,
    transits: transitLines,
    advice: getAdvice(day_rating),
    day_rating,
  };
}

export async function generateInterpretationsClient(
  birthData: BirthData,
  mode: "grok" | "traditional" = "traditional"
): Promise<ClientInterpretationData> {
  const natalChart = await calculateBirthChartClient({
    birthDate: birthData.date,
    birthTime: birthData.time,
    latitude: birthData.latitude,
    longitude: birthData.longitude,
    houseSystem: birthData.houseSystem,
    zodiac: birthData.zodiac,
  });

  const engine = new InterpretationEngine();
  const chartSummary = engine.generateChartSummary(natalChart.positions || [], natalChart.aspects || []);

  const personalPlanets = (natalChart.positions || []).filter((p) =>
    ["Sun", "Moon", "Mercury", "Venus", "Mars"].includes(p.name)
  );

  const planetInterpretations = personalPlanets.map((planet) => ({
    planet: planet.name,
    interpretation: engine.generateInterpretation({
      planet: planet.name,
      sign: planet.sign,
      house: planet.house,
      quality: 75,
    }),
  }));

  const topAspects = [...(natalChart.aspects || [])]
    .sort((a, b) => (a.orb || 0) - (b.orb || 0))
    .slice(0, 5);

  const aspectInterpretations = topAspects.map((aspect) => ({
    planets: `${aspect.planet1.name} ${aspect.type} ${aspect.planet2.name}`,
    interpretation: engine.generateAspectInterpretation(aspect),
  }));

  return {
    chartSummary,
    planetInterpretations,
    aspectInterpretations,
    metadata: {
      generatedAt: new Date().toISOString(),
      birthDate: birthData.date,
      birthTime: birthData.time,
    },
    interpreter: mode === "grok" ? "traditional" : mode,
  };
}
