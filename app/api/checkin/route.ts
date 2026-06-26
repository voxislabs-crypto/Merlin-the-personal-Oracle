import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/prisma';

const DOMAIN_KEYS = ['love', 'career', 'money', 'family', 'health', 'self'] as const;

type DomainKey = (typeof DOMAIN_KEYS)[number];

type DomainRatings = Partial<Record<DomainKey, number>>;

interface CheckinRequest {
  userId?: string;
  timestamp?: string;
  mood?: number;
  stress?: number;
  energy?: number;
  confidence?: number;
  domains?: DomainRatings;
  notes?: string;
}

function isValidScale(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 10;
}

function normalizeDomains(domains: unknown): DomainRatings {
  if (!domains || typeof domains !== 'object') return {};

  const entries = Object.entries(domains as Record<string, unknown>).filter(([key, value]) => {
    return DOMAIN_KEYS.includes(key as DomainKey) && isValidScale(value);
  });

  return Object.fromEntries(entries) as DomainRatings;
}

export async function POST(request: Request) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CheckinRequest;
    const targetUserId = body.userId || authUserId;

    if (targetUserId !== authUserId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (!isValidScale(body.mood) || !isValidScale(body.stress) || !isValidScale(body.energy)) {
      return NextResponse.json(
        { success: false, error: 'mood, stress, and energy must be numbers from 1 to 10' },
        { status: 400 }
      );
    }

    if (body.confidence !== undefined && !isValidScale(body.confidence)) {
      return NextResponse.json(
        { success: false, error: 'confidence must be a number from 1 to 10 when provided' },
        { status: 400 }
      );
    }

    const domains = normalizeDomains(body.domains);
    const createdAt = body.timestamp ? new Date(body.timestamp) : new Date();
    if (Number.isNaN(createdAt.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid timestamp' }, { status: 400 });
    }

    const event = await prisma.userInteractionEvent.create({
      data: {
        userId: targetUserId,
        type: 'checkin_entry',
        content: body.notes?.slice(0, 280) || 'checkin',
        metadataJson: JSON.stringify({
          mood: body.mood,
          stress: body.stress,
          energy: body.energy,
          confidence: body.confidence ?? null,
          domains,
          notes: body.notes || null,
          source: 'dashboard_checkin',
        }),
        createdAt,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        userId: targetUserId,
        createdAt: event.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
