import { NextResponse } from 'next/server';
import { getUserContextSnapshot, upsertUserContextSnapshot } from '@/lib/user-context';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    const context = await getUserContextSnapshot(userId);
    return NextResponse.json({ success: true, data: context });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, situation, mood, goals, lastFeedbackNotes } = body || {};

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    const context = await upsertUserContextSnapshot({
      userId,
      situation,
      mood,
      goals,
      lastFeedbackNotes,
    });

    return NextResponse.json({ success: true, data: context });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}