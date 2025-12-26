// lib/astrology/comparisons.ts
import {
  BirthChartData,
  PlanetPosition,
  Aspect,
  HousePosition,
} from "@/types/astrology";
import { InterpretationEngine, InterpretationContext } from "./interpretations";

// Local aspect calculation function
const calculateAspects = (planets: PlanetPosition[]): Aspect[] => {
  const aspects: Aspect[] = [];
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
};

export interface SynastryAspect {
  planet1: { name: string; chart: "person1" | "person2" };
  planet2: { name: string; chart: "person1" | "person2" };
  type: string;
  orb: number;
  exact: boolean;
  weight: number; // Importance score for relationship
}

export interface CompositePlanet extends PlanetPosition {
  originalPositions: {
    person1: number;
    person2: number;
  };
}

export interface CompositeChart {
  planets: CompositePlanet[];
  aspects: Aspect[];
  houses: HousePosition[];
  relationshipType: "synastry" | "composite" | "combined";
  compatibilityScore: number;
  keyThemes: string[];
}

export interface RelationshipAnalysis {
  overallCompatibility: number;
  strengths: string[];
  challenges: string[];
  communication: string;
  emotional: string;
  intellectual: string;
  physical: string;
  growth: string;
  longTermPotential: number;
  recommendations: string[];
}

export class ChartComparisonEngine {
  private interpretationEngine: InterpretationEngine;

  constructor() {
    this.interpretationEngine = new InterpretationEngine();
  }

  // Synastry Analysis - Comparing two individual charts
  calculateSynastry(
    chart1: BirthChartData,
    chart2: BirthChartData
  ): { synastryAspects: SynastryAspect[]; analysis: RelationshipAnalysis } {
    const synastryAspects = this.calculateSynastryAspects(chart1, chart2);
    const analysis = this.analyzeRelationship(chart1, chart2, synastryAspects);

    return { synastryAspects, analysis };
  }

  // Composite Chart - Creating a single chart from two
  calculateCompositeChart(
    chart1: BirthChartData,
    chart2: BirthChartData
  ): CompositeChart {
    const compositePlanets = this.calculateCompositePlanets(chart1, chart2);
    const compositeAspects = calculateAspects(compositePlanets);
    const compatibilityScore = this.calculateCompatibilityScore(chart1, chart2);
    const keyThemes = this.identifyRelationshipThemes(chart1, chart2);

    return {
      planets: compositePlanets,
      aspects: compositeAspects,
      houses: this.calculateCompositeHouses(chart1, chart2),
      relationshipType: "composite",
      compatibilityScore,
      keyThemes,
    };
  }

  // Combined Analysis - Both synastry and composite
  calculateCombinedAnalysis(
    chart1: BirthChartData,
    chart2: BirthChartData
  ): {
    synastry: { aspects: SynastryAspect[]; analysis: RelationshipAnalysis };
    composite: CompositeChart;
    summary: string;
  } {
    const synastry = this.calculateSynastry(chart1, chart2);
    const composite = this.calculateCompositeChart(chart1, chart2);
    const summary = this.generateRelationshipSummary(
      { aspects: synastry.synastryAspects, analysis: synastry.analysis },
      composite
    );

    return {
      synastry: {
        aspects: synastry.synastryAspects,
        analysis: synastry.analysis,
      },
      composite,
      summary,
    };
  }

  private calculateSynastryAspects(
    chart1: BirthChartData,
    chart2: BirthChartData
  ): SynastryAspect[] {
    const aspects: SynastryAspect[] = [];
    const allPlanets1 = chart1.positions;
    const allPlanets2 = chart2.positions;

    // Person 1 planets to Person 2 planets
    for (const planet1 of allPlanets1) {
      for (const planet2 of allPlanets2) {
        const aspect = this.calculateAspectBetweenPlanets(
          planet1,
          planet2,
          "person1",
          "person2"
        );
        if (aspect) {
          aspects.push(aspect);
        }
      }
    }

    // Person 2 planets to Person 1 planets (reverse perspective)
    for (const planet1 of allPlanets2) {
      for (const planet2 of allPlanets1) {
        const aspect = this.calculateAspectBetweenPlanets(
          planet1,
          planet2,
          "person2",
          "person1"
        );
        if (aspect) {
          aspects.push(aspect);
        }
      }
    }

    return aspects.sort((a, b) => b.weight - a.weight);
  }

  private calculateAspectBetweenPlanets(
    planet1: PlanetPosition,
    planet2: PlanetPosition,
    chart1: "person1" | "person2",
    chart2: "person1" | "person2"
  ): SynastryAspect | null {
    const majorAspects = [
      { type: "Conjunction", angle: 0, orb: 10, weight: 10 },
      { type: "Opposition", angle: 180, orb: 10, weight: 9 },
      { type: "Trine", angle: 120, orb: 8, weight: 7 },
      { type: "Square", angle: 90, orb: 8, weight: 8 },
      { type: "Sextile", angle: 60, orb: 6, weight: 6 },
    ];

    let diff = Math.abs(planet1.longitude - planet2.longitude);
    if (diff > 180) diff = 360 - diff;

    for (const aspect of majorAspects) {
      const orbDiff = Math.abs(diff - aspect.angle);
      if (orbDiff <= aspect.orb) {
        return {
          planet1: { name: planet1.name, chart: chart1 },
          planet2: { name: planet2.name, chart: chart2 },
          type: aspect.type,
          orb: orbDiff,
          exact: orbDiff < 1,
          weight: aspect.weight * (1 - orbDiff / aspect.orb),
        };
      }
    }

    return null;
  }

  private calculateCompositePlanets(
    chart1: BirthChartData,
    chart2: BirthChartData
  ): CompositePlanet[] {
    const compositePlanets: CompositePlanet[] = [];

    for (const planet1 of chart1.positions) {
      const planet2 = chart2.positions.find(
        (p: PlanetPosition) => p.name === planet1.name
      );
      if (planet2) {
        // Calculate midpoint longitude
        let midpoint = (planet1.longitude + planet2.longitude) / 2;

        // Handle crossing 0°
        if (Math.abs(planet1.longitude - planet2.longitude) > 180) {
          midpoint = (midpoint + 180) % 360;
        }

        const sign = this.getZodiacSign(midpoint);
        const { degree, minute } = this.getDegreeMinute(midpoint);

        compositePlanets.push({
          name: planet1.name,
          longitude: midpoint,
          latitude: (planet1.latitude + planet2.latitude) / 2,
          distance: (planet1.distance + planet2.distance) / 2,
          speed: ((planet1.speed || 0) + (planet2.speed || 0)) / 2,
          sign,
          degree,
          minute,
          originalPositions: {
            person1: planet1.longitude,
            person2: planet2.longitude,
          },
        });
      }
    }

    return compositePlanets;
  }

  private calculateCompositeHouses(
    chart1: BirthChartData,
    chart2: BirthChartData
  ): HousePosition[] {
    const compositeHouses: HousePosition[] = [];

    for (let i = 0; i < 12; i++) {
      const house1 = chart1.houses[i];
      const house2 = chart2.houses.find((h) => h.house === i + 1);

      if (
        house1 &&
        house2 &&
        house1.longitude !== undefined &&
        house2.longitude !== undefined
      ) {
        const midpoint = (house1.longitude + house2.longitude) / 2;
        const sign = this.getZodiacSign(midpoint);
        const { degree, minute } = this.getDegreeMinute(midpoint);

        compositeHouses.push({
          house: i + 1,
          position: midpoint,
          sign,
          degree,
          minute,
          longitude: midpoint,
        });
      }
    }

    return compositeHouses;
  }

  private analyzeRelationship(
    chart1: BirthChartData,
    chart2: BirthChartData,
    synastryAspects: SynastryAspect[]
  ): RelationshipAnalysis {
    const compatibilityScore = this.calculateCompatibilityScore(chart1, chart2);
    const strengths = this.identifyStrengths(synastryAspects);
    const challenges = this.identifyChallenges(synastryAspects);

    return {
      overallCompatibility: compatibilityScore,
      strengths,
      challenges,
      communication: this.analyzeCommunication(chart1, chart2, synastryAspects),
      emotional: this.analyzeEmotional(chart1, chart2, synastryAspects),
      intellectual: this.analyzeIntellectual(chart1, chart2, synastryAspects),
      physical: this.analyzePhysical(chart1, chart2, synastryAspects),
      growth: this.analyzeGrowth(chart1, chart2, synastryAspects),
      longTermPotential: this.calculateLongTermPotential(synastryAspects),
      recommendations: this.generateRecommendations(synastryAspects),
    };
  }

  private calculateCompatibilityScore(
    chart1: BirthChartData,
    chart2: BirthChartData
  ): number {
    let score = 50; // Base score

    // Sun-Moon compatibility
    const sun1 = chart1.positions.find((p: PlanetPosition) => p.name === "Sun");
    const moon2 = chart2.positions.find(
      (p: PlanetPosition) => p.name === "Moon"
    );
    const sun2 = chart2.positions.find((p: PlanetPosition) => p.name === "Sun");
    const moon1 = chart1.positions.find(
      (p: PlanetPosition) => p.name === "Moon"
    );

    if (sun1 && moon2) {
      const diff = Math.abs(sun1.longitude - moon2.longitude);
      if (diff < 60 || diff > 300) score += 15; // Harmonious
      else if (diff > 120 && diff < 240) score -= 10; // Challenging
    }

    if (sun2 && moon1) {
      const diff = Math.abs(sun2.longitude - moon1.longitude);
      if (diff < 60 || diff > 300) score += 15;
      else if (diff > 120 && diff < 240) score -= 10;
    }

    // Venus-Mars compatibility
    const venus1 = chart1.positions.find(
      (p: PlanetPosition) => p.name === "Venus"
    );
    const mars2 = chart2.positions.find(
      (p: PlanetPosition) => p.name === "Mars"
    );
    const venus2 = chart2.positions.find(
      (p: PlanetPosition) => p.name === "Venus"
    );
    const mars1 = chart1.positions.find(
      (p: PlanetPosition) => p.name === "Mars"
    );

    if (venus1 && mars2) {
      const diff = Math.abs(venus1.longitude - mars2.longitude);
      if (diff < 60 || diff > 300) score += 10;
    }

    if (venus2 && mars1) {
      const diff = Math.abs(venus2.longitude - mars1.longitude);
      if (diff < 60 || diff > 300) score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private identifyStrengths(aspects: SynastryAspect[]): string[] {
    const strengths: string[] = [];

    // Harmonious aspects between personal planets
    const harmoniousAspects = aspects.filter(
      (a) => ["Trine", "Sextile"].includes(a.type) && a.weight > 5
    );

    if (harmoniousAspects.length >= 3) {
      strengths.push("Strong natural harmony and flow between you");
    }

    // Sun-Moon connections
    const sunMoonConnections = aspects.filter(
      (a) =>
        (a.planet1.name === "Sun" && a.planet2.name === "Moon") ||
        (a.planet1.name === "Moon" && a.planet2.name === "Sun")
    );

    if (sunMoonConnections.length > 0) {
      strengths.push("Deep emotional understanding and connection");
    }

    // Venus-Jupiter aspects
    const venusJupiterAspects = aspects.filter(
      (a) =>
        (a.planet1.name === "Venus" && a.planet2.name === "Jupiter") ||
        (a.planet1.name === "Jupiter" && a.planet2.name === "Venus")
    );

    if (venusJupiterAspects.length > 0) {
      strengths.push("Shared values and optimistic outlook");
    }

    return strengths;
  }

  private identifyChallenges(aspects: SynastryAspect[]): string[] {
    const challenges: string[] = [];

    // Hard aspects between personal planets
    const hardAspects = aspects.filter(
      (a) => ["Square", "Opposition"].includes(a.type) && a.weight > 6
    );

    if (hardAspects.length >= 3) {
      challenges.push(
        "Potential for conflict and tension that requires conscious effort"
      );
    }

    // Saturn-Mars aspects
    const saturnMarsAspects = aspects.filter(
      (a) =>
        (a.planet1.name === "Saturn" && a.planet2.name === "Mars") ||
        (a.planet1.name === "Mars" && a.planet2.name === "Saturn")
    );

    if (saturnMarsAspects.length > 0) {
      challenges.push(
        "Different approaches to action and discipline may create friction"
      );
    }

    return challenges;
  }

  private analyzeCommunication(
    chart1: BirthChartData,
    chart2: BirthChartData,
    aspects: SynastryAspect[]
  ): string {
    const mercuryAspects = aspects.filter(
      (a) => a.planet1.name === "Mercury" || a.planet2.name === "Mercury"
    );

    if (mercuryAspects.length === 0) {
      return "Communication styles may be quite different, requiring extra effort to understand each other.";
    }

    const harmoniousMercury = mercuryAspects.filter((a) =>
      ["Trine", "Sextile", "Conjunction"].includes(a.type)
    );

    if (harmoniousMercury.length >= 2) {
      return "Natural mental rapport and easy communication. You understand each other's ways of thinking.";
    }

    return "Communication requires attention and patience, but can be improved with conscious effort.";
  }

  private analyzeEmotional(
    chart1: BirthChartData,
    chart2: BirthChartData,
    aspects: SynastryAspect[]
  ): string {
    const moonAspects = aspects.filter(
      (a) => a.planet1.name === "Moon" || a.planet2.name === "Moon"
    );

    const venusAspects = aspects.filter(
      (a) => a.planet1.name === "Venus" || a.planet2.name === "Venus"
    );

    if (
      moonAspects.filter((a) => ["Trine", "Sextile"].includes(a.type)).length >=
      2
    ) {
      return "Deep emotional compatibility and intuitive understanding of each other's needs.";
    }

    if (
      venusAspects.filter((a) => ["Square", "Opposition"].includes(a.type))
        .length >= 2
    ) {
      return "Emotional patterns may trigger each other, requiring awareness and compassion.";
    }

    return "Emotional connection exists but may need nurturing and understanding.";
  }

  private analyzeIntellectual(
    chart1: BirthChartData,
    chart2: BirthChartData,
    aspects: SynastryAspect[]
  ): string {
    const mercuryAspects = aspects.filter(
      (a) => a.planet1.name === "Mercury" || a.planet2.name === "Mercury"
    );

    const jupiterAspects = aspects.filter(
      (a) => a.planet1.name === "Jupiter" || a.planet2.name === "Jupiter"
    );

    if (
      mercuryAspects.filter((a) => ["Trine", "Sextile"].includes(a.type))
        .length >= 1 &&
      jupiterAspects.filter((a) => ["Trine", "Sextile"].includes(a.type))
        .length >= 1
    ) {
      return "Excellent intellectual compatibility with shared interests and learning opportunities.";
    }

    return "Mental stimulation exists through different perspectives and approaches.";
  }

  private analyzePhysical(
    chart1: BirthChartData,
    chart2: BirthChartData,
    aspects: SynastryAspect[]
  ): string {
    const marsAspects = aspects.filter(
      (a) => a.planet1.name === "Mars" || a.planet2.name === "Mars"
    );

    const venusAspects = aspects.filter(
      (a) => a.planet1.name === "Venus" || a.planet2.name === "Venus"
    );

    if (
      marsAspects.filter((a) => ["Conjunction", "Trine"].includes(a.type))
        .length >= 1 &&
      venusAspects.filter((a) => ["Conjunction", "Trine"].includes(a.type))
        .length >= 1
    ) {
      return "Strong physical attraction and natural chemistry.";
    }

    return "Physical connection exists and can deepen with emotional intimacy.";
  }

  private analyzeGrowth(
    chart1: BirthChartData,
    chart2: BirthChartData,
    aspects: SynastryAspect[]
  ): string {
    const saturnAspects = aspects.filter(
      (a) => a.planet1.name === "Saturn" || a.planet2.name === "Saturn"
    );

    const uranusAspects = aspects.filter(
      (a) => a.planet1.name === "Uranus" || a.planet2.name === "Uranus"
    );

    if (saturnAspects.length >= 2) {
      return "This relationship offers significant opportunities for personal growth and maturity.";
    }

    if (uranusAspects.length >= 2) {
      return "The relationship brings change and liberation from old patterns.";
    }

    return "Growth opportunities exist through learning from each other's differences.";
  }

  private calculateLongTermPotential(aspects: SynastryAspect[]): number {
    let score = 50;

    // Positive indicators
    const positiveAspects = aspects.filter((a) =>
      ["Trine", "Sextile"].includes(a.type)
    );
    score += positiveAspects.length * 3;

    // Challenging aspects that build strength
    const saturnAspects = aspects.filter(
      (a) => a.planet1.name === "Saturn" || a.planet2.name === "Saturn"
    );
    score += saturnAspects.length * 2;

    // Very challenging aspects
    const veryHardAspects = aspects.filter(
      (a) => ["Square", "Opposition"].includes(a.type) && a.weight > 7
    );
    score -= veryHardAspects.length * 2;

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(aspects: SynastryAspect[]): string[] {
    const recommendations: string[] = [];

    const mercuryAspects = aspects.filter(
      (a) => a.planet1.name === "Mercury" || a.planet2.name === "Mercury"
    );

    if (
      mercuryAspects.filter((a) => ["Square", "Opposition"].includes(a.type))
        .length >= 1
    ) {
      recommendations.push(
        "Practice active listening and clarify misunderstandings promptly"
      );
    }

    const moonAspects = aspects.filter(
      (a) => a.planet1.name === "Moon" || a.planet2.name === "Moon"
    );

    if (
      moonAspects.filter((a) => ["Square", "Opposition"].includes(a.type))
        .length >= 1
    ) {
      recommendations.push(
        "Create emotional safety through regular check-ins and vulnerability"
      );
    }

    const saturnAspects = aspects.filter(
      (a) => a.planet1.name === "Saturn" || a.planet2.name === "Saturn"
    );

    if (saturnAspects.length >= 1) {
      recommendations.push(
        "Embrace responsibility and commitment as opportunities for growth"
      );
    }

    return recommendations;
  }

  private identifyRelationshipThemes(
    chart1: BirthChartData,
    chart2: BirthChartData
  ): string[] {
    const themes: string[] = [];

    // Check for element emphasis
    const elements1 = this.getElementBalance(chart1);
    const elements2 = this.getElementBalance(chart2);

    const commonElements = Object.keys(elements1).filter(
      (element) => elements1[element] > 0 && elements2[element] > 0
    );

    if (commonElements.includes("fire")) {
      themes.push("Passion and inspiration");
    }
    if (commonElements.includes("earth")) {
      themes.push("Stability and practical support");
    }
    if (commonElements.includes("air")) {
      themes.push("Intellectual connection and communication");
    }
    if (commonElements.includes("water")) {
      themes.push("Emotional depth and intuition");
    }

    return themes;
  }

  private getElementBalance(chart: BirthChartData): Record<string, number> {
    const elements = { fire: 0, earth: 0, air: 0, water: 0 };
    const elementSigns = {
      fire: ["Aries", "Leo", "Sagittarius"],
      earth: ["Taurus", "Virgo", "Capricorn"],
      air: ["Gemini", "Libra", "Aquarius"],
      water: ["Cancer", "Scorpio", "Pisces"],
    };

    chart.positions.forEach((planet: PlanetPosition) => {
      for (const [element, signs] of Object.entries(elementSigns)) {
        if (signs.includes(planet.sign)) {
          (elements as any)[element]++;
        }
      }
    });

    return elements;
  }

  private generateRelationshipSummary(
    synastry: { aspects: SynastryAspect[]; analysis: RelationshipAnalysis },
    composite: CompositeChart
  ): string {
    const compatibility = synastry.analysis.overallCompatibility;
    const strengths = synastry.analysis.strengths.slice(0, 2);
    const themes = composite.keyThemes.slice(0, 2);

    let summary = `This relationship shows a ${
      compatibility > 70
        ? "high"
        : compatibility > 50
        ? "moderate"
        : "challenging"
    } compatibility score of ${compatibility}%.`;

    if (strengths.length > 0) {
      summary += ` Key strengths include ${strengths.join(" and ")}.`;
    }

    if (themes.length > 0) {
      summary += ` The relationship centers around themes of ${themes.join(
        " and "
      )}.`;
    }

    summary += ` Long-term potential is rated at ${synastry.analysis.longTermPotential}%.`;

    return summary;
  }

  private getZodiacSign(longitude: number): string {
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
    return signs[Math.floor(longitude / 30)];
  }

  private getDegreeMinute(longitude: number): {
    degree: number;
    minute: number;
  } {
    const degree = Math.floor(longitude);
    const minute = Math.floor((longitude - degree) * 60);
    return { degree, minute };
  }
}
