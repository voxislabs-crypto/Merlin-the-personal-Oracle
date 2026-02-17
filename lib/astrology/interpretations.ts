// lib/astrology/interpretations.ts
import {
  PlanetPosition,
  Aspect,
  HousePosition,
  Dignity,
} from "@/types/astrology";

export interface InterpretationContext {
  planet: string;
  sign: string;
  house?: number;
  aspect?: string;
  dignity?: Dignity;
  quality: number;
}

export class InterpretationEngine {
  private signKeywords: Record<string, string[]> = {
    Aries: [
      "initiative",
      "courage",
      "leadership",
      "impulsiveness",
      "independence",
    ],
    Taurus: ["stability", "patience", "sensuality", "stubbornness", "material"],
    Gemini: [
      "communication",
      "curiosity",
      "adaptability",
      "restlessness",
      "intellect",
    ],
    Cancer: ["nurturing", "emotion", "intuition", "moodiness", "protection"],
    Leo: ["creativity", "confidence", "generosity", "pride", "leadership"],
    Virgo: ["analysis", "service", "perfectionism", "practicality", "health"],
    Libra: ["harmony", "justice", "relationships", "indecision", "beauty"],
    Scorpio: ["transformation", "intensity", "power", "secrecy", "depth"],
    Sagittarius: [
      "exploration",
      "philosophy",
      "optimism",
      "restlessness",
      "freedom",
    ],
    Capricorn: [
      "ambition",
      "discipline",
      "structure",
      "pessimism",
      "achievement",
    ],
    Aquarius: ["innovation", "humanity", "rebellion", "detachment", "progress"],
    Pisces: [
      "compassion",
      "imagination",
      "spirituality",
      "escapism",
      "intuition",
    ],
  };

  private planetKeywords: Record<string, string[]> = {
    Sun: ["identity", "vitality", "ego", "creativity", "life force"],
    Moon: ["emotions", "instincts", "habits", "needs", "subconscious"],
    Mercury: ["thinking", "communication", "learning", "logic", "adaptability"],
    Venus: ["love", "values", "beauty", "relationships", "pleasure"],
    Mars: ["action", "desire", "courage", "conflict", "energy"],
    Jupiter: ["growth", "optimism", "expansion", "wisdom", "opportunity"],
    Saturn: [
      "discipline",
      "limitations",
      "responsibility",
      "structure",
      "karma",
    ],
    Uranus: [
      "revolution",
      "innovation",
      "sudden change",
      "freedom",
      "eccentricity",
    ],
    Neptune: ["dreams", "illusion", "spirituality", "creativity", "intuition"],
    Pluto: ["transformation", "power", "death", "rebirth", "intensity"],
  };

  private aspectInterpretations: Record<
    string,
    { positive: string[]; negative: string[] }
  > = {
    Conjunction: {
      positive: [
        "unified energy",
        "focused intention",
        "amplified traits",
        "new beginnings",
      ],
      negative: [
        "conflicted energy",
        "overwhelming intensity",
        "lack of perspective",
        "internal pressure",
      ],
    },
    Sextile: {
      positive: [
        "harmonious opportunity",
        "easy communication",
        "natural talent",
        "supportive flow",
      ],
      negative: [
        "missed opportunities",
        "lack of initiative",
        "untapped potential",
        "passive acceptance",
      ],
    },
    Square: {
      positive: [
        "dynamic tension",
        "growth opportunity",
        "motivation for change",
        "creative problem-solving",
      ],
      negative: [
        "internal conflict",
        "obstacles and challenges",
        "stress and pressure",
        "frustration",
      ],
    },
    Trine: {
      positive: [
        "natural harmony",
        "effortless flow",
        "talents and gifts",
        "supportive circumstances",
      ],
      negative: [
        "complacency",
        "lack of motivation",
        "overconfidence",
        "missed growth",
      ],
    },
    Opposition: {
      positive: [
        "balance and integration",
        "awareness of others",
        "relationship dynamics",
        "perspective",
      ],
      negative: [
        "external conflict",
        "projection and blame",
        "indecision",
        "relationship challenges",
      ],
    },
  };

  generateInterpretation(context: InterpretationContext): string {
    const { planet, sign, house, aspect, dignity, quality } = context;

    const signKeywords = this.signKeywords[sign] || [];
    const planetKeywords = this.planetKeywords[planet] || [];

    let interpretation = this.buildBaseInterpretation(
      planet,
      sign,
      planetKeywords,
      signKeywords
    );

    if (house) {
      interpretation += this.addHouseContext(house, quality);
    }

    if (aspect) {
      interpretation += this.addAspectContext(aspect, quality);
    }

    if (dignity) {
      interpretation += this.addDignityContext(dignity, quality);
    }

    interpretation += this.addQualityModifier(quality);

    return interpretation;
  }

  private buildBaseInterpretation(
    planet: string,
    sign: string,
    planetKeywords: string[],
    signKeywords: string[]
  ): string {
    const templates = [
      `Your ${planet} in ${sign} combines ${planetKeywords[0]} with ${signKeywords[0]}, creating a personality that expresses ${planetKeywords[1]} through ${signKeywords[1]}.`,
      `With ${planet} positioned in ${sign}, your ${planetKeywords[0]} is filtered through the lens of ${signKeywords[0]}, emphasizing ${signKeywords[1]} in your approach to ${planetKeywords[2]}.`,
      `The placement of ${planet} in ${sign} merges the principles of ${planetKeywords[0]} and ${signKeywords[0]}, highlighting your capacity for ${planetKeywords[1]} expressed through ${signKeywords[1]}.`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private addHouseContext(house: number, quality: number): string {
    const houseThemes = [
      "identity and self-expression",
      "values and resources",
      "communication and learning",
      "home and family",
      "creativity and romance",
      "work and service",
      "partnerships and relationships",
      "intimacy and transformation",
      "philosophy and expansion",
      "career and public life",
      "friendships and ideals",
      "spirituality and unconscious",
    ];

    const theme = houseThemes[house - 1] || "life areas";
    const strength = quality > 60 ? "strongly" : "moderately";

    return ` This ${strength} influences your ${theme}, shaping how you approach these fundamental areas of life.`;
  }

  private addAspectContext(aspect: string, quality: number): string {
    const interpretations = this.aspectInterpretations[aspect];
    if (!interpretations) return "";

    const keywords =
      quality > 65 ? interpretations.positive : interpretations.negative;
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];

    return ` The ${aspect.toLowerCase()} aspect brings ${keyword}, creating additional dynamics in how these energies interact.`;
  }

  private addDignityContext(dignity: Dignity, quality: number): string {
    const strength =
      quality > 70 ? "enhanced" : quality > 40 ? "moderated" : "challenged";
    return ` ${dignity.type} placement ${strength} this planetary expression, ${
      dignity.score > 50
        ? "amplifying its natural qualities"
        : "requiring conscious effort to harmonize"
    }.`;
  }

  private addQualityModifier(quality: number): string {
    // Return empty string - let the main interpretation stand on its own
    return "";
  }

  generateAspectInterpretation(aspect: Aspect): string {
    const { planet1, planet2, type, orb = 0, exact } = aspect;
    const keywords1 = this.planetKeywords[planet1.name] || [];
    const keywords2 = this.planetKeywords[planet2.name] || [];
    const aspectKeywords = this.aspectInterpretations[type];

    const precision = exact
      ? "exact"
      : orb < 2
      ? "very close"
      : orb < 5
      ? "close"
      : "wide";
    const influence = aspectKeywords
      ? orb < 3
        ? aspectKeywords.positive
        : aspectKeywords.negative
      : [];

    return `The ${precision} ${type.toLowerCase()} between ${
      planet1.name
    } and ${planet2.name} connects your ${keywords1[0]} with your ${
      keywords2[0]
    }. ${
      influence[0]
        ? `This creates ${influence[0]}.`
        : ""
    }`;
  }

  generateChartSummary(planets: PlanetPosition[], aspects: Aspect[]): string {
    const dominantElements = this.calculateDominantElements(planets);
    const aspectPatterns = this.identifyAspectPatterns(aspects);

    return `Your chart shows a strong emphasis on ${dominantElements.join(
      " and "
    )}. ${
      aspectPatterns.length > 0
        ? `Notable patterns include ${aspectPatterns.join(
            ", "
          )}, creating significant themes in your personality and life path.`
        : "The planetary aspects create a unique dynamic that shapes your character and experiences."
    }`;
  }

  private calculateDominantElements(planets: PlanetPosition[]): string[] {
    // Simplified element calculation - would be more sophisticated in production
    const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
    const elementSigns = {
      fire: ["Aries", "Leo", "Sagittarius"],
      earth: ["Taurus", "Virgo", "Capricorn"],
      air: ["Gemini", "Libra", "Aquarius"],
      water: ["Cancer", "Scorpio", "Pisces"],
    };

    planets.forEach((planet) => {
      for (const [element, signs] of Object.entries(elementSigns)) {
        if (signs.includes(planet.sign)) {
          elementCounts[element as keyof typeof elementCounts]++;
        }
      }
    });

    return Object.entries(elementCounts)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([element]) => element);
  }

  private identifyAspectPatterns(aspects: Aspect[]): string[] {
    const patterns: string[] = [];
    const aspectCounts = aspects.reduce((acc, aspect) => {
      acc[aspect.type] = (acc[aspect.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (aspectCounts["Trine"] >= 2)
      patterns.push("harmonious trine configurations");
    if (aspectCounts["Square"] >= 2) patterns.push("dynamic square patterns");
    if (aspectCounts["Opposition"] >= 2)
      patterns.push("relationship-focused oppositions");

    return patterns;
  }
}
