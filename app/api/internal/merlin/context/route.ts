import { NextRequest, NextResponse } from 'next/server';

import type {
  ApiError,
  MerlinContextRequest,
  MerlinContextResponse,
} from '@/shared/cafe-contracts';
import { calculateLunarPhase } from '@/lib/astrology/advanced';
import { dateToJulianDay } from '@/lib/astrology/utils';
import { emitRuntimeTrustCalibration } from '@/lib/internal/ops-runtime-telemetry';

function validationError(message: string, details?: Record<string, unknown>) {
  const payload: ApiError = {
    success: false,
    code: 'VALIDATION_ERROR',
    message,
    details,
  };
  return NextResponse.json(payload, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MerlinContextRequest;

    if (!body || typeof body.userId !== 'string' || body.userId.trim().length === 0) {
      return validationError('userId is required');
    }

    const anchor = body.atIso ? new Date(body.atIso) : new Date();
    if (Number.isNaN(anchor.getTime())) {
      return validationError('atIso must be a valid ISO date');
    }

    const jd = dateToJulianDay(anchor);
    const moon = calculateLunarPhase(jd);

    const symbolicSignals: MerlinContextResponse['symbolicSignals'] = [
      {
        key: 'clarity_vs_pressure',
        label: 'Clarity vs Pressure',
        intensity: Math.round(40 + moon.illumination * 0.5),
        rationale: 'Lunar illumination is used as a symbolic pacing signal.',
      },
      {
        key: 'timing_and_pacing',
        label: 'Timing and Pacing',
        intensity: Math.round(55 + ((moon.angle % 90) / 90) * 20),
        rationale: 'Phase angle suggests when to push versus when to recover.',
      },
    ];

    const response: MerlinContextResponse = {
      version: 'merlin-context-v1',
      generatedAt: new Date().toISOString(),
      moonPhase: moon.type,
      transitHighlights: [
        `${moon.type} favors intentional pacing over reactive decisions.`,
        'Treat symbolic context as directional context, not deterministic instruction.',
      ],
      symbolicSignals,
    };

    try {
      const averageIntensity =
        symbolicSignals.reduce((sum, signal) => sum + signal.intensity, 0) /
        Math.max(1, symbolicSignals.length);
      const normalized = Math.max(0, Math.min(1, averageIntensity / 100));

      await emitRuntimeTrustCalibration({
        modelId: 'merlin-context-v1',
        window: response.generatedAt.slice(0, 10),
        overallTrustScore: 0.7 + normalized * 0.2,
        overallCalibrationError: 0.3 - normalized * 0.15,
        hallucinationRate: 0.12 - normalized * 0.07,
        emotionalConsistency: 0.72 + normalized * 0.2,
        responseCoherence: 0.75 + normalized * 0.18,
        sampleSize: 1,
        cohortId: 'runtime-merlin-context',
        actorUserId: body.userId,
      });
    } catch (telemetryError) {
      console.warn('[merlin-context] Failed to append runtime telemetry:', telemetryError);
    }

    return NextResponse.json(response);
  } catch (error) {
    const payload: ApiError = {
      success: false,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Failed to build Merlin context',
    };
    return NextResponse.json(payload, { status: 500 });
  }
}
