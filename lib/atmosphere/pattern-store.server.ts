import 'server-only';

import { prisma } from '@/lib/prisma';
import { isPrismaMissingTableError } from '@/lib/prisma-errors';
import {
  buildPlanetPatternKey,
  buildTransitPatternKey,
  clamp,
  deriveCheckinTags,
  deriveSensitivityTags,
  extractPlanetsFromText,
  feedbackSignalToSensitivity,
  mergeSensitivityScores,
  parseAspectId,
} from '@/lib/atmosphere/pattern-tags';
import type {
  AtmospherePatternProfile,
  AtmospherePatternRecord,
  AtmosphereSensitivityTag,
} from '@/lib/atmosphere/pattern-types';

interface MutablePatternBucket {
  patternKey: string;
  patternType: 'planet' | 'transit' | 'tag';
  sensitivityScore: number;
  sampleCount: number;
  confidence: number;
  tags: Set<AtmosphereSensitivityTag>;
  lastSeenAt?: Date;
}

const EMPTY_PROFILE = (userId: string): AtmospherePatternProfile => ({
  userId,
  patterns: [],
  tagWeights: {},
  summary: {
    patternCount: 0,
    feedbackSamples: 0,
    checkinSamples: 0,
  },
});

function parseTagsJson(raw: string | null | undefined): AtmosphereSensitivityTag[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AtmosphereSensitivityTag[]) : [];
  } catch {
    return [];
  }
}

function serializeTags(tags: Iterable<AtmosphereSensitivityTag>): string {
  return JSON.stringify(Array.from(tags));
}

function upsertBucket(
  buckets: Map<string, MutablePatternBucket>,
  bucket: MutablePatternBucket,
  incomingScore: number,
  tags: AtmosphereSensitivityTag[],
  seenAt: Date
) {
  const existing = buckets.get(bucket.patternKey);
  if (!existing) {
    bucket.tags = new Set(tags);
    bucket.lastSeenAt = seenAt;
    buckets.set(bucket.patternKey, bucket);
    return;
  }

  const merged = mergeSensitivityScores(
    existing.sensitivityScore,
    existing.sampleCount,
    incomingScore
  );
  existing.sensitivityScore = merged.score;
  existing.sampleCount = merged.count;
  existing.confidence = merged.confidence;
  tags.forEach((tag) => existing.tags.add(tag));
  if (!existing.lastSeenAt || seenAt > existing.lastSeenAt) {
    existing.lastSeenAt = seenAt;
  }
}

export async function getAtmospherePatternProfile(userId: string): Promise<AtmospherePatternProfile> {
  try {
    const rows = await prisma.atmospherePatternRecord.findMany({
      where: { userId },
      orderBy: [{ confidence: 'desc' }, { sampleCount: 'desc' }],
      take: 120,
    });

    if (!rows.length) {
      return EMPTY_PROFILE(userId);
    }

    const patterns: AtmospherePatternRecord[] = rows.map((row) => ({
      patternKey: row.patternKey,
      patternType:
        row.patternType === 'transit'
          ? 'transit'
          : row.patternType === 'tag'
            ? 'tag'
            : 'planet',
      sensitivityScore: row.sensitivityScore,
      sampleCount: row.sampleCount,
      confidence: row.confidence,
      tags: parseTagsJson(row.tagsJson),
      lastSeenAt: row.lastSeenAt?.toISOString(),
    }));

    const tagWeights: Partial<Record<AtmosphereSensitivityTag, number>> = {};
    for (const pattern of patterns) {
      for (const tag of pattern.tags) {
        const current = tagWeights[tag] || 0;
        tagWeights[tag] = Number((current + pattern.sensitivityScore * pattern.confidence).toFixed(3));
      }
    }

    const strongest = [...patterns].sort(
      (left, right) => Math.abs(right.sensitivityScore) - Math.abs(left.sensitivityScore)
    )[0];

    return {
      userId,
      patterns,
      tagWeights,
      summary: {
        patternCount: patterns.length,
        feedbackSamples: patterns.reduce((sum, pattern) => sum + pattern.sampleCount, 0),
        checkinSamples: 0,
        strongestPatternKey: strongest?.patternKey,
        strongestSensitivity: strongest?.sensitivityScore,
      },
    };
  } catch (error) {
    if (isPrismaMissingTableError(error)) {
      return EMPTY_PROFILE(userId);
    }
    throw error;
  }
}

export interface RecomputeAtmospherePatternsResult {
  userId: string;
  windowDays: number;
  feedbackSamples: number;
  checkinSamples: number;
  patternCount: number;
  patterns: AtmospherePatternRecord[];
}

export async function recomputeAtmospherePatterns(params: {
  userId: string;
  days?: number;
}): Promise<RecomputeAtmospherePatternsResult> {
  const days = Number.isFinite(params.days) ? Math.min(Math.max(params.days || 90, 7), 365) : 90;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const buckets = new Map<string, MutablePatternBucket>();
  let feedbackSamples = 0;
  let checkinSamples = 0;

  try {
    const [feedbackLogs, checkins] = await Promise.all([
      prisma.resonanceFeedbackRecord.findMany({
        where: { userId: params.userId, date: { gte: since } },
        orderBy: { date: 'desc' },
        take: 1200,
        select: {
          aspectId: true,
          theme: true,
          resonated: true,
          accuracyScore: true,
          date: true,
        },
      }),
      prisma.userInteractionEvent.findMany({
        where: {
          userId: params.userId,
          type: 'checkin_entry',
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
        select: {
          metadataJson: true,
          createdAt: true,
        },
      }),
    ]);

    for (const row of feedbackLogs) {
      feedbackSamples += 1;
      const signal = feedbackSignalToSensitivity(row.resonated, row.accuracyScore);
      const parsed = parseAspectId(row.aspectId);
      const tags = deriveSensitivityTags(row.aspectId, signal, row.theme);

      if (parsed.transitingPlanet && parsed.natalPlanet && parsed.aspect) {
        upsertBucket(
          buckets,
          {
            patternKey: buildTransitPatternKey(
              parsed.transitingPlanet,
              parsed.aspect,
              parsed.natalPlanet
            ),
            patternType: 'transit',
            sensitivityScore: signal,
            sampleCount: 1,
            confidence: 0.2,
            tags: new Set(tags),
          },
          signal,
          tags,
          row.date
        );
      }

      const planets = extractPlanetsFromText(`${row.aspectId} ${row.theme}`);
      for (const planet of planets) {
        const planetTags = deriveSensitivityTags(buildPlanetPatternKey(planet), signal, row.theme);
        upsertBucket(
          buckets,
          {
            patternKey: buildPlanetPatternKey(planet),
            patternType: 'planet',
            sensitivityScore: signal,
            sampleCount: 1,
            confidence: 0.2,
            tags: new Set(planetTags),
          },
          signal,
          planetTags,
          row.date
        );
      }
    }

    for (const row of checkins) {
      let metadata: Record<string, unknown> = {};
      try {
        metadata = row.metadataJson ? (JSON.parse(row.metadataJson) as Record<string, unknown>) : {};
      } catch {
        metadata = {};
      }

      const mood = typeof metadata.mood === 'number' ? metadata.mood : null;
      const stress = typeof metadata.stress === 'number' ? metadata.stress : null;
      const energy = typeof metadata.energy === 'number' ? metadata.energy : null;
      if (mood === null || stress === null || energy === null) continue;

      checkinSamples += 1;
      const stressSignal = (stress - 5.5) / 4.5;
      const moodSignal = (5.5 - mood) / 4.5;
      const blendedSignal = Number(clamp((stressSignal + moodSignal) / 2, -1, 1).toFixed(3));
      const tags = deriveCheckinTags(stress, mood, energy);

      upsertBucket(
        buckets,
        {
          patternKey: 'tag:stress_reactivity',
          patternType: 'tag',
          sensitivityScore: blendedSignal,
          sampleCount: 1,
          confidence: 0.2,
          tags: new Set(tags),
        },
        blendedSignal,
        tags,
        row.createdAt
      );
    }

    const records = Array.from(buckets.values());

    await prisma.$transaction([
      prisma.atmospherePatternRecord.deleteMany({ where: { userId: params.userId } }),
      prisma.atmospherePatternRecord.createMany({
        data: records.map((record) => ({
          userId: params.userId,
          patternKey: record.patternKey,
          patternType: record.patternType,
          sensitivityScore: record.sensitivityScore,
          sampleCount: record.sampleCount,
          confidence: record.confidence,
          tagsJson: serializeTags(record.tags),
          lastSeenAt: record.lastSeenAt,
        })),
      }),
    ]);

    const patterns: AtmospherePatternRecord[] = records.map((record) => ({
      patternKey: record.patternKey,
      patternType: record.patternType,
      sensitivityScore: record.sensitivityScore,
      sampleCount: record.sampleCount,
      confidence: record.confidence,
      tags: Array.from(record.tags),
      lastSeenAt: record.lastSeenAt?.toISOString(),
    }));

    return {
      userId: params.userId,
      windowDays: days,
      feedbackSamples,
      checkinSamples,
      patternCount: patterns.length,
      patterns,
    };
  } catch (error) {
    if (isPrismaMissingTableError(error)) {
      return {
        userId: params.userId,
        windowDays: days,
        feedbackSamples,
        checkinSamples,
        patternCount: 0,
        patterns: [],
      };
    }
    throw error;
  }
}