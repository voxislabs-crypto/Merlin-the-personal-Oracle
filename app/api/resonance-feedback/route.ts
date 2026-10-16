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

    const note =
      feedback?.notes || `${aspectId}: ${feedback?.resonated ? 'landed' : 'missed'} (${theme})`;
    const kind =
      feedback?.kind === 'usefulness' || feedback?.kind === 'accuracy' ? feedback.kind : 'resonance';

    // Accuracy is an evaluation log. It must not move resonance weights,
    // pattern tags, or the user-context note personalization reads.
    if (kind === 'accuracy') {
      await logInteractionEvent({
        userId,
        type: 'evaluation_log',
        content: note,
        feedbackSignal: feedback?.resonated ? 'accurate' : 'missed',
        metadata: {
          source: 'evaluation_log',
          aspectId,
          theme,
          kind: 'accuracy',
          personalization: false,
        },
      });
      return NextResponse.json({ success: true, stored: 'evaluation_log' });
    }

    const rawScore = Number(feedback?.accuracyScore);
    const weightFeedback =
      kind === 'usefulness'
        ? {
            ...feedback,
            accuracyScore: Math.min(0.65, Math.max(0, Number.isFinite(rawScore) ? rawScore : 0.55)),
          }
        : feedback;
    const weightAspectId = kind === 'usefulness' ? `${aspectId}:usefulness` : aspectId;

    await resonanceDB.ensureUser({
      userId,
      mbtiType,
      createdAt: new Date(),
    });

    await resonanceDB.processFeedback(userId, weightAspectId, theme, weightFeedback);

    const detected = detectPatternFromText(note);
    await logInteractionEvent({
      userId,
      type: 'resonance_feedback',
      content: note,
      detectedPattern: detected.key,
      confidence: detected.confidence,
      feedbackSignal: feedback?.resonated ? 'up' : 'down',
      metadata: { source: 'resonance_feedback', aspectId, theme, kind },
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
