import { NextResponse } from 'next/server';
import { detectPatternFromText, logInteractionEvent } from '@/lib/pattern-mirror';
import { resonanceDB } from '@/lib/resonance-database';
import { getUserContextSnapshot, upsertUserContextSnapshot } from '@/lib/user-context';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, aspectId, theme, feedback, mbtiType } = body || {};

    if (!userId || !aspectId || !theme || !feedback) {
      return NextResponse.json(
        { success: false, error: 'Missing feedback payload fields' },
        { status: 400 }
      );
    }

    await resonanceDB.ensureUser({
      userId,
      mbtiType,
      createdAt: new Date(),
    });

    await resonanceDB.processFeedback(userId, aspectId, theme, feedback);

    const note =
      feedback?.notes || `${aspectId}: ${feedback?.resonated ? 'landed' : 'missed'} (${theme})`;
    const detected = detectPatternFromText(note);
    await logInteractionEvent({
      userId,
      type: 'resonance_feedback',
      content: note,
      detectedPattern: detected.key,
      confidence: detected.confidence,
      feedbackSignal: feedback?.resonated ? 'up' : 'down',
      metadata: { source: 'resonance_feedback', aspectId, theme },
    });

    const existingContext = await getUserContextSnapshot(userId);
    await upsertUserContextSnapshot({
      userId,
      situation: existingContext?.situation || '',
      mood: existingContext?.mood || '',
      goals: existingContext?.goals || [],
      lastFeedbackNotes: note,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
