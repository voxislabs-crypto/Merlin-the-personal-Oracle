// Astrological element and mode mappings for MBTI calculations

export const ELEMENT_SIGNS = {
  fire: ['Aries', 'Leo', 'Sagittarius'],
  earth: ['Taurus', 'Virgo', 'Capricorn'],
  air: ['Gemini', 'Libra', 'Aquarius'],
  water: ['Cancer', 'Scorpio', 'Pisces']
} as const;

export const MODE_SIGNS = {
  cardinal: ['Aries', 'Cancer', 'Libra', 'Capricorn'],
  fixed: ['Taurus', 'Leo', 'Scorpio', 'Aquarius'],
  mutable: ['Gemini', 'Virgo', 'Sagittarius', 'Pisces']
} as const;

export function getSignElement(sign: string): 'fire' | 'earth' | 'air' | 'water' | null {
  for (const [element, signs] of Object.entries(ELEMENT_SIGNS)) {
    if (signs.includes(sign)) {
      return element as 'fire' | 'earth' | 'air' | 'water';
    }
  }
  return null;
}

export function getSignMode(sign: string): 'cardinal' | 'fixed' | 'mutable' | null {
  for (const [mode, signs] of Object.entries(MODE_SIGNS)) {
    if (signs.includes(sign)) {
      return mode as 'cardinal' | 'fixed' | 'mutable';
    }
  }
  return null;
}
