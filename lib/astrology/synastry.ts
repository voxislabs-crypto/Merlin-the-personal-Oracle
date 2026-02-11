// Synastry - Relationship chart comparison
import { BirthChartData, PlanetPosition, Aspect } from "@/types/astrology";

export interface SynastryAspect {
  person1Planet: string;
  person2Planet: string;
  aspectType: string;
  orb: number;
  exact: boolean;
  interpretation: string;
  chemistry: "magnetic" | "harmonious" | "challenging" | "neutral";
}

export interface SynastryReport {
  person1Name?: string;
  person2Name?: string;
  overallCompatibility: number; // 0-100
  aspects: SynastryAspect[];
  elementBalance: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  narrative: string;
  strengths: string[];
  challenges: string[];
}

// Calculate angular difference between two longitudes
function calculateOrb(lon1: number, lon2: number, aspectAngle: number): number {
  let diff = Math.abs(lon1 - lon2);
  if (diff > 180) diff = 360 - diff;

  const orbFromAspect = Math.abs(diff - aspectAngle);
  return orbFromAspect;
}

// Detect aspects between two charts
function detectSynastryAspects(
  chart1: BirthChartData,
  chart2: BirthChartData
): SynastryAspect[] {
  const aspects: SynastryAspect[] = [];

  const primaryPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars"];
  const planets1 = chart1.positions.filter((p) =>
    primaryPlanets.includes(p.name)
  );
  const planets2 = chart2.positions.filter((p) =>
    primaryPlanets.includes(p.name)
  );

  const aspectDefinitions: Array<{
    angle: number;
    name: string;
    orb: number;
  }> = [
    { angle: 0, name: "Conjunction", orb: 8 },
    { angle: 60, name: "Sextile", orb: 6 },
    { angle: 90, name: "Square", orb: 6 },
    { angle: 120, name: "Trine", orb: 8 },
    { angle: 180, name: "Opposition", orb: 8 },
  ];

  for (const p1 of planets1) {
    for (const p2 of planets2) {
      for (const aspectDef of aspectDefinitions) {
        const orb = calculateOrb(p1.longitude, p2.longitude, aspectDef.angle);

        if (orb <= aspectDef.orb) {
          const interpretation = getSynastryInterpretation(
            p1.name,
            p2.name,
            aspectDef.name
          );

          const chemistry = getChemistryType(
            p1.name,
            p2.name,
            aspectDef.name
          );

          aspects.push({
            person1Planet: p1.name,
            person2Planet: p2.name,
            aspectType: aspectDef.name,
            orb,
            exact: orb < 1,
            interpretation,
            chemistry,
          });
        }
      }
    }
  }

  return aspects;
}

// Get chemistry type for aspect
function getChemistryType(
  planet1: string,
  planet2: string,
  aspectType: string
): "magnetic" | "harmonious" | "challenging" | "neutral" {
  // Venus-Mars = magnetic
  if (
    (planet1 === "Venus" && planet2 === "Mars") ||
    (planet1 === "Mars" && planet2 === "Venus")
  ) {
    return aspectType === "Conjunction" || aspectType === "Trine"
      ? "magnetic"
      : "challenging";
  }

  // Moon-Moon, Sun-Moon = harmonious or challenging
  if (
    (planet1 === "Moon" && planet2 === "Moon") ||
    (planet1 === "Sun" && planet2 === "Moon") ||
    (planet1 === "Moon" && planet2 === "Sun")
  ) {
    return aspectType === "Trine" || aspectType === "Sextile"
      ? "harmonious"
      : aspectType === "Square" || aspectType === "Opposition"
      ? "challenging"
      : "neutral";
  }

  // Sun-Sun
  if (planet1 === "Sun" && planet2 === "Sun") {
    return aspectType === "Trine" ? "harmonious" : "challenging";
  }

  // Default
  return aspectType === "Trine" || aspectType === "Sextile"
    ? "harmonious"
    : aspectType === "Square" || aspectType === "Opposition"
    ? "challenging"
    : "neutral";
}

// Get interpretation for synastry aspect
function getSynastryInterpretation(
  planet1: string,
  planet2: string,
  aspectType: string
): string {
  const key = `${planet1}-${planet2}-${aspectType}`;

  const interpretations: Record<string, string> = {
    "Sun-Moon-Conjunction":
      "Deep emotional recognition. You feel seen by each other at the soul level.",
    "Sun-Moon-Trine":
      "Natural harmony between identity and emotional needs. Effortless understanding.",
    "Sun-Moon-Square":
      "Push-pull dynamic. What one needs, the other resists. Growth through friction.",
    "Venus-Mars-Conjunction":
      "Magnetic attraction. Chemistry is instant, physical, undeniable.",
    "Venus-Mars-Trine":
      "Passion meets affection. Desire and love speak the same language here.",
    "Venus-Mars-Square":
      "Tension between romance and desire. One wants connection, the other wants conquest.",
    "Moon-Moon-Conjunction":
      "Emotional mirroring. You feel each other's moods without words.",
    "Moon-Moon-Trine":
      "Emotional safety. You both understand what the other needs to feel secure.",
    "Moon-Moon-Square":
      "Different emotional languages. What soothes one may irritate the other.",
    "Sun-Sun-Conjunction":
      "Identity overlap. You see yourselves in each other — for better or worse.",
    "Sun-Sun-Trine":
      "Mutual respect. You celebrate each other's strengths without competition.",
    "Sun-Sun-Square":
      "Ego friction. Both want to lead. Compromise is the lesson.",
    "Mercury-Mercury-Conjunction":
      "Mental sync. You finish each other's sentences (sometimes annoyingly so).",
    "Mercury-Mercury-Trine":
      "Communication flows. Ideas build on ideas. Conversations energize you both.",
    "Venus-Venus-Conjunction":
      "Shared values. You love the same things, seek the same beauty.",
    "Venus-Venus-Trine": "Aesthetic harmony. You make each other's worlds more beautiful.",
  };

  return (
    interpretations[key] ||
    `${planet1} meets ${planet2} in a ${aspectType}. This aspect colors how you interact.`
  );
}

// Calculate element balance (fire, earth, air, water)
function calculateElementBalance(
  chart1: BirthChartData,
  chart2: BirthChartData
): { fire: number; earth: number; air: number; water: number } {
  const elementMap: Record<string, string> = {
    Aries: "fire",
    Leo: "fire",
    Sagittarius: "fire",
    Taurus: "earth",
    Virgo: "earth",
    Capricorn: "earth",
    Gemini: "air",
    Libra: "air",
    Aquarius: "air",
    Cancer: "water",
    Scorpio: "water",
    Pisces: "water",
  };

  const elements = { fire: 0, earth: 0, air: 0, water: 0 };

  [chart1, chart2].forEach((chart) => {
    chart.positions.forEach((planet) => {
      const element = elementMap[planet.sign] as keyof typeof elements;
      if (element) elements[element]++;
    });
  });

  // Normalize to percentages
  const total = elements.fire + elements.earth + elements.air + elements.water;

  return {
    fire: Math.round((elements.fire / total) * 100),
    earth: Math.round((elements.earth / total) * 100),
    air: Math.round((elements.air / total) * 100),
    water: Math.round((elements.water / total) * 100),
  };
}

// Generate synastry narrative
function generateSynastryNarrative(aspects: SynastryAspect[]): string {
  const magnetic = aspects.filter((a) => a.chemistry === "magnetic");
  const harmonious = aspects.filter((a) => a.chemistry === "harmonious");
  const challenging = aspects.filter((a) => a.chemistry === "challenging");

  if (magnetic.length > 0) {
    return `This connection is electric. ${magnetic[0].interpretation} The pull between you is undeniable — and that intensity can build or burn.`;
  }

  if (harmonious.length > challenging.length) {
    return `This connection flows naturally. You meet each other with ease, and the friction you do encounter becomes fuel for growth rather than division.`;
  }

  if (challenging.length > harmonious.length) {
    return `This connection is not easy — but it's real. The tension you feel is the universe asking both of you to evolve. If you're willing, this relationship becomes the forge.`;
  }

  return `This connection is balanced. You bring each other both ease and challenge, and the dance between the two is where the magic lives.`;
}

// Main function: Generate synastry report
export function generateSynastryReport(
  chart1: BirthChartData,
  chart2: BirthChartData,
  person1Name?: string,
  person2Name?: string
): SynastryReport {
  const aspects = detectSynastryAspects(chart1, chart2);
  const elementBalance = calculateElementBalance(chart1, chart2);

  // Calculate compatibility score
  const magneticCount = aspects.filter((a) => a.chemistry === "magnetic").length;
  const harmoniousCount = aspects.filter((a) => a.chemistry === "harmonious")
    .length;
  const challengingCount = aspects.filter((a) => a.chemistry === "challenging")
    .length;

  const compatibilityScore = Math.min(
    100,
    Math.round(
      (magneticCount * 15 + harmoniousCount * 10 - challengingCount * 5 + 50)
    )
  );

  // Extract strengths and challenges
  const strengths: string[] = [];
  const challenges: string[] = [];

  aspects.forEach((aspect) => {
    if (aspect.chemistry === "magnetic" || aspect.chemistry === "harmonious") {
      strengths.push(
        `${aspect.person1Planet}-${aspect.person2Planet} ${aspect.aspectType}`
      );
    } else if (aspect.chemistry === "challenging") {
      challenges.push(
        `${aspect.person1Planet}-${aspect.person2Planet} ${aspect.aspectType}`
      );
    }
  });

  const narrative = generateSynastryNarrative(aspects);

  return {
    person1Name,
    person2Name,
    overallCompatibility: compatibilityScore,
    aspects,
    elementBalance,
    narrative,
    strengths: strengths.slice(0, 5), // Top 5
    challenges: challenges.slice(0, 3), // Top 3
  };
}

// Helper: Quick compatibility check
export function quickCompatibilityCheck(
  chart1: BirthChartData,
  chart2: BirthChartData
): { compatible: boolean; reason: string } {
  const report = generateSynastryReport(chart1, chart2);

  if (report.overallCompatibility >= 70) {
    return {
      compatible: true,
      reason: "Strong natural harmony and attraction.",
    };
  } else if (report.overallCompatibility >= 50) {
    return {
      compatible: true,
      reason: "Balanced connection with room for growth.",
    };
  } else {
    return {
      compatible: false,
      reason: "Significant challenges — requires conscious work.",
    };
  }
}
