import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/prisma';

interface CalibrationHistoryItem {
  id: string;
  createdAt: string;
  windowDays: number | null;
  sampleSize: number | null;
  minSamples: number | null;
  strongestModifier: { planet?: string; multiplier?: number } | null;
  modifierCount: number;
  modifiers: Record<string, number>;
  modifierDelta: Array<{ planet: string; previous: number; current: number; delta: number }>;
  impactScore: number;
}

function parseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function sanitizeModifiers(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};

  return Object.entries(raw as Record<string, unknown>).reduce<Record<string, number>>((acc, [planet, value]) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return acc;
    acc[planet] = value;
    return acc;
  }, {});
}

function sanitizeModifierDelta(raw: unknown): Array<{ planet: string; previous: number; current: number; delta: number }> {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const candidate = item as Record<string, unknown>;
      if (typeof candidate.planet !== 'string') return null;
      if (
        typeof candidate.previous !== 'number' ||
        typeof candidate.current !== 'number' ||
        typeof candidate.delta !== 'number' ||
        !Number.isFinite(candidate.previous) ||
        !Number.isFinite(candidate.current) ||
        !Number.isFinite(candidate.delta)
      ) {
        return null;
      }

      return {
        planet: candidate.planet,
        previous: candidate.previous,
        current: candidate.current,
        delta: candidate.delta,
      };
    })
    .filter((item): item is { planet: string; previous: number; current: number; delta: number } => item !== null);
}

export async function GET(request: Request) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId') || authUserId;
    if (requestedUserId !== authUserId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const daysRaw = Number(searchParams.get('days') || '30');
    const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 365) : 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await prisma.userInteractionEvent.findMany({
      where: {
        userId: requestedUserId,
        type: 'calibration_recompute',
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 120,
      select: {
        id: true,
        metadataJson: true,
        createdAt: true,
      },
    });

    const entries: CalibrationHistoryItem[] = rows.map((row) => {
      const meta = parseMetadata(row.metadataJson);
      const strongestRaw = meta.strongestModifier as { planet?: string; multiplier?: number } | null | undefined;
      const modifiers = sanitizeModifiers(meta.modifiers);
      const modifierDelta = sanitizeModifierDelta(meta.modifierDelta);
      const impactScore = Number(
        Math.max(...modifierDelta.map((item) => Math.abs(item.delta)), 0).toFixed(3)
      );

      return {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        windowDays: typeof meta.windowDays === 'number' ? meta.windowDays : null,
        sampleSize: typeof meta.sampleSize === 'number' ? meta.sampleSize : null,
        minSamples: typeof meta.minSamples === 'number' ? meta.minSamples : null,
        strongestModifier: strongestRaw || null,
        modifierCount: typeof meta.modifierCount === 'number' ? meta.modifierCount : 0,
        modifiers,
        modifierDelta,
        impactScore,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: requestedUserId,
        windowDays: days,
        total: entries.length,
        entries,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
