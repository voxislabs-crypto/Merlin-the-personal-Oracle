import { NextResponse } from 'next/server';
import { logInteractionEvent } from '@/lib/pattern-mirror';

interface DashboardEventRequest {
  userId?: string;
  eventName?: string;
  detail?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DashboardEventRequest;
    const { userId, eventName, detail } = body || {};

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    if (!eventName || typeof eventName !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing eventName' }, { status: 400 });
    }

    await logInteractionEvent({
      userId,
      type: 'dashboard_event',
      content: eventName,
      metadata: {
        source: 'dashboard',
        eventName,
        detail: detail || {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
