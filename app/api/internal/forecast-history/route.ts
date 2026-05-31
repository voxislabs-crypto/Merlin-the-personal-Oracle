import { NextRequest, NextResponse } from 'next/server';

import type { ApiError, CafeDimensionScores, TimeHorizonHours } from '@/shared/cafe-contracts';
import { prisma } from '@/lib/prisma';
import { emitRuntimeTrustCalibration } from '@/lib/internal/ops-runtime-telemetry';

interface ForecastHistoryRecord {
  generatedAt: string;
  horizonHours: TimeHorizonHours;
  phase: string;
  cafeIndex: number;
  dimensions: CafeDimensionScores;
  journalEmbeddingRef?: string;
}

interface AppendHistoryRequest {
  userId: string;
  record: ForecastHistoryRecord;
}

interface QueryHistoryRequest {
  userId: string;
  limit?: number;
  fromIso?: string;
  toIso?: string;
}

const FORECAST_EVENT_TYPE = 'cafe_forecast_v1';

function errorResponse(code: ApiError['code'], message: string, status: number, details?: Record<string, unknown>) {
  const payload: ApiError = {
    success: false,
    code,
    message,
    details,
  };
  return NextResponse.json(payload, { status });
}

function isValidDate(iso: string | undefined): boolean {
  if (!iso) return true;
  const date = new Date(iso);
  return !Number.isNaN(date.getTime());
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AppendHistoryRequest | QueryHistoryRequest;

    if (!body || typeof body.userId !== 'string' || body.userId.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'userId is required', 400);
    }

    if ('record' in body && body.record) {
      const record = body.record;
      if (!isValidDate(record.generatedAt)) {
        return errorResponse('VALIDATION_ERROR', 'record.generatedAt must be valid ISO date', 400);
      }

      if (typeof record.cafeIndex !== 'number' || record.cafeIndex < 0 || record.cafeIndex > 100) {
        return errorResponse('VALIDATION_ERROR', 'record.cafeIndex must be in range 0..100', 400);
      }

      const metadataJson = JSON.stringify({
        generatedAt: record.generatedAt,
        horizonHours: record.horizonHours,
        phase: record.phase,
        cafeIndex: record.cafeIndex,
        dimensions: record.dimensions,
        journalEmbeddingRef: record.journalEmbeddingRef,
      });

      await prisma.userInteractionEvent.create({
        data: {
          userId: body.userId,
          type: FORECAST_EVENT_TYPE,
          content: `CAFE ${record.phase} (${record.cafeIndex})`,
          metadataJson,
          confidence: null,
        },
      });

      try {
        const confidenceEstimate = Math.max(0, Math.min(1, record.cafeIndex / 100));
        await emitRuntimeTrustCalibration({
          modelId: 'forecast-history-v1',
          window: record.generatedAt.slice(0, 10),
          overallTrustScore: 0.55 + confidenceEstimate * 0.4,
          overallCalibrationError: 0.45 - confidenceEstimate * 0.3,
          hallucinationRate: 0.22 - confidenceEstimate * 0.15,
          emotionalConsistency: 0.5 + confidenceEstimate * 0.35,
          responseCoherence: 0.58 + confidenceEstimate * 0.32,
          sampleSize: 1,
          cohortId: `runtime-forecast-history-${record.horizonHours}h`,
          actorUserId: body.userId,
        });
      } catch (telemetryError) {
        console.warn('[forecast-history] Failed to append runtime telemetry:', telemetryError);
      }

      const total = await prisma.userInteractionEvent.count({
        where: {
          userId: body.userId,
          type: FORECAST_EVENT_TYPE,
        },
      });

      return NextResponse.json({
        success: true,
        mode: 'append',
        saved: 1,
        total,
      });
    }

    const query = body as QueryHistoryRequest;
    if (!isValidDate(query.fromIso) || !isValidDate(query.toIso)) {
      return errorResponse('VALIDATION_ERROR', 'fromIso/toIso must be valid ISO dates', 400);
    }

    const fromMs = query.fromIso ? new Date(query.fromIso).getTime() : -Infinity;
    const toMs = query.toIso ? new Date(query.toIso).getTime() : Infinity;
    const limit = typeof query.limit === 'number' && query.limit > 0 ? Math.min(query.limit, 365) : 30;

    const rows = await prisma.userInteractionEvent.findMany({
      where: {
        userId: query.userId,
        type: FORECAST_EVENT_TYPE,
        createdAt: {
          gte: Number.isFinite(fromMs) ? new Date(fromMs) : undefined,
          lte: Number.isFinite(toMs) ? new Date(toMs) : undefined,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        metadataJson: true,
      },
    });

    const data = rows
      .map((row) => {
        try {
          const parsed = JSON.parse(row.metadataJson || '{}') as ForecastHistoryRecord;
          if (!parsed.generatedAt || typeof parsed.cafeIndex !== 'number') {
            return null;
          }
          return parsed;
        } catch {
          return null;
        }
      })
      .filter((item): item is ForecastHistoryRecord => item !== null);

    return NextResponse.json({
      success: true,
      mode: 'query',
      total: data.length,
      data,
      storage: 'prisma-user-interaction-event',
    });
  } catch (error) {
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to access forecast history',
      500
    );
  }
}
