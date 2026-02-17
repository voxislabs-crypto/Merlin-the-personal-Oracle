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
  
  // North Node in Air/Water/Fire = future-oriented, abstract thinking (BOOSTED)
  if (northNode) {
    const nnElement = getElement(northNode.sign);
    if (nnElement === "air" || nnElement === "fire") {
      nScore += 1.0;
      intuitionReasons.push(`North Node in ${northNode.sign} (${nnElement})`);
    } else if (nnElement === "water") {
      // Water North Node = deep intuition, psychic sensitivity
      nScore += 1.2;
      intuitionReasons.push(`North Node in ${northNode.sign} (water - deep intuition)`);
    }
  }
  
  // Moon in Scorpio/Pisces = profound intuitive capacity (INFJ boosters)
  if (moon) {
    const moonSign = moon.sign.toLowerCase();
    if (moonSign === "scorpio" || moonSign === "pisces") {
      nScore += 0.8;
      intuitionReasons.push(`Moon in ${moon.sign} (intuitive water sign)`);
    } else if (getElement(moon.sign) === "water") {
      nScore += 0.5;
      intuitionReasons.push(`Moon in ${moon.sign} (water element)`);
    }
  }
  
  // Mercury in Air/Fire or 9th/11th/12th house = conceptual thinking
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
    // Mercury in 12th house = unconscious/psychic thinking
    if (mercury.house === 12) {
      nScore += 0.6;
      intuitionReasons.push(`Mercury in 12th house (unconscious mind)`);
    }
  }
  
  // Neptune aspects to Mercury/Moon = psychic/intuitive thinking
  if (neptune && mercury && hasAspect(neptune, "Mercury", ["conjunction", "trine", "sextile"], chart)) {
    nScore += 0.7;
    intuitionReasons.push("Neptune-Mercury soft aspect (intuitive mind)");
  }
  if (neptune && moon && hasAspect(neptune, "Moon", ["conjunction", "trine", "sextile"], chart)) {
    nScore += 0.6;
    intuitionReasons.push("Neptune-Moon soft aspect (psychic sensitivity)");
  }
  
  // Jupiter in Air/Fire = expansive, philosophical
  if (jupiter) {
    const jupiterElement = getElement(jupiter.sign);
    if (jupiterElement === "air" || jupiterElement === "fire") {
      nScore += 0.3;
      intuitionReasons.push(`Jupiter in ${jupiter.sign}`);
    }
  }
  
  // Uranus or Neptune prominent (1st, 9th, 10th, 12th house) = visionary (BOOSTED)
  if (uranus && (uranus.house === 1 || uranus.house === 9 || uranus.house === 10 || uranus.house === 12)) {
    nScore += 0.4;
    intuitionReasons.push(`Uranus in ${uranus.house}${uranus.house === 1 ? 'st' : uranus.house === 9 ? 'th' : uranus.house === 12 ? 'th' : 'th'} house`);
  }
  if (neptune && (neptune.house === 1 || neptune.house === 9 || neptune.house === 10 || neptune.house === 12)) {
    nScore += 0.5; // Boosted from 0.2 to 0.5
    intuitionReasons.push(`Neptune in ${neptune.house}${neptune.house === 1 ? 'st' : neptune.house === 9 ? 'th' : neptune.house === 12 ? 'th' : 'th'} house (visionary)`);
  }
  
  // 12th house stellium = unconscious/mystical orientation
  const twelfthHouseCount = positions.filter((p) => p.house === 12).length;
  if (twelfthHouseCount >= 2) {
    nScore += 0.6;
    intuitionReasons.push(`${twelfthHouseCount} planets in 12th house (mystical)`);
  }
  
  const s_n = nScore > 0.6 ? "N" : "S";

  // === T/F: Thinking vs Feeling ===
  let tScore = 0;
  
  // Mars in Air = logical, strategic action (fire is neutral for T/F)
  if (mars) {
    const marsElement = getElement(mars.sign);
    if (marsElement === "air") {
      tScore += 0.5; // Reduced from 1.0, only air counts
      thinkingReasons.push(`Mars in ${mars.sign} (${marsElement})`);
    }
    // Mars in fire = action-oriented but NOT necessarily thinking-oriented
  }
  
  // Moon in Water = deep feeling/empathy (SUBTRACT from T score)
  if (moon) {
    const moonElement = getElement(moon.sign);
    if (moonElement === "water") {
      tScore -= 0.8; // Water moon strongly favors Feeling
      // Add to reasoning by NOT adding thinking reasons
    } else if (moonElement === "air" || moonElement === "fire") {
      tScore += 0.4;
      thinkingReasons.push(`Moon in ${moon.sign} (${moonElement})`);
    }
  }
  
  // Venus-Moon harmonious aspect = feeling-oriented (subtract from T)
  if (venus && moon && hasAspect(venus, "Moon", ["conjunction", "trine", "sextile"], chart)) {
    tScore -= 0.5; // Increased from -0.3
    // Don't add to thinking reasons
  }
  
  // Venus in water/air = values-oriented/feeling-oriented
  if (venus) {
    const venusElement = getElement(venus.sign);
    if (venusElement === "water" || venusElement === "air") {
      tScore -= 0.4;
      // Favors Feeling
    }
  }
  
  // Neptune aspects to personal planets = empathy/compassion (INFJ marker)
  if (neptune && sun && hasAspect(neptune, "Sun", ["conjunction", "trine", "sextile"], chart)) {
    tScore -= 0.5;
  }
  if (neptune && venus && hasAspect(neptune, "Venus", ["conjunction", "trine", "sextile"], chart)) {
    tScore -= 0.4;
  }
  
  // Saturn strong = analytical structure (but not as strong as before)
  if (saturn && (saturn.house === 1 || saturn.house === 10)) {
    tScore += 0.2; // Reduced from 0.3
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

  // === Override Logic: INFJ/INTJ Special Cases (LOOSENED) ===
  let override = "";
  
  // Count INFJ markers
  let infjMarkers = 0;
  
  // Strong Intuition (N score >= 1.5)
  if (nScore >= 1.5) infjMarkers++;
  
  // Water Moon (Scorpio/Pisces/Cancer)
  if (moon && getElement(moon.sign) === "water") infjMarkers++;
  
  // Neptune in 1st/9th/12th house
  if (neptune && (neptune.house === 1 || neptune.house === 9 || neptune.house === 12)) infjMarkers++;
  
  // North Node in water/air
  if (northNode) {
    const nnElement = getElement(northNode.sign);
    if (nnElement === "water" || nnElement === "air") infjMarkers++;
  }
  
  // Mercury in 1st/12th house (visionary communication)
  if (mercury && (mercury.house === 1 || mercury.house === 12)) infjMarkers++;
  
  // Neptune-Mercury or Neptune-Moon aspect
  if (neptune && mercury && hasAspect(neptune, "Mercury", ["conjunction", "trine", "sextile", "square", "opposition"], chart)) {
    infjMarkers++;
  }
  if (neptune && moon && hasAspect(neptune, "Moon", ["conjunction", "trine", "sextile"], chart)) {
    infjMarkers++;
  }
  
  // INFJ override: >= 3 markers AND (Feeling preference OR near-neutral)
  if (infjMarkers >= 3 && (t_f === "F" || tScore < 0.7)) {
    override = "INFJ";
  }
  
  // Even looser: >= 4 markers with any T/F score
  if (infjMarkers >= 4) {
    override = "INFJ";
  }
  
  // INTJ override: Saturn in 1st or 2nd house AND strong thinking
  if (saturn && (saturn.house === 1 || saturn.house === 2)) {
    if (override !== "INFJ" && (t_f === "T" || tScore > 0.6)) {
      override = "INTJ";
    }
  }

  const rawType = `${e_i}${s_n}${t_f}${j_p}`;
  const finalType = override || rawType;

  // === DEBUG LOGGING ===
  console.log('=== MBTI Fusion Debug ===');
  console.log('Raw scores:', { eScore, nScore, tScore, jScore });
  console.log('Letters:', { e_i, s_n, t_f, j_p });
  console.log('INFJ markers count:', infjMarkers || 'N/A');
  console.log('Raw type:', rawType);
  console.log('Override:', override || 'none');
  console.log('Final type:', finalType);
  console.log('Reasoning:', { 
    intuitionReasons: intuitionReasons.length, 
    thinkingReasons: thinkingReasons.length 
  });
  console.log('========================');

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
