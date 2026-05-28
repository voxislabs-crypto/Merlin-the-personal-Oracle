import { prisma } from '@/lib/prisma';

export const OPS_EVENT_TYPES = {
  scorecard: 'ops_scorecard_v1',
  phaseGate: 'ops_phase_gate_v1',
  rollbackEvent: 'ops_rollback_event_v1',
  trustCalibration: 'ops_trust_calibration_v1',
} as const;

export type OpsEventType = (typeof OPS_EVENT_TYPES)[keyof typeof OPS_EVENT_TYPES];

export async function appendOpsEvent(params: {
  type: OpsEventType;
  payload: unknown;
  content: string;
  actorUserId?: string;
  confidence?: number | null;
}) {
  const { type, payload, content, actorUserId, confidence } = params;

  await prisma.userInteractionEvent.create({
    data: {
      userId: actorUserId || 'internal-ops-system',
      type,
      content,
      confidence: confidence ?? null,
      metadataJson: JSON.stringify(payload),
    },
  });
}

export async function listOpsEvents(type: OpsEventType, limit: number) {
  return prisma.userInteractionEvent.findMany({
    where: { type },
    orderBy: { createdAt: 'desc' },
    take: Math.max(1, Math.min(limit, 200)),
    select: {
      id: true,
      userId: true,
      content: true,
      metadataJson: true,
      createdAt: true,
      type: true,
    },
  });
}

export async function latestOpsEvent(type: OpsEventType) {
  const rows = await listOpsEvents(type, 1);
  return rows[0] || null;
}

export function safeParseMetadata<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
