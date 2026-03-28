import { NextResponse } from 'next/server';
import { logInteractionEvent } from '@/lib/pattern-mirror';
import { prisma } from '@/lib/prisma';

interface DashboardEventRequest {
  userId?: string;
  eventName?: string;
  detail?: Record<string, unknown>;
}

function parseEventName(content: string | null, metadataJson: string | null): string {
  if (content && content.trim()) return content;
  if (!metadataJson) return 'unknown';

  try {
    const metadata = JSON.parse(metadataJson) as { eventName?: string };
    return metadata.eventName || 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const daysRaw = Number(searchParams.get('days') || '30');
    const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 120) : 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.userInteractionEvent.findMany({
      where: {
        type: 'dashboard_event',
        createdAt: { gte: since },
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 2500,
      select: {
        id: true,
        userId: true,
        content: true,
        metadataJson: true,
        createdAt: true,
      },
    });

    const countsByEvent: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    for (const event of events) {
      uniqueUsers.add(event.userId);
      const eventName = parseEventName(event.content, event.metadataJson);
      countsByEvent[eventName] = (countsByEvent[eventName] || 0) + 1;
    }

    const recentEvents = events.slice(0, 60).map((event) => ({
      id: event.id,
      userId: event.userId,
      eventName: parseEventName(event.content, event.metadataJson),
      createdAt: event.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        windowDays: days,
        totalEvents: events.length,
        uniqueUsers: uniqueUsers.size,
        countsByEvent,
        funnel: {
          firstChart: countsByEvent.dashboard_first_chart_completed || 0,
          firstAsk: countsByEvent.dashboard_first_ask_submitted || 0,
          onboardingComplete: countsByEvent.dashboard_onboarding_completed || 0,
          dailyCheckins: countsByEvent.dashboard_daily_checkin || 0,
        },
        recentEvents,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
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
