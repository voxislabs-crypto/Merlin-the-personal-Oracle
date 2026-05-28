import { NextRequest, NextResponse } from 'next/server';

import { requireInternalOpsAccess } from '@/lib/internal/ops-auth';
import { latestOpsEvent, listOpsEvents, OPS_EVENT_TYPES, safeParseMetadata } from '@/lib/internal/ops-store';

function buildTimeline(phaseGate: Record<string, unknown> | null, scorecard: Record<string, unknown> | null, rollbacks: Record<string, unknown>[]) {
  const timeline: Array<{ ts: string; text: string; level: 'info' | 'success' | 'warning' | 'danger' }> = [];

  if (scorecard) {
    timeline.push({
      ts: String(scorecard.updatedAt || new Date().toISOString()),
      text: `Scorecard updated for ${String(scorecard.evaluationWindow || 'unknown window')}`,
      level: String(scorecard.status || '') === 'red' ? 'warning' : 'success',
    });
  }

  if (phaseGate) {
    timeline.push({
      ts: String(phaseGate.decidedAt || new Date().toISOString()),
      text: `Phase decision ${String(phaseGate.currentPhase || 'unknown')} -> ${String(phaseGate.targetPhase || 'unknown')}: ${String(phaseGate.decision || 'unknown')}`,
      level: String(phaseGate.decision || '') === 'approve' ? 'success' : 'warning',
    });
  }

  rollbacks.slice(0, 10).forEach((rollback) => {
    timeline.push({
      ts: String(rollback.occurredAt || new Date().toISOString()),
      text: `Rollback ${String(rollback.fromPhase || '?')} -> ${String(rollback.toPhase || '?')} (${String(rollback.trigger || 'unknown')})`,
      level: 'danger',
    });
  });

  return timeline.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

export async function GET(request: NextRequest) {
  const denied = await requireInternalOpsAccess(request);
  if (denied) return denied;

  const [latestScorecardRow, latestPhaseGateRow, latestTrustCalibrationRow, rollbackRows] = await Promise.all([
    latestOpsEvent(OPS_EVENT_TYPES.scorecard),
    latestOpsEvent(OPS_EVENT_TYPES.phaseGate),
    latestOpsEvent(OPS_EVENT_TYPES.trustCalibration),
    listOpsEvents(OPS_EVENT_TYPES.rollbackEvent, 25),
  ]);

  const scorecard = latestScorecardRow ? safeParseMetadata<Record<string, unknown>>(latestScorecardRow.metadataJson) : null;
  const phaseGate = latestPhaseGateRow ? safeParseMetadata<Record<string, unknown>>(latestPhaseGateRow.metadataJson) : null;
  const trustCalibration = latestTrustCalibrationRow
    ? safeParseMetadata<Record<string, unknown>>(latestTrustCalibrationRow.metadataJson)
    : null;
  const rollbacks = rollbackRows
    .map((row) => safeParseMetadata<Record<string, unknown>>(row.metadataJson))
    .filter((item): item is Record<string, unknown> => item !== null);

  const metrics = {
    modelId: String(phaseGate?.modelId || scorecard?.modelId || 'unknown-model'),
    phase: String(phaseGate?.currentPhase || 'baseline'),
    trustScore: Number(phaseGate?.metrics && typeof phaseGate.metrics === 'object' ? (phaseGate.metrics as Record<string, unknown>).trustScore : scorecard?.trust && typeof scorecard.trust === 'object' ? (scorecard.trust as Record<string, unknown>).trustScore : 0),
    hallucinationRate: Number(phaseGate?.metrics && typeof phaseGate.metrics === 'object' ? (phaseGate.metrics as Record<string, unknown>).hallucinationRate : scorecard?.quality && typeof scorecard.quality === 'object' ? (scorecard.quality as Record<string, unknown>).hallucinationRate : 0),
    responseCoherence: Number(phaseGate?.metrics && typeof phaseGate.metrics === 'object' ? (phaseGate.metrics as Record<string, unknown>).responseCoherence : scorecard?.quality && typeof scorecard.quality === 'object' ? (scorecard.quality as Record<string, unknown>).coherenceScore : 0),
    emotionalConsistency: Number(phaseGate?.metrics && typeof phaseGate.metrics === 'object' ? (phaseGate.metrics as Record<string, unknown>).emotionalConsistency : scorecard?.trust && typeof scorecard.trust === 'object' ? (scorecard.trust as Record<string, unknown>).emotionalConsistency : 0),
    driftScore: Number(phaseGate?.metrics && typeof phaseGate.metrics === 'object' ? (phaseGate.metrics as Record<string, unknown>).driftScore : scorecard?.quality && typeof scorecard.quality === 'object' ? (scorecard.quality as Record<string, unknown>).driftScore : 0),
    rollbackTriggered: rollbacks.length > 0,
  };

  const gateChecks = phaseGate?.gateChecks && typeof phaseGate.gateChecks === 'object'
    ? Object.entries(phaseGate.gateChecks as Record<string, unknown>).map(([key, value]) => ({
        key,
        pass: Boolean(value && typeof value === 'object' && (value as Record<string, unknown>).pass),
      }))
    : [];

  return NextResponse.json({
    success: true,
    data: {
      metrics,
      gateChecks,
      scorecard,
      phaseGate,
      trustCalibration,
      recentRollbacks: rollbacks,
      timeline: buildTimeline(phaseGate, scorecard, rollbacks),
      schemaStatus: {
        scorecard: scorecard !== null,
        phaseGate: phaseGate !== null,
        rollbackEvent: true,
        trustCalibration: trustCalibration !== null,
      },
    },
  });
}
