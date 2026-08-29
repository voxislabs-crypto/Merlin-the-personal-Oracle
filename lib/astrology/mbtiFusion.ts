/**
 * MBTI Fusion Engine (Dual-Layer)
 * Computes TWO Myers-Briggs types from astrological birth chart:
 * 1. Hardware Mascot (mask) - Based on Rising + Sun + Mars + 1st/10th house
 * 2. Firmware Inner Core (real self) - Based on Moon + 12th house + Neptune/Pluto
 * 
 * Based on astrological-psychological correlations and empirical patterns
 */

import type { BirthChartData, PlanetPosition } from "@/types/astrology";
import { isMbtiDebugEnabled } from '@/lib/debug';

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

export type MbtiFusionOptions = {
  /** When true, natal retrogrades nudge Core (firmware) toward inner process. Mask is unchanged. */
  retrogradeOverlay?: boolean;
};

export interface MBTIDetails {
  type: string; // Core type (firmware)
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
function isNatalRetrograde(planet?: PlanetPosition): boolean {
  if (!planet) return false;
  if (typeof planet.retrograde === 'boolean') return planet.retrograde;
  if (typeof planet.speed === 'number' && Number.isFinite(planet.speed)) return planet.speed < 0;
  return false;
}

type RetrogradeBoost = { nBoost: number; iBoost: number; fBoost: number; pBoost: number };

function emptyBoost(): RetrogradeBoost {
  return { nBoost: 0, iBoost: 0, fBoost: 0, pBoost: 0 };
}

function retrogradeBoostFor(planet?: PlanetPosition): RetrogradeBoost {
  if (!isNatalRetrograde(planet)) return emptyBoost();
  const name = (planet?.name || '').toLowerCase();
  // Mean/true node is always retrograde — skip so the overlay isn't on for every chart.
  if (name.includes('node')) return emptyBoost();
  if (name === 'mercury' || name === 'venus') {
    return { nBoost: 0.3, iBoost: 0.1, fBoost: 0.2, pBoost: 0.4 };
  }
  if (name === 'mars') {
    return { nBoost: 0, iBoost: 0.3, fBoost: 0, pBoost: 0.25 };
  }
  if (name === 'neptune' || name === 'pluto' || name === 'uranus') {
    return { nBoost: 0.4, iBoost: 0.1, fBoost: 0.2, pBoost: 0.35 };
  }
  if (name === 'jupiter') {
    return { nBoost: 0.15, iBoost: 0.05, fBoost: 0, pBoost: 0.15 };
  }
  if (name === 'saturn') {
    return { nBoost: 0, iBoost: 0.15, fBoost: 0, pBoost: 0 };
  }
  return emptyBoost();
}

function sumRetrogradeBoosts(planets: Array<PlanetPosition | undefined>): RetrogradeBoost {
  return planets.reduce<RetrogradeBoost>((acc, planet) => {
    const next = retrogradeBoostFor(planet);
    return {
      nBoost: acc.nBoost + next.nBoost,
      iBoost: acc.iBoost + next.iBoost,
      fBoost: acc.fBoost + next.fBoost,
      pBoost: acc.pBoost + next.pBoost,
    };
  }, emptyBoost());
}

export function listNatalRetrogrades(positions: PlanetPosition[] = []): string[] {
  return positions
    .filter((planet) => isNatalRetrograde(planet) && !planet.name.toLowerCase().includes('node'))
    .map((planet) => planet.name);
}

export function computeMBTI(chart: BirthChartData, options?: MbtiFusionOptions): MBTIDetails {
  // Use new dual-layer engine and return firmware as primary
  const dualResult = computeMBTIDual(chart, options);
  
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
export function computeMBTIDual(chart: BirthChartData, options?: MbtiFusionOptions): {
  hardware: MBTILayerResult;
  firmware: MBTILayerResult;
  type: string; // Core type (firmware) — same as Self → You
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
    retrogradeOverlay: Boolean(options?.retrogradeOverlay),
  });

  // Core type is firmware as scored — do not overwrite other types with INFJ.
  if (isMbtiDebugEnabled()) {
    console.log('=== MBTI Dual Layer Debug ===');
    console.log('Hardware (Mascot):', hardware.type, `(${hardware.confidence}%)`);
    console.log('Firmware (InnerCore):', firmware.type, `(${firmware.confidence}%)`);
    console.log('=============================');
  }

  return {
    hardware,
    firmware,
    type: firmware.type,
    confidence: firmware.confidence,
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
  // Mask layer: Rising sign is the primary first-impression driver.
  let eScore = 0;

  const ascElement = getElement(ascendant.sign);
  if (ascElement === "fire" || ascElement === "air") {
    eScore += 1;
    extraversionReasons.push(`${ascendant.sign} Ascendant (outgoing mask)`);
  } else {
    eScore -= 1;
    extraversionReasons.push(`${ascendant.sign} Ascendant (reserved mask)`);
  }

  // Only angular self-projection planets in the 1st house adjust the rising baseline.
  const firstHouseProjectors = positions.filter(
    (p) =>
      p.house === 1 &&
      ["Sun", "Mars", "Jupiter", "Venus"].includes(p.name)
  );
  if (firstHouseProjectors.length > 0) {
    eScore += firstHouseProjectors.length * 0.35;
    extraversionReasons.push(
      `${firstHouseProjectors.map((p) => p.name).join(", ")} in 1st house (visible projection)`
    );
  }

  // Mars on an angle can add assertive energy to the mask, but not from cadent houses.
  if (mars && (mars.house === 1 || mars.house === 10)) {
    const marsElement = getElement(mars.sign);
    if (marsElement === "fire") {
      eScore += 0.4;
      extraversionReasons.push(`Mars in ${mars.sign} on angle (assertive mask)`);
    } else if (marsElement === "air") {
      eScore += 0.3;
      extraversionReasons.push(`Mars in ${mars.sign} on angle (verbal mask)`);
    }
  }

  const hardwareE_I = eScore > 0 ? "E" : "I";

  // === S/N: Sensing vs Intuition (Hardware) ===
  // Mask communication style: Mercury leads; Mars fire tilts sensing.
  let nScore = 0;

  if (mars) {
    const marsElement = getElement(mars.sign);
    if (marsElement === "fire" || marsElement === "earth") {
      nScore -= 0.35;
      intuitionReasons.push(`Mars in ${mars.sign} (concrete/action mask)`);
    } else if (marsElement === "air") {
      nScore += 0.25;
      intuitionReasons.push(`Mars in ${mars.sign} (conceptual mask)`);
    }
  }

  if (mercury) {
    const mercuryElement = getElement(mercury.sign);
    if (mercuryElement === "air") {
      nScore += 0.8;
      intuitionReasons.push(`Mercury in ${mercury.sign} (abstract communicator)`);
    } else if (mercuryElement === "fire") {
      nScore += 0.45;
      intuitionReasons.push(`Mercury in ${mercury.sign} (idea-forward communicator)`);
    } else if (mercuryElement === "earth") {
      nScore -= 0.25;
      intuitionReasons.push(`Mercury in ${mercury.sign} (precise communicator)`);
    }

    if (mercury.house === 9 || mercury.house === 11) {
      nScore += 0.65;
      intuitionReasons.push(`Mercury in ${mercury.house}th house (pattern/network lens)`);
    }
  }

  if (uranus && (uranus.house === 1 || uranus.house === 10)) {
    nScore += 0.7;
    intuitionReasons.push(`Uranus in ${uranus.house}th house (visionary mask)`);
  }

  const hardwareS_N = nScore > 0 ? "N" : "S";

  // === T/F: Thinking vs Feeling (Hardware) ===
  // How the mask reasons in public: Mercury and Mars lead; Moon stays in firmware.
  let tScore = 0;

  if (mercury) {
    const mercuryElement = getElement(mercury.sign);
    if (mercuryElement === "air" || mercuryElement === "earth") {
      tScore += 0.75;
      thinkingReasons.push(`Mercury in ${mercury.sign} (analytical mask)`);
    } else if (mercuryElement === "fire") {
      tScore += 0.35;
      thinkingReasons.push(`Mercury in ${mercury.sign} (decisive mask)`);
    } else if (mercuryElement === "water") {
      tScore -= 0.35;
      thinkingReasons.push(`Mercury in ${mercury.sign} (empathic mask)`);
    }
  }

  if (mars) {
    const marsElement = getElement(mars.sign);
    if (marsElement === "air") {
      tScore += 0.55;
      thinkingReasons.push(`Mars in ${mars.sign} (strategic mask)`);
    } else if (marsElement === "fire") {
      tScore += 0.2;
      thinkingReasons.push(`Mars in ${mars.sign} (direct mask)`);
    }
  }

  if (saturn && (saturn.house === 1 || saturn.house === 10)) {
    tScore += 0.35;
    thinkingReasons.push(`Saturn in ${saturn.house}th house (controlled mask)`);
  }

  if (params.venus) {
    const venusElement = getElement(params.venus.sign);
    if (venusElement === "water") {
      tScore -= 0.25;
      thinkingReasons.push(`Venus in ${params.venus.sign} (relational mask)`);
    }
  }

  const hardwareT_F = tScore > 0 ? "T" : "F";

  // === J/P: Judging vs Perceiving (Hardware) ===
  // Public persona structure: MC modality is primary for the mask.
  let jScore = 0;

  const mcMode = getMode(mc.sign);
  if (mcMode === "cardinal") {
    jScore += 1;
    judgingReasons.push(`MC in ${mc.sign} (cardinal - structured public image)`);
  } else {
    jScore -= 0.75;
    judgingReasons.push(`MC in ${mc.sign} (${mcMode} - adaptive public image)`);
  }

  if (saturn) {
    const saturnMode = getMode(saturn.sign);
    if (saturnMode === "cardinal") {
      jScore += 0.35;
      judgingReasons.push(`Saturn in ${saturn.sign} (cardinal discipline)`);
    }
  }

  const hardwareJ_P = jScore > 0 ? "J" : "P";

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
  retrogradeOverlay?: boolean;
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
    retrogradeOverlay = false,
  } = params;

  const rxBodies = [mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto];
  const rxBoost = retrogradeOverlay ? sumRetrogradeBoosts(rxBodies) : emptyBoost();
  const rxNames = retrogradeOverlay
    ? rxBodies.filter((p) => isNatalRetrograde(p) && !String(p?.name || '').toLowerCase().includes('node')).map((p) => p!.name)
    : [];

  const extraversionReasons: string[] = [];
  const intuitionReasons: string[] = [];
  const thinkingReasons: string[] = [];
  const judgingReasons: string[] = [];

  // === E/I: Moon 35%, Ascendant 25%, Sun 20%, Mercury 20% ===
  // Water/earth vote I; fire/air vote E. No sign hard-locks (those overfit one chart).
  const twelfthHouseCount = positions.filter((p) => p.house === 12).length;

  const moonVote: 'I' | 'E' =
    getElement(moon?.sign ?? '') === 'water' || getElement(moon?.sign ?? '') === 'earth' ? 'I' : 'E';
  const ascVote: 'I' | 'E' =
    getElement(ascendant?.sign ?? '') === 'water' || getElement(ascendant?.sign ?? '') === 'earth' ? 'I' : 'E';
  const sunVote: 'I' | 'E' =
    getElement(params.sun?.sign ?? '') === 'fire' || getElement(params.sun?.sign ?? '') === 'air' ? 'E' : 'I';
  const mercuryVote: 'I' | 'E' =
    getElement(mercury?.sign ?? '') === 'air' || getElement(mercury?.sign ?? '') === 'fire' ? 'E' : 'I';

  const iWeight =
    (moonVote === 'I' ? 0.35 : 0) +
    (ascVote === 'I' ? 0.25 : 0) +
    (sunVote === 'I' ? 0.2 : 0) +
    (mercuryVote === 'I' ? 0.2 : 0) +
    rxBoost.iBoost;

  const firmwareE_I = iWeight >= 0.5 ? 'I' : 'E';
  extraversionReasons.push(
    `Moon: ${moonVote} (35%), Asc: ${ascVote} (25%), Sun: ${sunVote} (20%), Mercury: ${mercuryVote} (20%) → ${firmwareE_I}`
  );
  if (rxNames.length) {
    extraversionReasons.push(`Retrograde overlay using ${rxNames.join(', ')} Rx`);
  }
  if (isMbtiDebugEnabled()) {
    console.log(
      `[MBTI E/I Firmware] Moon: ${moonVote} (35%), Asc: ${ascVote} (25%), Sun: ${sunVote} (20%), Mercury: ${mercuryVote} (20%) → I-weight: ${iWeight.toFixed(2)} → ${firmwareE_I}`
    );
  }

  // === S/N: Moon + Mercury vote; N is not the default ===
  let nScore = 0;

  if (moon) {
    const moonElement = getElement(moon.sign);
    const moonSign = moon.sign.toLowerCase();
    if (moonSign === 'scorpio') {
      nScore += 1.0;
      intuitionReasons.push('Moon in Scorpio (psychological intuition)');
    } else if (moonSign === 'pisces') {
      nScore += 0.9;
      intuitionReasons.push('Moon in Pisces (imaginal intuition)');
    } else if (moonElement === 'water' || moonElement === 'air') {
      nScore += 0.45;
      intuitionReasons.push(`Moon in ${moon.sign} (${moonElement} — pattern-oriented)`);
    } else if (moonElement === 'earth') {
      nScore -= 0.55;
      intuitionReasons.push(`Moon in ${moon.sign} (earth — concrete inner world)`);
    } else if (moonElement === 'fire') {
      nScore += 0.15;
      intuitionReasons.push(`Moon in ${moon.sign} (fire — impressionistic)`);
    }
  }

  if (mercury) {
    const mercuryElement = getElement(mercury.sign);
    if (mercuryElement === 'air') {
      nScore += 0.5;
      intuitionReasons.push(`Mercury in ${mercury.sign} (abstract mind)`);
    } else if (mercuryElement === 'fire') {
      nScore += 0.25;
      intuitionReasons.push(`Mercury in ${mercury.sign} (idea-forward mind)`);
    } else if (mercuryElement === 'earth') {
      nScore -= 0.25;
      intuitionReasons.push(`Mercury in ${mercury.sign} (precise, sensing mind)`);
    } else if (mercuryElement === 'water') {
      nScore += 0.2;
      intuitionReasons.push(`Mercury in ${mercury.sign} (felt knowing)`);
    }
    if (mercury.house === 9 || mercury.house === 11) {
      nScore += 0.35;
      intuitionReasons.push(`Mercury in ${mercury.house}th house (pattern/network lens)`);
    }
  }

  if (northNode) {
    const nnElement = getElement(northNode.sign);
    if (nnElement === 'air' || nnElement === 'water') {
      nScore += 0.4;
      intuitionReasons.push(`North Node in ${northNode.sign} (growth through pattern)`);
    } else if (nnElement === 'earth') {
      nScore -= 0.3;
      intuitionReasons.push(`North Node in ${northNode.sign} (growth through the concrete)`);
    }
  }

  if (moon && moon.house === 8) {
    nScore += 0.35;
    intuitionReasons.push('Moon in 8th house (depth perception)');
  }

  if (rxBoost.nBoost) {
    nScore += rxBoost.nBoost;
    intuitionReasons.push('Retrograde overlay (inner processing, not outer show)');
  }

  const firmwareS_N = nScore > 0.45 ? 'N' : 'S';

  // === T/F: Moon (values) + Mercury (how the inner mind decides) ===
  let tScore = 0;

  if (moon) {
    const moonElement = getElement(moon.sign);
    if (moonElement === 'water') {
      tScore -= 0.8;
      thinkingReasons.push(`Moon in ${moon.sign} (water — felt values)`);
    } else if (moonElement === 'air') {
      tScore += 0.5;
      thinkingReasons.push(`Moon in ${moon.sign} (air — detached values)`);
    } else if (moonElement === 'fire') {
      tScore += 0.1;
      thinkingReasons.push(`Moon in ${moon.sign} (fire — heat over analysis)`);
    } else if (moonElement === 'earth') {
      tScore += 0.15;
      thinkingReasons.push(`Moon in ${moon.sign} (earth — pragmatic values)`);
    }
  }

  if (mercury) {
    const mercuryElement = getElement(mercury.sign);
    if (mercuryElement === 'air' || mercuryElement === 'earth') {
      tScore += 0.55;
      thinkingReasons.push(`Mercury in ${mercury.sign} (analytical inner mind)`);
    } else if (mercuryElement === 'fire') {
      tScore += 0.2;
      thinkingReasons.push(`Mercury in ${mercury.sign} (decisive inner mind)`);
    } else if (mercuryElement === 'water') {
      tScore -= 0.4;
      thinkingReasons.push(`Mercury in ${mercury.sign} (empathic inner mind)`);
    }
  }

  if (venus) {
    const venusElement = getElement(venus.sign);
    if (venusElement === 'water') {
      tScore -= 0.35;
      thinkingReasons.push(`Venus in ${venus.sign} (relational values)`);
    }
  }

  if (neptune && moon && hasAspect(neptune, 'Moon', ['conjunction', 'trine', 'sextile'], chart)) {
    tScore -= 0.25;
    thinkingReasons.push('Neptune–Moon (felt over formal logic)');
  }

  if (rxBoost.fBoost) {
    tScore -= rxBoost.fBoost;
    thinkingReasons.push('Retrograde overlay (inner values over outer performance)');
  }
  if (rxBoost.iBoost) {
    extraversionReasons.push('Retrograde overlay (energy turned inward)');
  }

  const firmwareT_F = tScore > 0.35 ? 'T' : 'F';

  // === J/P: inner close-the-loop vs keep-options-open ===
  let jScore = 0;

  if (moon) {
    const moonMode = getMode(moon.sign);
    if (moonMode === 'fixed') {
      jScore += 0.85;
      judgingReasons.push(`Moon in ${moon.sign} (fixed — inner close-the-loop)`);
    } else if (moonMode === 'cardinal') {
      jScore += 0.35;
      judgingReasons.push(`Moon in ${moon.sign} (cardinal — inner initiative)`);
    } else if (moonMode === 'mutable') {
      jScore -= 0.55;
      judgingReasons.push(`Moon in ${moon.sign} (mutable — keep options open)`);
    }
  }

  // Saturn aspecting Moon = structured emotional life = J in inner world
  if (saturn && moon) {
    if (hasAspect(saturn, 'Moon', ['conjunction', 'trine', 'sextile', 'square'], chart)) {
      jScore += 0.7;
      judgingReasons.push(`Saturn aspect to Moon (structured inner life, J)`);
    }
  }

  // Moon in 4th or 8th house = deep roots / fixed emotional intensity = inner J
  if (moon && (moon.house === 4 || moon.house === 8)) {
    jScore += 0.5;
    judgingReasons.push(`Moon in ${moon.house}th house (emotionally anchored, J)`);
  }

  // Pluto prominent in water house = transformational but *purposeful* = slight J
  if (pluto && (pluto.house === 8)) {
    jScore += 0.3;
    judgingReasons.push(`Pluto in 8th house (purposeful transformation, J)`);
  }

  // 12th house stellium = mutable/mystical but reduces J less severely than before
  if (twelfthHouseCount >= 3) {
    jScore -= 0.25;
    judgingReasons.push(`${twelfthHouseCount} planets in 12th house (fluid inner world)`);
  }

  // Neptune in mutable sign = slight P tendency (reduced from -0.4 to -0.2)
  if (neptune) {
    const neptuneMode = getMode(neptune.sign);
    if (neptuneMode === 'mutable') {
      jScore -= 0.2;
      judgingReasons.push(`Neptune in mutable sign (fluid mysticism)`);
    }
  }

  // North Node in fixed/cardinal water = spiritual J commitment
  if (northNode) {
    const nnMode = getMode(northNode.sign);
    const nnElement = getElement(northNode.sign);
    if ((nnMode === 'fixed' || nnMode === 'cardinal') && nnElement === 'water') {
      jScore += 0.4;
      judgingReasons.push(`North Node in ${northNode.sign} (purposeful soul direction, J)`);
    }
  }

  if (rxBoost.pBoost) {
    jScore -= rxBoost.pBoost;
    judgingReasons.push('Retrograde overlay (inner process stays open — P)');
  }

  const firmwareJ_P = jScore >= 0.4 ? 'J' : 'P';

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
