/**
 * MBTI Fusion Engine (Dual-Layer)
 * Computes TWO Myers-Briggs types from astrological birth chart:
 * 1. Hardware Mascot (mask) - Based on Rising + Sun + Mars + 1st/10th house
 * 2. Firmware Inner Core (real self) - Based on Moon + 12th house + Neptune/Pluto
 * 
 * Based on astrological-psychological correlations and empirical patterns
 */

import type { BirthChartData, PlanetPosition } from "@/types/astrology";

export interface MBTIBreakdown {
  e_i: string;
  s_n: string;
  t_f: string;
  j_p: string;
  reasoning: {
    extraversion: string[];
    intuition: string[];
    thinking: string[];
    judging: string[];
  };
}

export interface MBTILayerResult {
  type: string;
  confidence: number;
  breakdown: MBTIBreakdown;
  layer: 'hardware' | 'firmware';
}

export interface MBTIDetails {
  type: string; // Final type (firmware if override, else hardware)
  confidence: number;
  breakdown: {
    e_i: string;
    s_n: string;
    t_f: string;
    j_p: string;
  };
  hardware: MBTILayerResult;
  firmware: MBTILayerResult;
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
 * Compute MBTI type from birth chart data - SINGLE LAYER (kept for backwards compatibility)
 */
export function computeMBTI(chart: BirthChartData): MBTIDetails {
  // Use new dual-layer engine and return firmware as primary
  const dualResult = computeMBTIDual(chart);
  
  return {
    type: dualResult.firmware.type,
    confidence: dualResult.firmware.confidence,
    breakdown: dualResult.firmware.breakdown as any,
    hardware: dualResult.hardware,
    firmware: dualResult.firmware,
    reasoning: {
      extraversion: dualResult.firmware.breakdown.reasoning.extraversion,
      intuition: dualResult.firmware.breakdown.reasoning.intuition,
      thinking: dualResult.firmware.breakdown.reasoning.thinking,
      judging: dualResult.firmware.breakdown.reasoning.judging,
    },
  };
}

/**
 * Compute DUAL MBTI layers from birth chart data
 * Returns: { hardware: Mascot, firmware: InnerCore }
 * This is the preferred function for new implementations
 */
export function computeMBTIDual(chart: BirthChartData): {
  hardware: MBTILayerResult;
  firmware: MBTILayerResult;
  type: string; // Final merged type (firmware, with INFJ override from this function)
  confidence: number;
} {
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
  const pluto = findPlanet(positions, "Pluto");
  const northNode = findPlanet(positions, "True Node") || findPlanet(positions, "North Node");

  // ============================================================================
  // HARDWARE MASCOT LAYER: Rising + Sun + Mars + 1st/10th house (external)
  // ============================================================================
  const hardware = computeHardwareLayer({
    ascendant,
    mc,
    sun,
    moon,
    mercury,
    venus,
    mars,
    jupiter,
    saturn,
    uranus,
    neptune,
    northNode,
    positions,
    chart,
  });

  // ============================================================================
  // FIRMWARE INNER CORE LAYER: Moon + 12th house + Neptune/Pluto (internal)
  // ============================================================================
  const firmware = computeFirmwareLayer({
    ascendant,
    mc,
    sun,
    moon,
    mercury,
    venus,
    mars,
    jupiter,
    saturn,
    uranus,
    neptune,
    pluto,
    northNode,
    positions,
    chart,
  });

  // ============================================================================
  // INFJ Override: If firmware is INFJ, keep it; otherwise check markers for override
  // ============================================================================
  let finalType = firmware.type;
  let finalConfidence = firmware.confidence;

  // If firmware is already INFJ, it stays
  if (firmware.type === "INFJ") {
    finalType = "INFJ";
    finalConfidence = firmware.confidence;
  } else {
    // Count INFJ markers in firmware layer
    let infjMarkers = 0;
    
    // Strong intuition (N scored high)
    if (firmware.breakdown.s_n === "N") infjMarkers++;
    
    // Water moon
    if (moon && getElement(moon.sign) === "water") infjMarkers++;
    
    // Neptune in 12th house (core)
    if (neptune && neptune.house === 12) infjMarkers++;
    
    // Mercury in 12th house (unconscious communication)
    if (mercury && mercury.house === 12) infjMarkers++;
    
    // Feeling preference in firmware
    if (firmware.breakdown.t_f === "F") infjMarkers++;
    
    // Force INFJ if 4+ markers align
    if (infjMarkers >= 4) {
      finalType = "INFJ";
      finalConfidence = Math.min(firmware.confidence + 10, 100);
    }
  }

  console.log('=== MBTI Dual Layer Debug ===');
  console.log('Hardware (Mascot):', hardware.type, `(${hardware.confidence}%)`);
  console.log('Firmware (InnerCore):', firmware.type, `(${firmware.confidence}%)`);
  console.log('Final override:', finalType);
  console.log('=============================');

  return {
    hardware,
    firmware,
    type: finalType,
    confidence: finalConfidence,
  };
}

/**
 * Compute Hardware Mascot Layer (external face)
 * Weighted toward: Rising, Sun, Mars, 1st house, 10th house
 */
function computeHardwareLayer(params: {
  ascendant: any;
  mc: any;
  sun?: PlanetPosition;
  moon?: PlanetPosition;
  mercury?: PlanetPosition;
  venus?: PlanetPosition;
  mars?: PlanetPosition;
  jupiter?: PlanetPosition;
  saturn?: PlanetPosition;
  uranus?: PlanetPosition;
  neptune?: PlanetPosition;
  northNode?: PlanetPosition;
  positions: PlanetPosition[];
  chart: BirthChartData;
}): MBTILayerResult {
  const {
    ascendant,
    mc,
    sun,
    moon,
    mercury,
    mars,
    jupiter,
    saturn,
    uranus,
    positions,
    chart,
  } = params;

  const extraversionReasons: string[] = [];
  const intuitionReasons: string[] = [];
  const thinkingReasons: string[] = [];
  const judgingReasons: string[] = [];

  // === E/I: Extraversion vs Introversion ===
  // HEAVY weight on Ascendant + Mars element
  let eScore = 0;

  // Rising in Fire/Air = STRONGEST extroversion indicator
  const ascElement = getElement(ascendant.sign);
  if (ascElement === "fire") {
    eScore += 1.5; // Fire rising = very extroverted
    extraversionReasons.push(`${ascendant.sign} Ascendant (fire - outgoing)`);
  } else if (ascElement === "air") {
    eScore += 1.2; // Air rising = socially oriented
    extraversionReasons.push(`${ascendant.sign} Ascendant (air - communicative)`);
  } else if (ascElement === "water" || ascElement === "earth") {
    eScore -= 0.5; // Water/Earth rising = introverted
    extraversionReasons.push(`${ascendant.sign} Ascendant (reserved)`);
  }

  // Mars in Fire/Air = action-oriented, confrontational (masks introversion)
  if (mars) {
    const marsElement = getElement(mars.sign);
    if (marsElement === "fire") {
      eScore += 1.0; // Mars in fire = assertive, extroverted action
      extraversionReasons.push(`Mars in ${mars.sign} (fire - direct action)`);
    } else if (marsElement === "air") {
      eScore += 0.7; // Mars in air = verbal, debating
      extraversionReasons.push(`Mars in ${mars.sign} (air - verbal)`);
    }
  }

  // 1st house planets = strong self-projection (mask focus)
  const firstHouseCount = positions.filter((p) => p.house === 1).length;
  if (firstHouseCount >= 2) {
    eScore += 0.6;
    extraversionReasons.push(`${firstHouseCount} planets in 1st house (mask)`);
  }

  // Sun in Fire = extroverted ego
  if (sun) {
    const sunElement = getElement(sun.sign);
    if (sunElement === "fire") {
      eScore += 0.5;
      extraversionReasons.push(`Sun in ${sun.sign} (fire)`);
    }
  }

  const hardwareE_I = eScore > 0.5 ? "E" : "I";

  // === S/N: Sensing vs Intuition (Hardware) ===
  // For the mask, S/N is moderate - focus on present moment vs future ideas
  let nScore = 0;

  // Mercury in Air/Fire + 9th/11th house = communicative intuition
  if (mercury) {
    const mercuryElement = getElement(mercury.sign);
    if (mercuryElement === "air") {
      nScore += 0.8;
      intuitionReasons.push(
        `Mercury in ${mercury.sign} (air - conceptual communication)`
      );
    } else if (mercuryElement === "fire") {
      nScore += 0.5;
      intuitionReasons.push(`Mercury in ${mercury.sign} (fire - bold ideas)`);
    }

    if (mercury.house === 9 || mercury.house === 11) {
      nScore += 0.5;
      intuitionReasons.push(`Mercury in ${mercury.house}th house (vision)`);
    }
  }

  // Sun in Fire/Air = present, action-oriented (S baseline, but air adds N)
  if (sun) {
    const sunElement = getElement(sun.sign);
    if (sunElement === "fire") {
      nScore += 0.3; // Fire sun = slight intuition, mostly sensing
      intuitionReasons.push(`Sun in ${sun.sign} (fire)`);
    }
  }

  // Neptune/Uranus in 1st/10th house = visionary mask (only if prominent)
  if (uranus && (uranus.house === 1 || uranus.house === 10)) {
    nScore += 0.7;
    intuitionReasons.push(`Uranus in ${uranus.house}th house (visionary)`);
  }

  const hardwareS_N = nScore > 0.5 ? "N" : "S";

  // === T/F: Thinking vs Feeling (Hardware) ===
  // Mars in Air = logical, strategic
  let tScore = 0;

  if (mars) {
    const marsElement = getElement(mars.sign);
    if (marsElement === "air") {
      tScore += 0.8; // Logical action
      thinkingReasons.push(`Mars in ${mars.sign} (air - logical action)`);
    } else if (marsElement === "fire") {
      tScore += 0.3; // Fire mars = assertive but not necessarily thinking
      thinkingReasons.push(`Mars in ${mars.sign} (fire - assertive)`);
    }
  }

  // Saturn in 1st/10th = structured, professional demeanor
  if (saturn && (saturn.house === 1 || saturn.house === 10)) {
    tScore += 0.4;
    thinkingReasons.push(`Saturn in ${saturn.house}th house (controlled)`);
  }

  // Moon in water = feeling (subtract from T)
  if (moon) {
    const moonElement = getElement(moon.sign);
    if (moonElement === "water") {
      tScore -= 0.5; // Water moon = emotional underneath
    }
  }

  // Venus in fire/air = values-oriented feeling
  if (params.venus) {
    const venusElement = getElement(params.venus.sign);
    if (venusElement === "water") {
      tScore -= 0.3;
    }
  }

  const hardwareT_F = tScore > 0.5 ? "T" : "F";

  // === J/P: Judging vs Perceiving (Hardware) ===
  // Focus on MC + 10th house (career/public persona = structured)
  let jScore = 0;

  // MC in Cardinal = structured public image
  const mcMode = getMode(mc.sign);
  if (mcMode === "cardinal") {
    jScore += 1.0;
    judgingReasons.push(`MC in ${mc.sign} (cardinal - goal-oriented)`);
  }

  // Saturn cardinal = disciplined
  if (saturn) {
    const saturnMode = getMode(saturn.sign);
    if (saturnMode === "cardinal") {
      jScore += 0.5;
      judgingReasons.push(`Saturn in ${saturn.sign} (cardinal - ordered)`);
    }
  }

  // 10th house planets = achievement/structure focus
  const tenthHouseCount = positions.filter((p) => p.house === 10).length;
  if (tenthHouseCount >= 2) {
    jScore += 0.5;
    judgingReasons.push(`${tenthHouseCount} planets in 10th house`);
  }

  const hardwareJ_P = jScore > 0.5 ? "J" : "P";

  // Compute hardware MBTI type
  const hardwareType = `${hardwareE_I}${hardwareS_N}${hardwareT_F}${hardwareJ_P}`;

  // Confidence for hardware (based on strength of external indicators)
  let hardwareConfidence = 70;
  if (Math.abs(eScore) > 1.5) hardwareConfidence += 10;
  if (mcMode === "cardinal") hardwareConfidence += 5;
  hardwareConfidence = Math.min(100, hardwareConfidence);

  return {
    type: hardwareType,
    confidence: hardwareConfidence,
    breakdown: {
      e_i: hardwareE_I,
      s_n: hardwareS_N,
      t_f: hardwareT_F,
      j_p: hardwareJ_P,
      reasoning: {
        extraversion: extraversionReasons,
        intuition: intuitionReasons,
        thinking: thinkingReasons,
        judging: judgingReasons,
      },
    },
    layer: "hardware",
  };
}

/**
 * Compute Firmware Inner Core Layer (real self)
 * Weighted toward: Moon, 12th house, Neptune, Pluto, North Node
 */
function computeFirmwareLayer(params: {
  ascendant: any;
  mc: any;
  sun?: PlanetPosition;
  moon?: PlanetPosition;
  mercury?: PlanetPosition;
  venus?: PlanetPosition;
  mars?: PlanetPosition;
  jupiter?: PlanetPosition;
  saturn?: PlanetPosition;
  uranus?: PlanetPosition;
  neptune?: PlanetPosition;
  pluto?: PlanetPosition;
  northNode?: PlanetPosition;
  positions: PlanetPosition[];
  chart: BirthChartData;
}): MBTILayerResult {
  const {
    ascendant,
    moon,
    mercury,
    venus,
    mars,
    jupiter,
    saturn,
    uranus,
    neptune,
    pluto,
    northNode,
    positions,
    chart,
  } = params;

  const extraversionReasons: string[] = [];
  const intuitionReasons: string[] = [];
  const thinkingReasons: string[] = [];
  const judgingReasons: string[] = [];

  // === E/I: Introversion (with possible E undertone from Moon) ===
  let eScore = 0;

  // Moon in water = introspective core
  if (moon) {
    const moonElement = getElement(moon.sign);
    if (moonElement === "water") {
      eScore -= 1.0; // Strongly introverted
      extraversionReasons.push(`Moon in ${moon.sign} (water - introspective)`);
    } else if (moonElement === "earth") {
      eScore -= 0.5;
      extraversionReasons.push(`Moon in ${moon.sign} (earth - reserved)`);
    } else if (moonElement === "air") {
      eScore += 0.3; // Air moon adds slight extraversion
      extraversionReasons.push(`Moon in ${moon.sign} (air - curious)`);
    }
  }

  // 12th house planets = hidden, introverted nature
  const twelfthHouseCount = positions.filter((p) => p.house === 12).length;
  if (twelfthHouseCount >= 2) {
    eScore -= 0.8;
    extraversionReasons.push(`${twelfthHouseCount} planets in 12th house (hidden)`);
  }

  // Neptune in 12th = intensely private
  if (neptune && neptune.house === 12) {
    eScore -= 0.7;
    extraversionReasons.push(`Neptune in 12th house (mystical withdraw)`);
  }

  const firmwareE_I = eScore > 0.3 ? "E" : "I";

  // === S/N: Intuition (boosted for firmware core) ===
  let nScore = 0;

  // North Node = soul's direction (intuitive)
  if (northNode) {
    const nnElement = getElement(northNode.sign);
    if (nnElement === "water") {
      nScore += 1.5; // South Node = air/fire (needs water intuition)
      intuitionReasons.push(`North Node in ${northNode.sign} (psychic growth)`);
    } else if (nnElement === "air") {
      nScore += 1.2;
      intuitionReasons.push(`North Node in ${northNode.sign} (intellectual intuition)`);
    }
  }

  // Moon in Scorpio/Pisces = profound psychic capacity
  if (moon) {
    const moonSign = moon.sign.toLowerCase();
    if (moonSign === "scorpio") {
      nScore += 1.0;
      intuitionReasons.push(`Moon in Scorpio (deep psychological intuition)`);
    } else if (moonSign === "pisces") {
      nScore += 1.2;
      intuitionReasons.push(`Moon in Pisces (mystical intuition)`);
    } else if (getElement(moon.sign) === "water") {
      nScore += 0.8;
      intuitionReasons.push(`Moon in ${moon.sign} (emotional intuition)`);
    }
  }

  // Neptune prominent = mystical inner world
  if (neptune && (neptune.house === 1 || neptune.house === 9 || neptune.house === 12)) {
    nScore += 1.0;
    intuitionReasons.push(`Neptune in ${neptune.house}th house (mystical)`);
  }

  // Mercury in 12th = unconscious knowledge
  if (mercury && mercury.house === 12) {
    nScore += 0.7;
    intuitionReasons.push(`Mercury in 12th house (deep knowing)`);
  }

  // Pluto prominent = transformational insight
  if (pluto && (pluto.house === 8 || pluto.house === 12)) {
    nScore += 0.6;
    intuitionReasons.push(`Pluto in ${pluto.house}th house (transformational insight)`);
  }

  const firmwareS_N = nScore > 0.6 ? "N" : "S";

  // === T/F: Feeling (boosted for firmware core) ===
  let tScore = 0;

  // Moon in water = deep empathy, strong feeling
  if (moon) {
    const moonElement = getElement(moon.sign);
    if (moonElement === "water") {
      tScore -= 1.2; // Strongly feeling
      // Don't add to thinking reasons
    } else if (moonElement === "earth") {
      tScore -= 0.4; // Earth moon = grounded feeling
    } else if (moonElement === "air") {
      tScore += 0.2; // Air moon = slight thinking tendency
      thinkingReasons.push(`Moon in ${moon.sign} (air - detached)`);
    }
  }

  // Neptune aspects to personal planets = compassion
  if (neptune && mercury) {
    if (
      hasAspect(neptune, "Mercury", ["conjunction", "trine", "sextile"], chart)
    ) {
      tScore -= 0.5; // Intuitive compassion over logic
    }
  }

  if (neptune && moon) {
    if (hasAspect(neptune, "Moon", ["conjunction", "trine", "sextile"], chart)) {
      tScore -= 0.6; // Mystical emotional understanding
    }
  }

  // Pluto aspects = psychological depth, introspection (feeling tendency)
  if (pluto && moon) {
    if (hasAspect(pluto, "Moon", ["conjunction", "trine", "sextile"], chart)) {
      tScore -= 0.4;
    }
  }

  // Venus in water = values emotional connection
  if (venus) {
    const venusElement = getElement(venus.sign);
    if (venusElement === "water") {
      tScore -= 0.4;
    }
  }

  const firmwareT_F = tScore > 0.4 ? "T" : "F";

  // === J/P: Perceiving (with possible J from Saturn/Uranus) ===
  let jScore = 0;

  // 12th house = mutable/mystical (P tendency)
  if (twelfthHouseCount >= 2) {
    jScore -= 0.6; // 12th house = intuitive, flexible (P)
    judgingReasons.push(`${twelfthHouseCount} planets in 12th house (fluid)`);
  }

  // Pluto in 12th = hidden transformation (P - openness to change)
  if (pluto && pluto.house === 12) {
    jScore -= 0.5;
    judgingReasons.push(`Pluto in 12th house (hidden dynamism)`);
  }

  // Neptune = flexible, adaptable (P)
  if (neptune) {
    const neptuneMode = getMode(neptune.sign);
    if (neptuneMode !== "cardinal") {
      jScore -= 0.4;
      judgingReasons.push(`Neptune in mutable sign (adaptable)`);
    }
  }

  // Saturn in 12th/1st = structured but introspective
  if (saturn && (saturn.house === 1 || saturn.house === 12)) {
    jScore += 0.3; // Some structure to inner world
    judgingReasons.push(`Saturn in ${saturn.house}th house`);
  }

  const firmwareJ_P = jScore > 0.3 ? "J" : "P";

  // Compute firmware MBTI type
  const firmwareType = `${firmwareE_I}${firmwareS_N}${firmwareT_F}${firmwareJ_P}`;

  // Confidence for firmware
  let firmwareConfidence = 75;
  if (
    moon &&
    (getElement(moon.sign) === "water" || moon.sign.toLowerCase() === "scorpio")
  ) {
    firmwareConfidence += 10;
  }
  if (neptune && neptune.house === 12) firmwareConfidence += 8;
  if (nScore > 1.5) firmwareConfidence += 5;
  firmwareConfidence = Math.min(100, firmwareConfidence);

  return {
    type: firmwareType,
    confidence: firmwareConfidence,
    breakdown: {
      e_i: firmwareE_I,
      s_n: firmwareS_N,
      t_f: firmwareT_F,
      j_p: firmwareJ_P,
      reasoning: {
        extraversion: extraversionReasons,
        intuition: intuitionReasons,
        thinking: thinkingReasons,
        judging: judgingReasons,
      },
    },
    layer: "firmware",
  };
}
