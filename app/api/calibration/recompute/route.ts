import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { recomputeCalibrationProfile } from '@/lib/astrology/feedback/calibration';
import { logInteractionEvent } from '@/lib/pattern-mirror';
import { prisma } from '@/lib/prisma';

interface RecomputeBody {
  userId?: string;
  days?: number;
  minSamples?: number;
}

function parseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as RecomputeBody;
    const targetUserId = body.userId || authUserId;

    if (targetUserId !== authUserId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const result = await recomputeCalibrationProfile({
      userId: targetUserId,
      days: body.days,
      minSamples: body.minSamples,
    });

    const previousRun = await prisma.userInteractionEvent.findFirst({
      where: {
        userId: targetUserId,
        type: 'calibration_recompute',
      },
      orderBy: { createdAt: 'desc' },
      select: { metadataJson: true },
    });

    const previousMeta = parseMetadata(previousRun?.metadataJson || null);
    const previousModifiers = (previousMeta.modifiers as Record<string, number> | undefined) || {};
    const modifierDelta = Object.entries(result.modifiers).map(([planet, multiplier]) => {
      const previous = previousModifiers[planet] ?? 1;
      const delta = Number((multiplier - previous).toFixed(3));
      return {
        planet,
        previous,
        current: multiplier,
        delta,
      };
    });

    await logInteractionEvent({
      userId: targetUserId,
      type: 'calibration_recompute',
      content: 'calibration_recomputed',
      metadata: {
        windowDays: result.windowDays,
        sampleSize: result.sampleSize,
        minSamples: result.minSamples,
        strongestModifier: result.strongestModifier || null,
        modifierCount: Object.keys(result.modifiers || {}).length,
        modifiers: result.modifiers,
        modifierDelta,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
