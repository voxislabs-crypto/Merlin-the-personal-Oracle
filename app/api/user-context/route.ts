import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserContextSnapshot, upsertUserContextSnapshot } from '@/lib/user-context';

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
      console.warn('[user-context] Failed to load context, returning empty snapshot:', dbError);
      context = null;
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
      console.warn('[user-context] Failed to persist context, returning no-op success:', dbError);
      context = null;
    }

    return NextResponse.json({ success: true, data: context });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}