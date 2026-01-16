// lib/personality/fusion.ts

import { type MBTIType } from '@/shared/schema';

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