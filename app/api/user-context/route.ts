import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserContextSnapshot, upsertUserContextSnapshot } from '@/lib/user-context';
import {
  computeUserContextTrustSignals,
  emitRuntimeTrustCalibration,
} from '@/lib/internal/ops-runtime-telemetry';

const USER_CONTEXT_DB_ERROR_STATUS = 503;

export async function GET(request: Request) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    if (userId !== authUserId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    let context = null;
    try {
      context = await getUserContextSnapshot(userId);
    } catch (dbError) {
      console.error('[user-context] Failed to load context:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to load user context' },
        { status: USER_CONTEXT_DB_ERROR_STATUS }
      );
    }

    return NextResponse.json({ success: true, data: context });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      situation,
      mood,
      goals,
      lastFeedbackNotes,
      oracleTonePreset,
      archetypeName,
      patternSignature,
      coreContradiction,
      arcPath,
      arcLevel,
      arcXp,
      interactionCount,
      lastInteractionAt,
    } = body || {};

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    if (userId !== authUserId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    let context;
    try {
      context = await upsertUserContextSnapshot({
        userId,
        situation,
        mood,
        goals,
        lastFeedbackNotes,
        oracleTonePreset,
        archetypeName,
        patternSignature,
        coreContradiction,
        arcPath,
        arcLevel,
        arcXp,
        interactionCount,
        lastInteractionAt,
      });
    } catch (dbError) {
      console.error('[user-context] Failed to persist context:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to persist user context' },
        { status: USER_CONTEXT_DB_ERROR_STATUS }
      );
    }

    try {
      const trustSignals = computeUserContextTrustSignals({
        hasSituation: typeof situation === 'string' && situation.trim().length > 0,
        hasMood: typeof mood === 'string' && mood.trim().length > 0,
        goalsCount: Array.isArray(goals) ? goals.filter((goal) => typeof goal === 'string' && goal.trim().length > 0).length : 0,
        hasFeedbackNotes: typeof lastFeedbackNotes === 'string' && lastFeedbackNotes.trim().length > 0,
      });

      await emitRuntimeTrustCalibration({
        modelId: 'user-context-v1',
        window: new Date().toISOString().slice(0, 10),
        ...trustSignals,
        sampleSize: 1,
        cohortId: 'runtime-user-context',
        actorUserId: userId,
      });
    } catch (telemetryError) {
      console.warn('[user-context] Failed to append runtime telemetry:', telemetryError);
    }

    return NextResponse.json({ success: true, data: context });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}