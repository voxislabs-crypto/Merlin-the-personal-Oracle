import { NextResponse } from 'next/server';

import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { buildPredictiveTransitBundle } from '@/lib/astrology/predictive-transits';
import { buildExplainabilityPacket } from '@/lib/astrology/pressure-engine';
import { buildWeatherForecastReport } from '@/lib/astrology/pressure-engine/weather-language';
import { applyPlanetResonanceWeights, getResonanceWeightsProfile } from '@/lib/astrology/resonance-weights';
import type { BirthChartData, DomainScore } from '@/types/astrology';
import { validateFeatureAccess } from '@/lib/subscription-validation';

function normalizeUtcBirth(birthDate: string, birthTime: string, timezoneOffset?: number) {
  if (typeof timezoneOffset !== 'number' || Number.isNaN(timezoneOffset)) {
    return { utcBirthDate: birthDate, utcBirthTime: birthTime, appliedOffsetHours: null as number | null };
  }

  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  const offsetHours = Math.abs(timezoneOffset) > 16 ? timezoneOffset / 60 : timezoneOffset;

  const localMs = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const utcMs = localMs - offsetHours * 60 * 60 * 1000;
  const utcDate = new Date(utcMs);

  const utcBirthDate = utcDate.toISOString().slice(0, 10);
  const utcBirthTime = `${utcDate.getUTCHours().toString().padStart(2, '0')}:${utcDate
    .getUTCMinutes()
    .toString()
    .padStart(2, '0')}`;

  return { utcBirthDate, utcBirthTime, appliedOffsetHours: offsetHours };
}

function buildDailyDomainSeries(days: number, baseline: DomainScore[]) {
  return Array.from({ length: days }).map((_, idx) => {
    const date = new Date(Date.now() + idx * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return {
      date,
      domains: baseline,
    };
  });
}

function mapWindowDaysToHorizonHours(windowDays: number): 24 | 72 | 168 | 720 {
  if (windowDays <= 1) {
    return 24;
  }

  if (windowDays <= 3) {
    return 72;
  }

  if (windowDays <= 7) {
    return 168;
  }

  return 720;
}

export async function POST(request: Request) {
  const hasAccess = await validateFeatureAccess('canAccessTransits');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Domain forecast is not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon, timezoneOffset, mbtiType, userId, windowDays = 7 } = body;

    if (!birthDate || !birthTime) {
      return NextResponse.json({ success: false, error: 'Missing birth date or time' }, { status: 400 });
    }

    const { utcBirthDate, utcBirthTime, appliedOffsetHours } = normalizeUtcBirth(
      birthDate,
      birthTime,
      timezoneOffset
    );

    let natalChart: BirthChartData;
    let source: 'swiss-real' | 'mock-fallback' = 'swiss-real';

    try {
      natalChart = calculateBirthChart(utcBirthDate, utcBirthTime, lat || 0, lon || 0) as BirthChartData;
    } catch (error) {
      source = 'mock-fallback';
      natalChart = calculateBirthChartFallback(utcBirthDate, utcBirthTime, lat || 0, lon || 0) as BirthChartData;
      console.warn('[DomainForecast] Swiss failed, using fallback:', error);
    }

    const predictive = await buildPredictiveTransitBundle({
      natalPlanets: natalChart.positions || [],
      birthDate,
      mbtiType,
      userId,
      windowDays,
    });

    const resonance = userId
      ? await getResonanceWeightsProfile(userId)
      : {
          multipliers: {},
          planetBreakdown: {},
          history: [],
          summary: { feedbackCount: 0 },
        };

    const weightedEvents = applyPlanetResonanceWeights(predictive.events, resonance.multipliers);
    const sortedEvents = [...weightedEvents].sort((a, b) => b.scores.intensity - a.scores.intensity);

    const globalPressure = sortedEvents.length
      ? Math.round(sortedEvents.reduce((sum, event) => sum + event.scores.intensity, 0) / sortedEvents.length)
      : 0;

    const confidence = sortedEvents.length
      ? Math.round(sortedEvents.reduce((sum, event) => sum + event.scores.confidence, 0) / sortedEvents.length)
      : 0;

    const explainability = buildExplainabilityPacket({
      windowStartIso: new Date().toISOString(),
      windowEndIso: new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000).toISOString(),
      globalPressure,
      confidence,
    });

    const weatherReport = buildWeatherForecastReport({
      generatedAt: new Date().toISOString(),
      globalPressure,
      confidence,
      domainScores: explainability.domainScores,
      defaultHours: mapWindowDaysToHorizonHours(windowDays),
      provenance: {
        source: source === 'swiss-real' ? 'domain-forecast:swiss-real' : 'domain-forecast:fallback',
        signalSources: [
          'natal chart',
          'predictive transits',
          'resonance weights',
          'merlin context',
        ],
        confidence,
        generatedAt: new Date().toISOString(),
        fallbackUsed: source !== 'swiss-real',
        freshnessHours: windowDays * 24,
        notes: [
          appliedOffsetHours === null
            ? 'timezone offset unavailable; using provided local time'
            : `timezone offset ${appliedOffsetHours}h applied`,
        ],
      },
    });

    return NextResponse.json({
      success: true,
      source,
      data: {
        timezoneOffsetHours: appliedOffsetHours,
        generatedAt: new Date().toISOString(),
        windowDays,
        domains: explainability.domainScores,
        daily: buildDailyDomainSeries(windowDays, explainability.domainScores),
        weather: weatherReport,
      },
    });
  } catch (error) {
    console.error('Error generating domain forecast:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
