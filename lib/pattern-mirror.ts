import 'server-only';

import { prisma } from '@/lib/prisma';

export type PatternKey =
  | 'avoidance_loop'
  | 'overthinking_loop'
  | 'inconsistency'
  | 'validation_seeking'
  | 'control_friction'
  | 'self_trust_gap';

export interface DetectedPattern {
  key: PatternKey;
  label: string;
  confidence: number;
}

export type PatternTrendStatus = 'rising' | 'stable' | 'fading' | 'new';

export interface MirrorInsight {
  pattern: string;
  label: string;
  count: number;
  lastSeen?: string;
  message: string;
}

const PATTERN_LABELS: Record<PatternKey, string> = {
  avoidance_loop: 'Avoidance Loop',
  overthinking_loop: 'Overthinking Spike',
  inconsistency: 'Idea Abandonment',
  validation_seeking: 'Validation Seeking',
  control_friction: 'Control Friction',
  self_trust_gap: 'Self-Trust Gap',
};

const PATTERN_RULES: Array<{ key: PatternKey; regex: RegExp; confidence: number }> = [
  { key: 'avoidance_loop', regex: /(avoid|hesitat|put off|delay|procrastinat|stuck)/i, confidence: 0.83 },
  { key: 'overthinking_loop', regex: /(overthink|too much|analyz|analysis|spiral|can't decide)/i, confidence: 0.8 },
  { key: 'inconsistency', regex: /(finish|follow through|complete|start.*stop|abandon)/i, confidence: 0.78 },
  { key: 'validation_seeking', regex: /(approval|validation|what do they think|permission|need reassurance)/i, confidence: 0.76 },
  { key: 'control_friction', regex: /(control|certainty|perfect|plan everything|need to know)/i, confidence: 0.73 },
];

export function detectPatternFromText(text: string): DetectedPattern {
  for (const rule of PATTERN_RULES) {
    if (rule.regex.test(text)) {
      return { key: rule.key, label: PATTERN_LABELS[rule.key], confidence: rule.confidence };
    }
  }

  return {
    key: 'self_trust_gap',
    label: PATTERN_LABELS.self_trust_gap,
    confidence: 0.64,
  };
}

export async function logInteractionEvent(params: {
  userId: string;
  type: string;
  content?: string;
  detectedPattern?: string;
  confidence?: number;
  feedbackSignal?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.userInteractionEvent.create({
    data: {
      userId: params.userId,
      type: params.type,
      content: params.content,
      detectedPattern: params.detectedPattern,
      confidence: params.confidence,
      feedbackSignal: params.feedbackSignal,
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : undefined,
    },
  });
}

export async function getPatternMirror(userId: string) {
  const events = await prisma.userInteractionEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const patternEvents = events.filter((event) => event.detectedPattern);
  const counts = new Map<string, number>();

  for (const event of patternEvents) {
    const key = event.detectedPattern as string;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const frequency = Array.from(counts.entries())
    .map(([key, count]) => ({
      pattern: key,
      label: PATTERN_LABELS[key as PatternKey] || key,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const recentTimeline = patternEvents.slice(0, 8).map((event) => ({
    id: event.id,
    type: event.type,
    pattern: event.detectedPattern,
    label: PATTERN_LABELS[(event.detectedPattern || 'self_trust_gap') as PatternKey] || event.detectedPattern || 'Unknown',
    content: event.content,
    createdAt: event.createdAt.toISOString(),
    feedbackSignal: event.feedbackSignal,
  }));

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
  const currentWindow = patternEvents.filter((event) => event.createdAt.getTime() >= sevenDaysAgo);
  const previousWindow = patternEvents.filter(
    (event) => event.createdAt.getTime() < sevenDaysAgo && event.createdAt.getTime() >= fourteenDaysAgo
  );
  const trendCounts = new Map<string, number>();
  const previousTrendCounts = new Map<string, number>();
  for (const event of currentWindow) {
    const key = event.detectedPattern as string;
    trendCounts.set(key, (trendCounts.get(key) || 0) + 1);
  }
  for (const event of previousWindow) {
    const key = event.detectedPattern as string;
    previousTrendCounts.set(key, (previousTrendCounts.get(key) || 0) + 1);
  }

  const resolveTrendStatus = (currentCount: number, previousCount: number): PatternTrendStatus => {
    if (currentCount > 0 && previousCount === 0) return 'new';
    if (currentCount > previousCount) return 'rising';
    if (currentCount < previousCount) return 'fading';
    return 'stable';
  };

  const trendKeys = Array.from(trendCounts.keys());
  const previousTrendKeys = Array.from(previousTrendCounts.keys());
  const trends = Array.from(new Set([...trendKeys, ...previousTrendKeys]))
    .map((key) => {
      const count = trendCounts.get(key) || 0;
      const previousCount = previousTrendCounts.get(key) || 0;
      return {
        pattern: key,
        label: PATTERN_LABELS[key as PatternKey] || key,
        count,
        previousCount,
        delta: count - previousCount,
        status: resolveTrendStatus(count, previousCount),
      };
    })
    .filter((trend) => trend.count > 0 || trend.previousCount > 0)
    .sort((a, b) => b.count - a.count);

  const dominantTrend = frequency[0]
    ? trends.find((trend) => trend.pattern === frequency[0].pattern)
    : null;

  const dominant = frequency[0]
    ? {
        ...frequency[0],
        trendStatus: dominantTrend?.status || 'stable',
        delta: dominantTrend?.delta || 0,
        summary: `This pattern has repeated ${frequency[0].count} times in your recent behavior and is ${dominantTrend?.status || 'stable'} right now. Merlin should treat it as active, not historical.`,
      }
    : null;

  const mirrorInsight = dominant
    ? (() => {
        const recentMatches = patternEvents.filter((event) => event.detectedPattern === dominant.pattern).slice(0, 10);
        const count = recentMatches.length;
        const lastSeen = recentMatches[1]?.createdAt?.toISOString();

        let message = '';
        if (count === 1) {
          message = 'This pattern has appeared before. You have encountered it once already.';
        } else if (count < 4) {
          message = `This is becoming a pattern. You have repeated it ${count} times. Awareness is forming, but action has not fully followed.`;
        } else {
          message = `This is no longer random. This is a loop. You have repeated it ${count} times. You are not stuck. You are continuing.`;
        }

        if (dominant.trendStatus === 'rising') {
          message += ' It is getting louder, which means inaction is now part of the pattern.';
        } else if (dominant.trendStatus === 'fading') {
          message += ' It is weakening, which means this is the right moment to break it cleanly.';
        }

        return {
          pattern: dominant.pattern,
          label: dominant.label,
          count,
          lastSeen,
          message,
        } satisfies MirrorInsight;
      })()
    : null;

  return {
    dominant,
    mirrorInsight,
    frequency,
    recentTimeline,
    trends,
    totalEvents: events.length,
  };
}
