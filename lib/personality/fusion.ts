// lib/personality/fusion.ts

import { type MBTIType } from '@/shared/schema';
import { BirthChartData, PlanetPosition, MBTIDetails } from '@/types/astrology';
import { getSignElement, getSignMode } from './astro-utils';

const MBTI_MAP = {
  // E/I from Asc sign or Sun
  E: ['Aries', 'Leo', 'Sagittarius', 'Gemini', 'Libra', 'Aquarius'],
  // N/S from Mercury aspects or sign
  N: ['Uranus', 'Neptune', 'Pisces', 'Sagittarius'],
  // F/T from Moon/Venus vs Mars
  F: ['Venus', 'Moon', 'Pisces', 'Cancer', 'Libra'],
  // J/P from Saturn or cardinal vs mutable
  J: ['Capricorn', 'Aries', 'Cancer', 'Libra', 'Saturn']
};

export function getMBTI(chart: any): MBTIType {
  const e_i = MBTI_MAP.E.some(s => chart.ascendant?.sign?.includes(s) || chart.sun?.sign?.includes(s)) ? 'E' : 'I';
  const n_s = chart.mercury?.aspects?.some((a: any) => a.to === 'Uranus') ? 'N' : 'S';
  const f_t = chart.moon?.aspects?.some((a: any) => a.to === 'Venus') ? 'F' : 'T';
  const j_p = ['Capricorn', 'Aries', 'Cancer', 'Libra'].includes(chart.ascendant?.sign) ? 'J' : 'P';

  return (e_i + n_s + f_t + j_p) as MBTIType;
}

/**
 * Enhanced MBTI computation based on detailed astrological scoring
 * Analyzes planetary positions, houses, and aspects to determine personality type
 */
export function computeMBTI(chart: BirthChartData): MBTIDetails {
  // Helper to find a planet by name
  const findPlanet = (name: string): PlanetPosition | undefined => 
    chart.positions.find(p => p.name === name);

  // Extract key planets and angles
  const mars = findPlanet('Mars');
  const moon = findPlanet('Moon');
  const mercury = findPlanet('Mercury');
  const saturn = findPlanet('Saturn');
  const jupiter = findPlanet('Jupiter');
  const venus = findPlanet('Venus');
  const neptune = findPlanet('Neptune');
  const northNode = findPlanet('North Node');
  
  // Default values if planets not found
  const ascendantElement = getSignElement(chart.ascendant.sign);
  const marsElement = mars ? getSignElement(mars.sign) : null;
  const moonElement = moon ? getSignElement(moon.sign) : null;
  const mercuryElement = mercury ? getSignElement(mercury.sign) : null;
  const jupiterElement = jupiter ? getSignElement(jupiter.sign) : null;
  const northNodeElement = northNode ? getSignElement(northNode.sign) : null;
  
  const saturnMode = saturn ? getSignMode(saturn.sign) : null;
  const mcMode = getSignMode(chart.mc.sign);

  // Count planets in houses (1-indexed in chart, 0-indexed in arrays)
  const getPlanetsInHouse = (houseNum: number): number => 
    chart.positions.filter(p => p.house === houseNum).length;

  // E/I: Extroversion from fire/air signs
  let eScore = 0;
  if (ascendantElement === 'fire' || ascendantElement === 'air') eScore += 1;
  if (marsElement === 'fire' || marsElement === 'air') eScore += 0.4;
  const firstHouseCount = getPlanetsInHouse(1);
  if (firstHouseCount >= 2) eScore += 0.2;
  const e_i = eScore > 0.5 ? 'E' : 'I';

  // S/N: Intuition from air/fire signs and higher houses
  let nScore = 0;
  if (northNodeElement === 'air' || northNodeElement === 'fire') nScore += 1;
  if ((mercuryElement === 'air' || mercuryElement === 'fire') || 
      (mercury && (mercury.house === 9 || mercury.house === 11))) nScore += 0.5;
  if (jupiterElement === 'air' || jupiterElement === 'fire') nScore += 0.3;
  const s_n = nScore > 0.5 ? 'N' : 'S';

  // T/F: Thinking from air/fire Mars, air/fire Moon
  let tScore = 0;
  if (marsElement === 'air' || marsElement === 'fire') tScore += 1;
  if (moonElement === 'air' || moonElement === 'fire') tScore += 0.4;
  
  // Check for Venus-Moon harmonious aspects (reduces thinking score)
  const venusMoonAspect = chart.aspects.find(a => 
    (a.planet1.name === 'Venus' && a.planet2.name === 'Moon') ||
    (a.planet1.name === 'Moon' && a.planet2.name === 'Venus')
  );
  if (venusMoonAspect && 
      ['Conjunction', 'Trine', 'Sextile'].includes(venusMoonAspect.type)) {
    tScore -= 0.2;
  }
  const t_f = tScore > 0.5 ? 'T' : 'F';

  // J/P: Judging from cardinal/fixed modes
  let jScore = 0;
  if (saturnMode === 'cardinal' || saturnMode === 'fixed') jScore += 1;
  if (mcMode === 'cardinal' || mcMode === 'fixed') jScore += 0.4;
  const tenthHouseCount = getPlanetsInHouse(10);
  if (tenthHouseCount >= 2) jScore += 0.2;
  const j_p = jScore > 0.5 ? 'J' : 'P';

  // INFJ/INTJ override based on specific placements
  let override = '';
  if ((mercury && mercury.house === 1) || 
      (moon && neptune && moon.house === 11 && neptune.house === 11)) {
    if (t_f === 'F' || (t_f === 'T' && tScore < 0.55)) override = 'INFJ';
  }
  if (saturn && (saturn.house === 1 || saturn.house === 2)) {
    if (override !== 'INFJ' && (t_f === 'T' || tScore > 0.45)) override = 'INTJ';
  }

  const rawType = [e_i, s_n, t_f, j_p].join('');
  
  // Calculate confidence score
  const scores = [
    Math.abs(eScore - 0.5) * 2, // Convert to 0-1 range
    Math.abs(nScore - 0.5) * 2,
    Math.abs(tScore - 0.5) * 2,
    Math.abs(jScore - 0.5) * 2
  ];
  
  const baseConfidence = (scores.reduce((a, b) => a + b, 0) / 4) * 100;
  
  // Bonuses
  let confidence = Math.round(baseConfidence);
  if (northNodeElement === 'air' && mercury && mercury.house === 9) confidence += 15;
  if (moon && (moon.house === 1 || moon.house === 10)) confidence += 10;
  
  // Penalties
  const saturnHardAspects = chart.aspects.filter(a =>
    (a.planet1.name === 'Saturn' || a.planet2.name === 'Saturn') &&
    ['Square', 'Opposition'].includes(a.type)
  );
  if (saturnHardAspects.length > 0) confidence -= 15;

  // Firmware overlay (ENFP tendency)
  const firmware = (northNodeElement === 'fire' && mercuryElement === 'air') ? 'ENFP' : '';

  return {
    type: override || rawType,
    confidence: Math.min(100, Math.max(60, confidence)), // clamp 60-100
    breakdown: { e_i, s_n, t_f, j_p },
    firmware: firmware || undefined
  };
}

export const PERSONALITY_LINES: Record<MBTIType, string[]> = {
  // Intuitive-Thinking (NT) - The Rationals
  INTJ: ["You plan wars in silence.", "People think you're cold. You're just three steps ahead.", "Your ambition runs deeper than words."],
  INTP: ["Your mind is a universe.", "You question everything—even yourself.", "Understanding is your quest."],
  ENTJ: ["You command rooms without speaking.", "Your vision moves mountains.", "Others follow. You lead."],
  ENTP: ["You debate reality itself.", "Adventure calls your name.", "Rules are suggestions to you."],

  // Intuitive-Feeling (NF) - The Idealists
  INFJ: ["You see souls before faces.", "Your intuition is prophecy.", "The world needs your wisdom."],
  INFP: ["You feel the world's heartbeat.", "Authenticity is your religion.", "Your truth is radical."],
  ENFJ: ["You gather people like constellations.", "Your warmth transforms lives.", "You inspire revolutions."],
  ENFP: ["You start fires with ideas.", "You love everyone until you don't.", "Your energy rewrites reality."],

  // Sensing-Thinking (ST) - The Guardians
  ISTJ: ["You are the bedrock.", "Duty flows through your veins.", "The world rests on your shoulders."],
  ISFJ: ["You are loyalty incarnate.", "Care is your language.", "You hold others' worlds together."],
  ESTJ: ["You build empires methodically.", "Respect is earned, not given.", "Order flows from your will."],
  ESFJ: ["You are the glue binding hearts.", "Community is your sanctuary.", "Your harmony heals."],

  // Sensing-Feeling (SF) - The Artisans
  ISTP: ["You decode the machine.", "Action is your thinking.", "Your hands speak truth."],
  ISFP: ["Beauty lives in your touch.", "You feel through aesthetics.", "Your presence is art."],
  ESTP: ["You thrive in chaos.", "Risk is your breath.", "Adventure owns you."],
  ESFP: ["You are the moment alive.", "Joy radiates from your core.", "Life happens through you."],
};

export const PERSONALITY_LINES: Record<MBTIType, string[]> = {
  // Intuitive-Thinking (NT) - The Rationals
  INTJ: ["You plan wars in silence.", "People think you're cold. You're just three steps ahead.", "Your ambition runs deeper than words."],
  INTP: ["Your mind is a universe.", "You question everything—even yourself.", "Understanding is your quest."],
  ENTJ: ["You command rooms without speaking.", "Your vision moves mountains.", "Others follow. You lead."],
  ENTP: ["You debate reality itself.", "Adventure calls your name.", "Rules are suggestions to you."],

  // Intuitive-Feeling (NF) - The Idealists
  INFJ: ["You see souls before faces.", "Your intuition is prophecy.", "The world needs your wisdom."],
  INFP: ["You feel the world's heartbeat.", "Authenticity is your religion.", "Your truth is radical."],
  ENFJ: ["You gather people like constellations.", "Your warmth transforms lives.", "You inspire revolutions."],
  ENFP: ["You start fires with ideas.", "You love everyone until you don't.", "Your energy rewrites reality."],

  // Sensing-Thinking (ST) - The Guardians
  ISTJ: ["You are the bedrock.", "Duty flows through your veins.", "The world rests on your shoulders."],
  ISFJ: ["You are loyalty incarnate.", "Care is your language.", "You hold others' worlds together."],
  ESTJ: ["You build empires methodically.", "Respect is earned, not given.", "Order flows from your will."],
  ESFJ: ["You are the glue binding hearts.", "Community is your sanctuary.", "Your harmony heals."],

  // Sensing-Feeling (SF) - The Artisans
  ISTP: ["You decode the machine.", "Action is your thinking.", "Your hands speak truth."],
  ISFP: ["Beauty lives in your touch.", "You feel through aesthetics.", "Your presence is art."],
  ESTP: ["You thrive in chaos.", "Risk is your breath.", "Adventure owns you."],
  ESFP: ["You are the moment alive.", "Joy radiates from your core.", "Life happens through you."],
};