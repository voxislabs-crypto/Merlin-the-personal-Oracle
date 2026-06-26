// Progressed Chart Engine - Secondary Progressions (1 day = 1 year)
import { BirthChartData, PlanetPosition } from "@/types/astrology";

export interface ProgressedChart {
  progressedDate: Date;
  yearsProgressed: number;
  positions: PlanetPosition[];
  significantChanges: ProgressionEvent[];
  narrative: string;
}

export interface ProgressionEvent {
  planet: string;
  eventType: "sign change" | "house change" | "aspect formation";
  fromSign?: string;
  toSign?: string;
  fromHouse?: number;
  toHouse?: number;
  description: string;
  impact: "high" | "medium" | "low";
}

// Convert calendar date to Julian Day
function dateToJulianDay(date: Date): number {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
  const y = date.getFullYear() + 4800 - a;
  const m = date.getMonth() + 1 + 12 * a - 3;

  let jd =
    date.getDate() +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Add time component
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const fractionalDay =
    (hours - 12) / 24 + minutes / 1440 + seconds / 86400;

  jd += fractionalDay;

  return jd;
}

// Simplified planetary position calculation (uses mean motion approximation)
function calculateProgressedPosition(
  natalPosition: PlanetPosition,
  daysProgressed: number,
  planet: string
): PlanetPosition {
  // Mean daily motion in degrees (approximate)
  const meanMotion: Record<string, number> = {
    Sun: 0.9856, // ~1°/day
    Moon: 13.176, // ~13°/day
    Mercury: 1.383, // Variable, using average
    Venus: 1.602, // Variable
    Mars: 0.524,
    Jupiter: 0.083,
    Saturn: 0.033,
    Uranus: 0.012,
    Neptune: 0.006,
    Pluto: 0.004,
  };

  const dailyMotion = meanMotion[planet] || 0;
  const progressedDistance = dailyMotion * daysProgressed;

  const newLongitude = (natalPosition.longitude + progressedDistance) % 360;

  // Determine new sign
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

  const signIndex = Math.floor(newLongitude / 30);
  const newSign = signs[signIndex];
  const newDegree = Math.floor(newLongitude % 30);
  const newMinute = Math.floor((newLongitude % 1) * 60);

  return {
    ...natalPosition,
    longitude: newLongitude,
    sign: newSign,
    degree: newDegree,
    minute: newMinute,
  };
}

// Detect significant progression events
function detectProgressionEvents(
  natalPlanets: PlanetPosition[],
  progressedPlanets: PlanetPosition[]
): ProgressionEvent[] {
  const events: ProgressionEvent[] = [];

  for (let i = 0; i < natalPlanets.length; i++) {
    const natal = natalPlanets[i];
    const progressed = progressedPlanets[i];

    // Sign change (major event)
    if (natal.sign !== progressed.sign) {
      events.push({
        planet: natal.name,
        eventType: "sign change",
        fromSign: natal.sign,
        toSign: progressed.sign,
        description: `${natal.name} has progressed from ${natal.sign} to ${progressed.sign}`,
        impact: natal.name === "Moon" ? "high" : natal.name === "Sun" ? "high" : "medium",
      });
    }

    // House change
    if (natal.house && progressed.house && natal.house !== progressed.house) {
      events.push({
        planet: natal.name,
        eventType: "house change",
        fromHouse: natal.house,
        toHouse: progressed.house,
        description: `${natal.name} has moved from house ${natal.house} to house ${progressed.house}`,
        impact: "medium",
      });
    }
  }

  return events;
}

// Generate narrative for progressed chart
function generateProgressionNarrative(
  events: ProgressionEvent[],
  yearsProgressed: number
): string {
  if (events.length === 0) {
    return `After ${yearsProgressed} years, your chart evolves subtly. No major sign changes yet, but the slow movement of planets shapes your growth beneath the surface.`;
  }

  const highImpactEvents = events.filter((e) => e.impact === "high");

  if (highImpactEvents.length > 0) {
    const narratives: string[] = [];

    highImpactEvents.forEach((event) => {
      if (event.planet === "Moon" && event.toSign) {
        narratives.push(
          `In ${yearsProgressed} years, your progressed Moon enters ${event.toSign}. Your emotional landscape shifts — ${getSignShift(event.toSign)}.`
        );
      } else if (event.planet === "Sun" && event.toSign) {
        narratives.push(
          `In ${yearsProgressed} years, your progressed Sun enters ${event.toSign}. Your core identity evolves — ${getSignShift(event.toSign)}.`
        );
      }
    });

    return narratives.join(" ");
  }

  return `In ${yearsProgressed} years, ${events[0].planet} progresses into ${events[0].toSign || "a new area"}. ${events[0].description}.`;
}

// Get narrative for sign shift
function getSignShift(sign: string): string {
  const shifts: Record<string, string> = {
    Aries: "initiative and courage become your new emotional home",
    Taurus: "stability and sensuality ground your evolving self",
    Gemini: "curiosity and communication color your inner world",
    Cancer: "nurturing and intuition flood your emotional body",
    Leo: "creativity and confidence illuminate your path",
    Virgo: "precision and service refine your daily rhythms",
    Libra: "harmony and connection shape your relational world",
    Scorpio: "depth and transformation become non-negotiable",
    Sagittarius: "freedom and philosophy expand your horizons",
    Capricorn: "discipline and ambition anchor your purpose",
    Aquarius: "innovation and collective vision energize you",
    Pisces: "your intuition floods, and boundaries dissolve into empathy",
  };

  return shifts[sign] || "a new chapter begins";
}

// Main function: Calculate progressed chart
export function calculateProgressedChart(
  chartData: BirthChartData,
  targetDate: Date
): ProgressedChart {
  const birthDate = new Date(chartData.birthData.birthDate);
  const birthJD = dateToJulianDay(birthDate);
  const targetJD = dateToJulianDay(targetDate);

  // Secondary progressions: 1 day after birth = 1 year of life
  const yearsProgressed = (targetJD - birthJD) / 365.25;
  const daysProgressed = yearsProgressed; // 1 year = 1 day in secondary progression

  // Calculate progressed positions
  const progressedPlanets = chartData.positions.map((planet) =>
    calculateProgressedPosition(planet, daysProgressed, planet.name)
  );

  // Detect events
  const events = detectProgressionEvents(chartData.positions, progressedPlanets);

  // Generate narrative
  const narrative = generateProgressionNarrative(
    events,
    Math.round(yearsProgressed)
  );

  return {
    progressedDate: targetDate,
    yearsProgressed: Math.round(yearsProgressed * 10) / 10, // Round to 1 decimal
    positions: progressedPlanets,
    significantChanges: events,
    narrative,
  };
}

// Helper: Get progression for N years in future
export function getProgressionInYears(
  chartData: BirthChartData,
  yearsInFuture: number
): ProgressedChart {
  const birthDate = new Date(chartData.birthData.birthDate);
  const targetDate = new Date(birthDate);
  targetDate.setFullYear(birthDate.getFullYear() + yearsInFuture);

  return calculateProgressedChart(chartData, targetDate);
}

// Helper: Check if Moon will change sign soon
export function checkUpcomingMoonChange(
  chartData: BirthChartData,
  yearsToCheck: number = 5
): { willChange: boolean; year?: number; toSign?: string } {
  for (let year = 1; year <= yearsToCheck; year++) {
    const progressed = getProgressionInYears(chartData, year);
    const moonChange = progressed.significantChanges.find(
      (e) => e.planet === "Moon" && e.eventType === "sign change"
    );

    if (moonChange) {
      return {
        willChange: true,
        year,
        toSign: moonChange.toSign,
      };
    }
  }

  return { willChange: false };
}
