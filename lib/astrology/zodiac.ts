export const ZODIAC_SIGNS = [
  { name: 'Aries', glyph: '♈', element: 'Fire' as const, modality: 'Cardinal' as const },
  { name: 'Taurus', glyph: '♉', element: 'Earth' as const, modality: 'Fixed' as const },
  { name: 'Gemini', glyph: '♊', element: 'Air' as const, modality: 'Mutable' as const },
  { name: 'Cancer', glyph: '♋', element: 'Water' as const, modality: 'Cardinal' as const },
  { name: 'Leo', glyph: '♌', element: 'Fire' as const, modality: 'Fixed' as const },
  { name: 'Virgo', glyph: '♍', element: 'Earth' as const, modality: 'Mutable' as const },
  { name: 'Libra', glyph: '♎', element: 'Air' as const, modality: 'Cardinal' as const },
  { name: 'Scorpio', glyph: '♏', element: 'Water' as const, modality: 'Fixed' as const },
  { name: 'Sagittarius', glyph: '♐', element: 'Fire' as const, modality: 'Mutable' as const },
  { name: 'Capricorn', glyph: '♑', element: 'Earth' as const, modality: 'Cardinal' as const },
  { name: 'Aquarius', glyph: '♒', element: 'Air' as const, modality: 'Fixed' as const },
  { name: 'Pisces', glyph: '♓', element: 'Water' as const, modality: 'Mutable' as const },
] as const;

export type ZodiacSignName = (typeof ZODIAC_SIGNS)[number]['name'];
export type ZodiacElement = (typeof ZODIAC_SIGNS)[number]['element'];
export type ZodiacModality = (typeof ZODIAC_SIGNS)[number]['modality'];

export const SIGN_TRAITS: Record<
  ZodiacSignName,
  { keywords: string[]; summary: string }
> = {
  Aries: {
    keywords: ['initiative', 'courage', 'urgency', 'independence'],
    summary: 'Starts fast, leads from the front, and learns by doing. Aries energy is direct, competitive, and allergic to waiting.',
  },
  Taurus: {
    keywords: ['stability', 'sensuality', 'patience', 'loyalty'],
    summary: 'Builds slowly, holds tightly, and values what endures. Taurus energy grounds ideas in the body, money, and matter.',
  },
  Gemini: {
    keywords: ['curiosity', 'wit', 'adaptability', 'dialogue'],
    summary: 'Collects information, connects dots, and keeps things moving. Gemini energy lives in questions, stories, and quick pivots.',
  },
  Cancer: {
    keywords: ['nurture', 'memory', 'protection', 'intuition'],
    summary: 'Feels first, protects what matters, and reads the emotional weather. Cancer energy is loyal, private, and deeply attached.',
  },
  Leo: {
    keywords: ['visibility', 'heart', 'creativity', 'pride'],
    summary: 'Shines deliberately and wants the room to feel alive. Leo energy creates, performs, and leads with warmth.',
  },
  Virgo: {
    keywords: ['precision', 'service', 'analysis', 'improvement'],
    summary: 'Notices what is off and works until it works better. Virgo energy refines, diagnoses, and earns trust through competence.',
  },
  Libra: {
    keywords: ['balance', 'harmony', 'fairness', 'partnership'],
    summary: 'Seeks equilibrium in people, design, and decisions. Libra energy weighs both sides and hates unnecessary ugliness.',
  },
  Scorpio: {
    keywords: ['depth', 'intensity', 'loyalty', 'transformation'],
    summary: 'Goes beneath the surface and stays there until truth shows up. Scorpio energy is private, magnetic, and hard to fake out.',
  },
  Sagittarius: {
    keywords: ['freedom', 'truth', 'adventure', 'vision'],
    summary: 'Needs horizon, meaning, and room to roam. Sagittarius energy teaches, explores, and bets on the bigger picture.',
  },
  Capricorn: {
    keywords: ['discipline', 'ambition', 'structure', 'endurance'],
    summary: 'Plays the long game and respects what takes time to build. Capricorn energy is strategic, serious, and hard to rush.',
  },
  Aquarius: {
    keywords: ['innovation', 'detachment', 'community', 'rebellion'],
    summary: 'Thinks in systems, futures, and collective possibility. Aquarius energy breaks patterns to make room for better ones.',
  },
  Pisces: {
    keywords: ['empathy', 'imagination', 'spirituality', 'dissolution'],
    summary: 'Feels the invisible layers and dissolves hard edges. Pisces energy dreams, absorbs, and surrenders into something larger.',
  },
};

export const ELEMENT_COLORS: Record<ZodiacElement, { bg: string; border: string; text: string }> = {
  Fire: { bg: 'bg-red-500/15', border: 'border-red-400/40', text: 'text-red-200' },
  Earth: { bg: 'bg-emerald-500/15', border: 'border-emerald-400/40', text: 'text-emerald-200' },
  Air: { bg: 'bg-sky-500/15', border: 'border-sky-400/40', text: 'text-sky-200' },
  Water: { bg: 'bg-violet-500/15', border: 'border-violet-400/40', text: 'text-violet-200' },
};

export function getSignMeta(signName: string) {
  return ZODIAC_SIGNS.find((s) => s.name === signName);
}