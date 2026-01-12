// lib/personality/fusion.ts

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

export function getMBTI(chart: any): string {
  let e_i = MBTI_MAP.E.some(s => chart.ascendant.sign.includes(s) || chart.sun.sign.includes(s)) ? 'E' : 'I';
  let n_s = chart.mercury.aspects.some((a: any) => a.to === 'Uranus') ? 'N' : 'S';
  let f_t = chart.moon.aspects.some((a: any) => a.to === 'Venus') ? 'F' : 'T';
  let j_p = ['Capricorn', 'Aries', 'Cancer', 'Libra'].includes(chart.ascendant.sign) ? 'J' : 'P';

  return e_i + n_s + f_t + j_p;
}

export const PERSONALITY_LINES: Record<string, string[]> = {
  INTJ: ["You plan wars in silence.", "People think you're cold. You're just three steps ahead."],
  ENFP: ["You start fires with ideas.", "You love everyone until you don't."],
  // add all 16 with your voice
};