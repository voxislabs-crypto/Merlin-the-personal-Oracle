import { BirthChartData } from '@/types/astrology';
import type { PersistentUserContextSnapshot } from '@/lib/user-context';

export type ArcPath = 'Path of Control' | 'Path of Expression' | 'Path of Truth';

function elementFromSign(sign?: string): 'Fire' | 'Earth' | 'Air' | 'Water' | 'Unknown' {
  if (!sign) return 'Unknown';
  if (['Aries', 'Leo', 'Sagittarius'].includes(sign)) return 'Fire';
  if (['Taurus', 'Virgo', 'Capricorn'].includes(sign)) return 'Earth';
  if (['Gemini', 'Libra', 'Aquarius'].includes(sign)) return 'Air';
  if (['Cancer', 'Scorpio', 'Pisces'].includes(sign)) return 'Water';
  return 'Unknown';
}

function cleanMbti(input?: string | null): string {
  return (input || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}

export function inferArcPath(chart?: BirthChartData, mbtiType?: string): ArcPath {
  const planets = (chart?.planets || chart?.positions || []) as Array<{ name?: string; sign?: string }>;
  const sunSign = planets.find((p) => p.name === 'Sun')?.sign;
  const sunElement = elementFromSign(sunSign);
  const mbti = cleanMbti(mbtiType);

  if (sunElement === 'Earth' || mbti.includes('TJ')) {
    return 'Path of Control';
  }
  if (sunElement === 'Fire' || mbti.includes('FP') || mbti.includes('EN')) {
    return 'Path of Expression';
  }
  return 'Path of Truth';
}

function computeXpGain(question: string): number {
  let gain = 8;
  const q = question.toLowerCase();

  if (question.length > 80) gain += 4;
  if (/[?]/.test(question)) gain += 2;
  if (/(pattern|again|why do i|truth|future|keep doing|cycle)/i.test(q)) gain += 4;
  if (/(job|money|relationship|health|decision|risk)/i.test(q)) gain += 2;

  return Math.min(24, gain);
}

export function advanceArcProgression(params: {
  existing?: PersistentUserContextSnapshot | null;
  question: string;
  chart?: BirthChartData;
  mbtiType?: string;
}): {
  arcPath: ArcPath;
  arcLevel: number;
  arcXp: number;
  interactionCount: number;
  lastInteractionAt: string;
  xpGained: number;
} {
  const existing = params.existing;
  const xpBefore = existing?.arcXp || 0;
  const interactions = existing?.interactionCount || 0;
  const xpGain = computeXpGain(params.question);
  const totalXp = xpBefore + xpGain;
  const level = Math.max(1, Math.floor(totalXp / 100) + 1);

  return {
    arcPath: (existing?.arcPath as ArcPath | undefined) || inferArcPath(params.chart, params.mbtiType),
    arcLevel: level,
    arcXp: totalXp,
    interactionCount: interactions + 1,
    lastInteractionAt: new Date().toISOString(),
    xpGained: xpGain,
  };
}
