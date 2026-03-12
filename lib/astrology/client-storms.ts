import type { BirthData } from "@/components/astrology/BirthChartCalculator";
import type { MBTIType } from "@/shared/schema";
import { calculateBirthChartClient } from "@/lib/astrology/client-calculate";
import type { PlanetPosition } from "@/types/astrology";

export interface ClientAstroStorm {
  id: string;
  date: string;
  dayName: string;
  title: string;
  intensity: "severe" | "moderate" | "mild";
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  lifeArea: string;
  description: string;
  navigation: string;
  keywords: string[];
}

export interface ClientStormsReport {
  storms: ClientAstroStorm[];
  clearDays: string[];
  weekSummary: string;
  mbtiType?: string;
}

const MAJOR_HARD_ASPECTS = [
  { type: "Square", angle: 90, orb: 3.0 },
  { type: "Opposition", angle: 180, orb: 3.0 },
  { type: "Conjunction", angle: 0, orb: 2.0 },
] as const;

const MALEFICS = new Set(["Saturn", "Mars", "Pluto", "Uranus", "Neptune"]);
const PRIORITY_NATAL = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars"]);

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function stormWeight(transitingPlanet: string, natalPlanet: string, aspect: string): number {
  let score = 1;
  if (MALEFICS.has(transitingPlanet)) score += 2;
  if (PRIORITY_NATAL.has(natalPlanet)) score += 2;
  if (aspect === "Opposition" || aspect === "Square") score += 2;
  return score;
}

function intensityFromScore(score: number): "severe" | "moderate" | "mild" {
  if (score >= 6) return "severe";
  if (score >= 4) return "moderate";
  return "mild";
}

function lifeArea(planet: string): string {
  const table: Record<string, string> = {
    Sun: "Identity & confidence",
    Moon: "Emotions & inner stability",
    Mercury: "Communication & focus",
    Venus: "Love & relationships",
    Mars: "Conflict & assertion",
    Jupiter: "Beliefs & expansion",
    Saturn: "Responsibility & pressure",
  };
  return table[planet] || "General life area";
}

function navigationFor(intensity: "severe" | "moderate" | "mild", mbtiType?: MBTIType): string {
  const mbtiTag = mbtiType ? ` (${mbtiType})` : "";
  if (intensity === "severe") return `Keep your schedule lighter${mbtiTag}, delay irreversible decisions, and prioritize regulation over reaction.`;
  if (intensity === "moderate") return `Move deliberately${mbtiTag}, communicate clearly, and avoid escalating low-value conflicts.`;
  return `Stay aware${mbtiTag} and course-correct early if tension rises.`;
}

function dayName(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function describeStorm(transitingPlanet: string, aspect: string, natalPlanet: string): string {
  return `${transitingPlanet} ${aspect.toLowerCase()} ${natalPlanet} can increase pressure in ${lifeArea(natalPlanet).toLowerCase()}.`;
}

function findStormsForDay(
  date: Date,
  natal: PlanetPosition[],
  transit: PlanetPosition[],
  mbtiType?: MBTIType
): ClientAstroStorm[] {
  const storms: ClientAstroStorm[] = [];

  for (const t of transit) {
    for (const n of natal) {
      const diff = angleDiff(t.longitude, n.longitude);
      for (const asp of MAJOR_HARD_ASPECTS) {
        const orb = Math.abs(diff - asp.angle);
        if (orb > asp.orb) continue;

        const score = stormWeight(t.name, n.name, asp.type);
        const intensity = intensityFromScore(score);
        const iso = toIsoDate(date);

        storms.push({
          id: `${iso}-${t.name}-${asp.type}-${n.name}`,
          date: iso,
          dayName: dayName(date),
          title: `${t.name} ${asp.type} ${n.name}`,
          intensity,
          transitingPlanet: t.name,
          natalPlanet: n.name,
          aspect: asp.type,
          orb: Math.round(orb * 100) / 100,
          lifeArea: lifeArea(n.name),
          description: describeStorm(t.name, asp.type, n.name),
          navigation: navigationFor(intensity, mbtiType),
          keywords: [t.name.toLowerCase(), asp.type.toLowerCase(), n.name.toLowerCase()],
        });
      }
    }
  }

  storms.sort((a, b) => {
    const byIntensity = { severe: 3, moderate: 2, mild: 1 };
    const i = byIntensity[b.intensity] - byIntensity[a.intensity];
    if (i !== 0) return i;
    return a.orb - b.orb;
  });

  return storms.slice(0, 2);
}

export async function calculateStormsClient(
  birthData: BirthData,
  mbtiType?: MBTIType
): Promise<ClientStormsReport> {
  const natal = await calculateBirthChartClient({
    birthDate: birthData.date,
    birthTime: birthData.time,
    latitude: birthData.latitude,
    longitude: birthData.longitude,
    houseSystem: birthData.houseSystem,
    zodiac: birthData.zodiac,
  });

  const allStorms: ClientAstroStorm[] = [];
  const clearDays: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + i);

    const transit = await calculateBirthChartClient({
      birthDate: toIsoDate(date),
      birthTime: "12:00",
      latitude: birthData.latitude,
      longitude: birthData.longitude,
      houseSystem: birthData.houseSystem,
      zodiac: birthData.zodiac,
    });

    const dayStorms = findStormsForDay(date, natal.positions || [], transit.positions || [], mbtiType);
    if (dayStorms.length === 0) {
      clearDays.push(dayName(date));
    } else {
      allStorms.push(...dayStorms);
    }
  }

  const storms = allStorms.slice(0, 8);
  const severe = storms.filter((s) => s.intensity === "severe").length;
  const weekSummary =
    storms.length === 0
      ? "This week looks clear. Keep momentum steady and intentional."
      : severe > 0
      ? `A high-friction week is ahead with ${severe} severe pressure window${severe > 1 ? "s" : ""}. Move slower and protect energy.`
      : `A moderate-pressure week is ahead with ${storms.length} notable transit challenge${storms.length > 1 ? "s" : ""}. Awareness will keep you centered.`;

  return {
    storms,
    clearDays,
    weekSummary,
    mbtiType,
  };
}
