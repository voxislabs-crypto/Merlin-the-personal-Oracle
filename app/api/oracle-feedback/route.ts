import { NextResponse } from 'next/server';
import { recordReadingSignal } from '@/lib/feedback/record-reading-signal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, source = 'daily_oracle', message = '', feedback, date, mbtiType } = body || {};

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    if (!feedback || !['hit', 'missed'].includes(feedback)) {
      return NextResponse.json({ success: false, error: 'Invalid feedback' }, { status: 400 });
    }

    const day = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : 'today';
    const stored = await recordReadingSignal({
      userId,
      source,
      aspectId: `daily-oracle-${day}`,
      theme: 'daily-oracle',
      signal: feedback,
      message: typeof message === 'string' ? message : '',
      mbtiType: typeof mbtiType === 'string' ? mbtiType : undefined,
    });

    if (!stored.pattern && !stored.resonance) {
      return NextResponse.json(
        { success: false, error: 'Feedback could not be stored', ...stored },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, ...stored });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
