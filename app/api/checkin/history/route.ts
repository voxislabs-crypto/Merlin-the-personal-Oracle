import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/prisma';

function safeParseJson(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function GET(request: Request) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId') || authUserId;
    if (requestedUserId !== authUserId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const daysRaw = Number(searchParams.get('days') || '30');
    const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 120) : 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await prisma.userInteractionEvent.findMany({
      where: {
        userId: requestedUserId,
        type: 'checkin_entry',
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        content: true,
        metadataJson: true,
        createdAt: true,
      },
    });

    const entries = records.map((row) => {
      const meta = safeParseJson(row.metadataJson);
      return {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        mood: meta.mood ?? null,
        stress: meta.stress ?? null,
        energy: meta.energy ?? null,
        confidence: meta.confidence ?? null,
        domains: meta.domains ?? {},
        notes: (meta.notes as string | null) ?? row.content ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: requestedUserId,
        windowDays: days,
        total: entries.length,
        entries,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
