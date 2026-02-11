/**
 * MBTI Fusion Engine
 * Computes Myers-Briggs personality type from astrological birth chart data
 * Based on astrological-psychological correlations and empirical patterns
 */

import type { BirthChartData, PlanetPosition } from "@/types/astrology";

export interface MBTIDetails {
  type: string;
  confidence: number;
  breakdown: {
    e_i: string;
    s_n: string;
    t_f: string;
    j_p: string;
  };
  firmware?: string; // ENFP overlay, etc.
  reasoning: {
    extraversion: string[];
    intuition: string[];
    thinking: string[];
    judging: string[];
  };
}

// Helper: Get zodiac sign element
function getElement(
  sign: string
): "fire" | "earth" | "air" | "water" | undefined {
  const elements: Record<string, "fire" | "earth" | "air" | "water"> = {
    aries: "fire",
    taurus: "earth",
    gemini: "air",
    cancer: "water",
    leo: "fire",
    virgo: "earth",
    libra: "air",
    scorpio: "water",
    sagittarius: "fire",
    capricorn: "earth",
    aquarius: "air",
    pisces: "water",
  };
  return elements[sign?.toLowerCase()];
}

// Helper: Get zodiac sign modality
function getMode(
  sign: string
): "cardinal" | "fixed" | "mutable" | undefined {
  const modes: Record<string, "cardinal" | "fixed" | "mutable"> = {
    aries: "cardinal",
    taurus: "fixed",
    gemini: "mutable",
    cancer: "cardinal",
    leo: "fixed",
    virgo: "mutable",
    libra: "cardinal",
    scorpio: "fixed",
    sagittarius: "mutable",
    capricorn: "cardinal",
    aquarius: "fixed",
    pisces: "mutable",
  };
  return modes[sign?.toLowerCase()];
}

// Helper: Find planet by name
function findPlanet(
  positions: PlanetPosition[],
  name: string
): PlanetPosition | undefined {
  return positions.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

// Helper: Check if planet has aspect
function hasAspect(
  planet: PlanetPosition,
  targetName: string,
  aspectTypes: string[],
  chart: BirthChartData
): boolean {
  if (!chart.aspects) return false;
  
  return chart.aspects.some((aspect) => {
    const isTarget =
      (aspect.planet1.name.toLowerCase() === planet.name.toLowerCase() &&
        aspect.planet2.name.toLowerCase() === targetName.toLowerCase()) ||
      (aspect.planet2.name.toLowerCase() === planet.name.toLowerCase() &&
        aspect.planet1.name.toLowerCase() === targetName.toLowerCase());
    
    return isTarget && aspectTypes.includes(aspect.type.toLowerCase());
  });
}

/**
 * Compute MBTI type from birth chart data
 */
export function computeMBTI(chart: BirthChartData): MBTIDetails {
  const { positions, houses, ascendant, mc } = chart;
  
  // Find key planets
  const sun = findPlanet(positions, "Sun");
  const moon = findPlanet(positions, "Moon");
  const mercury = findPlanet(positions, "Mercury");
  const venus = findPlanet(positions, "Venus");
  const mars = findPlanet(positions, "Mars");
  const jupiter = findPlanet(positions, "Jupiter");
  const saturn = findPlanet(positions, "Saturn");
  const uranus = findPlanet(positions, "Uranus");
  const neptune = findPlanet(positions, "Neptune");
  const northNode = findPlanet(positions, "True Node") || findPlanet(positions, "North Node");

  // Reasoning arrays
  const extraversionReasons: string[] = [];
  const intuitionReasons: string[] = [];
  const thinkingReasons: string[] = [];
  const judgingReasons: string[] = [];

  // === E/I: Extraversion vs Introversion ===
  let eScore = 0;
  
  // Ascendant in Fire/Air = outgoing, expressive
  const ascElement = getElement(ascendant.sign);
  if (ascElement === "fire" || ascElement === "air") {
    eScore += 1.0;
    extraversionReasons.push(`${ascendant.sign} ascendant (${ascElement})`);
  }
  
  // Mars in Fire/Air = assertive action style
  if (mars) {
    const marsElement = getElement(mars.sign);
    if (marsElement === "fire" || marsElement === "air") {
      eScore += 0.4;
      extraversionReasons.push(`Mars in ${mars.sign} (${marsElement})`);
    }
  }
  
  // 1st house planets = strong self-projection
  const firstHouseCount = positions.filter((p) => p.house === 1).length;
  if (firstHouseCount >= 2) {
    eScore += 0.3;
    extraversionReasons.push(`${firstHouseCount} planets in 1st house`);
  }
  
  // Sun in Fire/Air
  if (sun) {
    const sunElement = getElement(sun.sign);
    if (sunElement === "fire" || sunElement === "air") {
      eScore += 0.2;
      extraversionReasons.push(`Sun in ${sun.sign}`);
    }
  }
  
  const e_i = eScore > 0.6 ? "E" : "I";

  // === S/N: Sensing vs Intuition ===
  let nScore = 0;
  
  // North Node in Air/Fire = future-oriented, abstract thinking
  if (northNode) {
    const nnElement = getElement(northNode.sign);
    if (nnElement === "air" || nnElement === "fire") {
      nScore += 1.0;
      intuitionReasons.push(`North Node in ${northNode.sign} (${nnElement})`);
    }
  }
  
  // Mercury in Air/Fire or 9th/11th house = conceptual thinking
  if (mercury) {
    const mercuryElement = getElement(mercury.sign);
    if (
      mercuryElement === "air" ||
      mercuryElement === "fire" ||
      mercury.house === 9 ||
      mercury.house === 11
    ) {
      nScore += 0.5;
      intuitionReasons.push(
        `Mercury in ${mercury.sign} (house ${mercury.house})`
      );
    }
  }
  
  // Jupiter in Air/Fire = expansive, philosophical
  if (jupiter) {
    const jupiterElement = getElement(jupiter.sign);
    if (jupiterElement === "air" || jupiterElement === "fire") {
      nScore += 0.3;
      intuitionReasons.push(`Jupiter in ${jupiter.sign}`);
    }
  }
  
  // Uranus or Neptune prominent (1st, 9th, 10th house) = visionary
  if (uranus && (uranus.house === 1 || uranus.house === 9 || uranus.house === 10)) {
    nScore += 0.3;
    intuitionReasons.push(`Uranus in ${uranus.house}${uranus.house === 1 ? 'st' : uranus.house === 9 ? 'th' : 'th'} house`);
  }
  if (neptune && (neptune.house === 1 || neptune.house === 9 || neptune.house === 10)) {
    nScore += 0.2;
    intuitionReasons.push(`Neptune in ${neptune.house}${neptune.house === 1 ? 'st' : neptune.house === 9 ? 'th' : 'th'} house`);
  }
  
  const s_n = nScore > 0.6 ? "N" : "S";

  // === T/F: Thinking vs Feeling ===
  let tScore = 0;
  
  // Mars in Air/Fire = logical, strategic action
  if (mars) {
    const marsElement = getElement(mars.sign);
    if (marsElement === "air" || marsElement === "fire") {
      tScore += 1.0;
      thinkingReasons.push(`Mars in ${mars.sign} (${marsElement})`);
    }
  }
  
  // Moon in Air/Fire = less emotional processing
  if (moon) {
    const moonElement = getElement(moon.sign);
    if (moonElement === "air" || moonElement === "fire") {
      tScore += 0.4;
      thinkingReasons.push(`Moon in ${moon.sign} (${moonElement})`);
    }
  }
  
  // Venus-Moon harmonious aspect = feeling-oriented (subtract from T)
  if (venus && moon && hasAspect(venus, "Moon", ["conjunction", "trine", "sextile"], chart)) {
    tScore -= 0.3;
    // Don't add to thinking reasons
  } else if (venus && moon) {
    tScore += 0.2;
    thinkingReasons.push("Venus-Moon no soft aspect");
  }
  
  // Saturn strong = analytical structure
  if (saturn && (saturn.house === 1 || saturn.house === 10)) {
    tScore += 0.3;
    thinkingReasons.push(`Saturn in ${saturn.house}${saturn.house === 1 ? 'st' : 'th'} house`);
  }
  
  const t_f = tScore > 0.6 ? "T" : "F";

  // === J/P: Judging vs Perceiving ===
  let jScore = 0;
  
  // Saturn in Cardinal sign = structured approach
  if (saturn) {
    const saturnMode = getMode(saturn.sign);
    if (saturnMode === "cardinal") {
      jScore += 1.0;
      judgingReasons.push(`Saturn in ${saturn.sign} (cardinal)`);
    }
  }
  
  // MC in Cardinal sign = goal-oriented career approach
  const mcMode = getMode(mc.sign);
  if (mcMode === "cardinal") {
    jScore += 0.4;
    judgingReasons.push(`MC in ${mc.sign} (cardinal)`);
  }
  
  // 10th house planets = focus on achievement/structure
  const tenthHouseCount = positions.filter((p) => p.house === 10).length;
  if (tenthHouseCount >= 2) {
    jScore += 0.3;
    judgingReasons.push(`${tenthHouseCount} planets in 10th house`);
  }
  
  // Sun in Cardinal sign
  if (sun) {
    const sunMode = getMode(sun.sign);
    if (sunMode === "cardinal") {
      jScore += 0.2;
      judgingReasons.push(`Sun in ${sun.sign} (cardinal)`);
    }
  }
  
  const j_p = jScore > 0.6 ? "J" : "P";

  // === Override Logic: INFJ/INTJ Special Cases ===
  let override = "";
  
  // INFJ override: Mercury in 1st house OR (Moon + Neptune in 11th)
  if (mercury && mercury.house === 1) {
    if (t_f === "F" || tScore < 0.7) {
      override = "INFJ";
    }
  } else if (
    moon &&
    neptune &&
    moon.house === 11 &&
    neptune.house === 11
  ) {
    if (t_f === "F" || tScore < 0.7) {
      override = "INFJ";
    }
  }
  
  // INTJ override: Saturn in 1st or 2nd house
  if (saturn && (saturn.house === 1 || saturn.house === 2)) {
    if (override !== "INFJ" && (t_f === "T" || tScore > 0.4)) {
      override = "INTJ";
    }
  }

  const rawType = `${e_i}${s_n}${t_f}${j_p}`;
  const finalType = override || rawType;

  // === Confidence Calculation ===
  const avgScore = (
    Math.abs(eScore - 0.5) +
    Math.abs(nScore - 0.5) +
    Math.abs(tScore - 0.5) +
    Math.abs(jScore - 0.5)
  ) / 4;
  
  let confidence = Math.round(avgScore * 200); // Scale 0-1 to 0-100
  
  // Bonuses
  if (northNode && mercury) {
    const nnElement = getElement(northNode.sign);
    const mercuryElement = getElement(mercury.sign);
    if (nnElement === "air" && mercury.house === 9) {
      confidence += 15;
    }
    if (mercuryElement === "air" && nnElement === "fire") {
      confidence += 10;
    }
  }
  
  if (moon && (moon.house === 1 || moon.house === 10)) {
    confidence += 10;
  }
  
  // Penalties
  if (saturn && hasAspect(saturn, "Moon", ["square", "opposition"], chart)) {
    confidence -= 15;
  }
  if (saturn && hasAspect(saturn, "Mercury", ["square", "opposition"], chart)) {
    confidence -= 10;
  }
  
  // Clamp confidence 60-100
  confidence = Math.min(100, Math.max(60, confidence));

  // === Firmware Guess (Overlay) ===
  let firmware = "";
  if (northNode && mercury) {
    const nnElement = getElement(northNode.sign);
    const mercuryElement = getElement(mercury.sign);
    if (nnElement === "fire" && mercuryElement === "air") {
      firmware = "ENFP";
    }
  }

  return {
    type: finalType,
    confidence,
    breakdown: { e_i, s_n, t_f, j_p },
    firmware: firmware || undefined,
    reasoning: {
      extraversion: extraversionReasons,
      intuition: intuitionReasons,
      thinking: thinkingReasons,
      judging: judgingReasons,
    },
  };
}
