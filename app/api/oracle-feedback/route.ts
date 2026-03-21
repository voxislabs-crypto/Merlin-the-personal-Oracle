import { NextResponse } from 'next/server';
import { detectPatternFromText, logInteractionEvent } from '@/lib/pattern-mirror';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, source = 'daily_oracle', message = '', feedback } = body || {};

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    if (!feedback || !['hit', 'missed'].includes(feedback)) {
      return NextResponse.json({ success: false, error: 'Invalid feedback' }, { status: 400 });
    }

    const detected = detectPatternFromText(message || feedback);

    await logInteractionEvent({
      userId,
      type: source,
      content: message,
      detectedPattern: detected.key,
      confidence: detected.confidence,
      feedbackSignal: feedback,
      metadata: { source },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
