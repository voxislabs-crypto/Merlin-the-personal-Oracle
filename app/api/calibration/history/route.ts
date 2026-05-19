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
}

function parseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
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

      return {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        windowDays: typeof meta.windowDays === 'number' ? meta.windowDays : null,
        sampleSize: typeof meta.sampleSize === 'number' ? meta.sampleSize : null,
        minSamples: typeof meta.minSamples === 'number' ? meta.minSamples : null,
        strongestModifier: strongestRaw || null,
        modifierCount: typeof meta.modifierCount === 'number' ? meta.modifierCount : 0,
        modifiers: (meta.modifiers as Record<string, number> | undefined) || {},
        modifierDelta:
          (meta.modifierDelta as Array<{ planet: string; previous: number; current: number; delta: number }> | undefined) ||
          [],
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
