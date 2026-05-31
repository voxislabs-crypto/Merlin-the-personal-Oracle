import { NextRequest, NextResponse } from 'next/server';

import { requireInternalOpsAccess } from '@/lib/internal/ops-auth';
import { appendOpsEvent, listOpsEvents, OPS_EVENT_TYPES, safeParseMetadata } from '@/lib/internal/ops-store';
import { validatePhaseGate } from '@/lib/internal/ops-validators';

function parseLimit(input: string | null): number {
  const num = Number(input || '20');
  if (!Number.isFinite(num)) return 20;
  return Math.max(1, Math.min(Math.round(num), 200));
}

export async function GET(request: NextRequest) {
  const denied = await requireInternalOpsAccess(request);
  if (denied) return denied;

  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));
  const rows = await listOpsEvents(OPS_EVENT_TYPES.phaseGate, limit);

  const data = rows
    .map((row) => {
      const payload = safeParseMetadata<Record<string, unknown>>(row.metadataJson);
      if (!payload) return null;
      return {
        id: row.id,
        actorUserId: row.userId,
        createdAt: row.createdAt,
        payload,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return NextResponse.json({ success: true, count: data.length, data });
}

export async function POST(request: NextRequest) {
  const denied = await requireInternalOpsAccess(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const result = validatePhaseGate(body);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid phase gate payload', details: result.errors },
        { status: 400 }
      );
    }

    await appendOpsEvent({
      type: OPS_EVENT_TYPES.phaseGate,
      payload: body,
      content: `Phase gate ${String((body as { currentPhase?: string }).currentPhase || 'unknown')} -> ${String((body as { targetPhase?: string }).targetPhase || 'unknown')}`,
    });

    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save phase gate' },
      { status: 500 }
    );
  }
}
