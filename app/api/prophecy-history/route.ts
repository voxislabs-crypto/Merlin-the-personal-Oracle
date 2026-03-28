import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function safeParseJson(input: string | null) {
  if (!input) return null;
  try {
    return JSON.parse(input) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const events = await prisma.userInteractionEvent.findMany({
      where: {
        userId,
        type: 'prophecy_generation',
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: {
        id: true,
        content: true,
        metadataJson: true,
        feedbackSignal: true,
        createdAt: true,
      },
    });

    const history = events.map((event) => {
      const metadata = safeParseJson(event.metadataJson);
      return {
        id: event.id,
        title: event.content || 'Prophecy',
        prophecy: typeof metadata?.prophecy === 'string' ? metadata.prophecy : '',
        style: metadata?.style || 'omen',
        era: metadata?.era || 'babylonian',
        signals: metadata?.signals || null,
        meter: metadata?.meter || null,
        fulfilled: event.feedbackSignal === 'fulfilled',
        createdAt: event.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const id = body?.id as string | undefined;
    const fulfilled = Boolean(body?.fulfilled);

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing history id' }, { status: 400 });
    }

    const updated = await prisma.userInteractionEvent.updateMany({
      where: {
        id,
        userId,
        type: 'prophecy_generation',
      },
      data: {
        feedbackSignal: fulfilled ? 'fulfilled' : 'open',
      },
    });

    if (!updated.count) {
      return NextResponse.json({ success: false, error: 'History item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
