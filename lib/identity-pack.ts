import { BirthChartData } from '@/types/astrology';

export interface IdentityPack {
  archetypeName: string;
  patternSignature: string;
  coreContradiction: string;
}

const MBTI_BASE_ARCHETYPE: Record<string, string> = {
  INTJ: 'Strategist',
  INTP: 'Architect',
  ENTJ: 'Commander',
  ENTP: 'Provocateur',
  INFJ: 'Oracle',
  INFP: 'Dreamsmith',
  ENFJ: 'Catalyst',
  ENFP: 'Firestarter',
  ISTJ: 'Steward',
  ISFJ: 'Guardian',
  ESTJ: 'Executor',
  ESFJ: 'Binder',
  ISTP: 'Operator',
  ISFP: 'Alchemist',
  ESTP: 'Tactician',
  ESFP: 'Performer',
};

const ELEMENT_LABEL: Record<string, string> = {
  Aries: 'Solar',
  Leo: 'Radiant',
  Sagittarius: 'Wildfire',
  Taurus: 'Grounded',
  Virgo: 'Precise',
  Capricorn: 'Iron',
  Gemini: 'Mercurial',
  Libra: 'Harmonic',
  Aquarius: 'Electric',
  Cancer: 'Tidal',
  Scorpio: 'Abyssal',
  Pisces: 'Dreamborne',
};

function cleanMbti(input?: string | null): string {
  return (input || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}

function moonNeed(sign?: string): string {
  if (!sign) return 'certainty';
  if (['Cancer', 'Scorpio', 'Pisces'].includes(sign)) return 'emotional depth';
  if (['Aries', 'Leo', 'Sagittarius'].includes(sign)) return 'freedom';
  if (['Taurus', 'Virgo', 'Capricorn'].includes(sign)) return 'stability';
  return 'mental clarity';
}

function sunDrive(sign?: string): string {
  if (!sign) return 'control';
  if (['Aries', 'Leo', 'Sagittarius'].includes(sign)) return 'expression';
  if (['Taurus', 'Virgo', 'Capricorn'].includes(sign)) return 'control';
  if (['Gemini', 'Libra', 'Aquarius'].includes(sign)) return 'perspective';
  return 'emotional truth';
}

function contradictionTemplate(sun?: string, moon?: string, mbti?: string): string {
  const intro = mbti?.startsWith('I')
    ? 'You protect your inner world by staying private'
    : 'You protect your momentum by staying in motion';
  return `${intro}, but your ${sunDrive(sun)} instinct collides with your need for ${moonNeed(moon)}.`;
}

export function generateIdentityPack(chart?: BirthChartData, mbtiType?: string): IdentityPack {
  const planets = (chart?.planets || chart?.positions || []) as Array<{ name?: string; sign?: string }>;
  const sunSign = planets.find((p) => p.name === 'Sun')?.sign;
  const moonSign = planets.find((p) => p.name === 'Moon')?.sign;
  const mbti = cleanMbti(mbtiType);

  const archetypePrefix = ELEMENT_LABEL[sunSign || ''] || 'Cosmic';
  const base = MBTI_BASE_ARCHETYPE[mbti] || 'Seeker';
  const archetypeName = `The ${archetypePrefix} ${base}`;

  const patternSignature = `${sunDrive(sunSign)} vs ${moonNeed(moonSign)}`;
  const coreContradiction = contradictionTemplate(sunSign, moonSign, mbti);

  return {
    archetypeName,
    patternSignature,
    coreContradiction,
  };
}
