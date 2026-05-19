import 'server-only';

import { prisma } from '@/lib/prisma';

const KNOWN_PLANETS = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
] as const;

type KnownPlanet = (typeof KNOWN_PLANETS)[number];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function extractPlanets(value: string): KnownPlanet[] {
  const found = KNOWN_PLANETS.filter((planet) => value.includes(planet));
  return Array.from(new Set(found));
}

export interface CalibrationRecomputeResult {
  userId: string;
  windowDays: number;
  sampleSize: number;
  minSamples: number;
  modifiers: Record<string, number>;
  strongestModifier?: {
    planet: string;
    multiplier: number;
  };
}

export async function recomputeCalibrationProfile(params: {
  userId: string;
  days?: number;
  minSamples?: number;
}): Promise<CalibrationRecomputeResult> {
  const days = Number.isFinite(params.days) ? Math.min(Math.max(params.days || 90, 7), 365) : 90;
  const minSamples = Number.isFinite(params.minSamples)
    ? Math.min(Math.max(params.minSamples || 3, 1), 20)
    : 3;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const feedbackLogs = await prisma.resonanceFeedbackRecord.findMany({
    where: {
      userId: params.userId,
      date: { gte: since },
    },
    orderBy: { date: 'desc' },
    take: 1200,
    select: {
      aspectId: true,
      accuracyScore: true,
      resonated: true,
      notes: true,
      theme: true,
    },
  });

  const planetBuckets = new Map<KnownPlanet, { count: number; signal: number }>();
  const aspectThemeBuckets = new Map<string, { count: number; signal: number }>();

  for (const row of feedbackLogs) {
    const signedSignal = row.resonated ? row.accuracyScore : -row.accuracyScore;
    const planets = extractPlanets(`${row.aspectId} ${row.notes || ''}`);

    for (const planet of planets) {
      const current = planetBuckets.get(planet) || { count: 0, signal: 0 };
      current.count += 1;
      current.signal += signedSignal;
      planetBuckets.set(planet, current);
    }

    const key = `${row.aspectId}::${row.theme}`;
    const currentTheme = aspectThemeBuckets.get(key) || { count: 0, signal: 0 };
    currentTheme.count += 1;
    currentTheme.signal += signedSignal;
    aspectThemeBuckets.set(key, currentTheme);
  }

  const planetModifiers: Record<string, number> = {};

  for (const [planet, bucket] of planetBuckets.entries()) {
    if (bucket.count < minSamples) continue;
    const averageSignal = bucket.signal / bucket.count;
    const confidence = clamp(Math.sqrt(bucket.count / 8), 0.2, 1);
    const multiplier = clamp(1 + averageSignal * 0.28 * confidence, 0.75, 1.35);
    planetModifiers[planet] = Number(multiplier.toFixed(2));
  }

  await prisma.$transaction([
    prisma.personalResonanceRecord.deleteMany({ where: { userId: params.userId } }),
    prisma.personalResonanceRecord.createMany({
      data: Array.from(aspectThemeBuckets.entries()).map(([key, bucket]) => {
        const [aspectId, theme] = key.split('::');
        const averageSignal = bucket.signal / Math.max(bucket.count, 1);
        const confidence = clamp(bucket.count / 10, 0.2, 1);

        return {
          userId: params.userId,
          aspectId,
          theme,
          personalWeight: Number(clamp(averageSignal * 0.6, -1.25, 1.25).toFixed(3)),
          confidence: Number(confidence.toFixed(3)),
          feedbackCount: bucket.count,
        };
      }),
    }),
  ]);

  const strongest = Object.entries(planetModifiers).sort(
    (left, right) => Math.abs(right[1] - 1) - Math.abs(left[1] - 1)
  )[0];

  return {
    userId: params.userId,
    windowDays: days,
    sampleSize: feedbackLogs.length,
    minSamples,
    modifiers: planetModifiers,
    strongestModifier: strongest
      ? {
          planet: strongest[0],
          multiplier: strongest[1],
        }
      : undefined,
  };
}
