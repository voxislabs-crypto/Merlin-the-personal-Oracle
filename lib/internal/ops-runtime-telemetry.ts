import { appendOpsEvent, OPS_EVENT_TYPES } from '@/lib/internal/ops-store';
import { validateTrustCalibration } from '@/lib/internal/ops-validators';

interface TrustTelemetryInput {
  modelId: string;
  window: string;
  overallTrustScore: number;
  overallCalibrationError: number;
  hallucinationRate: number;
  emotionalConsistency: number;
  responseCoherence: number;
  sampleSize?: number;
  cohortId: string;
  actorUserId?: string;
  alerts?: Array<{ type: 'drift' | 'cohort_regression' | 'trust_drop' | 'data_quality'; message: string }>;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const toWindow = (date = new Date()): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function emitRuntimeTrustCalibration(input: TrustTelemetryInput): Promise<void> {
  const payload = {
    modelId: input.modelId,
    window: input.window || toWindow(),
    overallTrustScore: clamp01(input.overallTrustScore),
    overallCalibrationError: clamp01(input.overallCalibrationError),
    cohorts: [
      {
        cohortId: input.cohortId,
        sampleSize: Math.max(1, input.sampleSize || 1),
        trustScore: clamp01(input.overallTrustScore),
        calibrationError: clamp01(input.overallCalibrationError),
        hallucinationRate: clamp01(input.hallucinationRate),
        emotionalConsistency: clamp01(input.emotionalConsistency),
        responseCoherence: clamp01(input.responseCoherence),
      },
    ],
    alerts: input.alerts || [],
    generatedAt: new Date().toISOString(),
  };

  const validation = validateTrustCalibration(payload);
  if (!validation.valid) {
    console.warn('[ops-runtime-telemetry] Dropping invalid trust-calibration payload:', validation.errors);
    return;
  }

  await appendOpsEvent({
    type: OPS_EVENT_TYPES.trustCalibration,
    payload,
    actorUserId: input.actorUserId,
    content: `Runtime trust calibration (${input.cohortId}) ${payload.window}`,
  });
}

export function computeLegacyForecastTrustSignals(params: {
  source: 'swiss-real' | 'mock-fallback';
  hadTransitEnrichment: boolean;
}): Pick<
  TrustTelemetryInput,
  'overallTrustScore' | 'overallCalibrationError' | 'hallucinationRate' | 'emotionalConsistency' | 'responseCoherence' | 'alerts'
> {
  const trustScore = params.source === 'swiss-real' ? 0.84 : 0.62;
  const responseCoherence = params.hadTransitEnrichment ? 0.82 : 0.72;
  const emotionalConsistency = 0.78;
  const hallucinationRate = params.source === 'swiss-real' ? 0.07 : 0.16;
  const overallCalibrationError = 1 - trustScore;

  const alerts: TrustTelemetryInput['alerts'] = [];
  if (params.source !== 'swiss-real') {
    alerts.push({
      type: 'data_quality',
      message: 'Legacy forecast used fallback engine path.',
    });
  }

  return {
    overallTrustScore: trustScore,
    overallCalibrationError,
    hallucinationRate,
    emotionalConsistency,
    responseCoherence,
    alerts,
  };
}

export function computeUserContextTrustSignals(params: {
  hasSituation: boolean;
  hasMood: boolean;
  goalsCount: number;
  hasFeedbackNotes: boolean;
}): Pick<
  TrustTelemetryInput,
  'overallTrustScore' | 'overallCalibrationError' | 'hallucinationRate' | 'emotionalConsistency' | 'responseCoherence' | 'alerts'
> {
  const filledSignals = [params.hasSituation, params.hasMood, params.goalsCount > 0, params.hasFeedbackNotes].filter(Boolean).length;
  const completeness = filledSignals / 4;

  const overallTrustScore = clamp01(0.45 + completeness * 0.45);
  const responseCoherence = clamp01(0.5 + completeness * 0.4);
  const emotionalConsistency = clamp01(0.4 + completeness * 0.4);
  const hallucinationRate = clamp01(0.2 - completeness * 0.12);
  const overallCalibrationError = clamp01(1 - overallTrustScore);

  const alerts: TrustTelemetryInput['alerts'] = [];
  if (completeness < 0.5) {
    alerts.push({
      type: 'data_quality',
      message: 'User context profile is sparse; confidence should be reduced.',
    });
  }

  return {
    overallTrustScore,
    overallCalibrationError,
    hallucinationRate,
    emotionalConsistency,
    responseCoherence,
    alerts,
  };
}
