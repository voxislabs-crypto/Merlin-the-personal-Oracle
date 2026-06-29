import { NextResponse } from 'next/server';

import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { buildPredictiveTransitBundle } from '@/lib/astrology/predictive-transits';
import { buildExplainabilityPacket } from '@/lib/astrology/pressure-engine';
import { applyPlanetResonanceWeights, getResonanceWeightsProfile } from '@/lib/astrology/resonance-weights';
import { getAtmospherePatternProfile } from '@/lib/atmosphere/pattern-store.server';
import type { BirthChartData, TransitDriver } from '@/types/astrology';
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

function toTransitDrivers(
  events: Awaited<ReturnType<typeof buildPredictiveTransitBundle>>['events']
): TransitDriver[] {
  return events.slice(0, 3).map((event) => ({
    transitId: event.eventId,
    label: `${event.transit.transitingPlanet} ${event.transit.aspect} ${event.transit.natalPlanet}`,
    strength: event.scores.intensity,
    confidence: event.scores.confidence,
    reason: event.narrative.whisper,
  }));
}

export async function POST(request: Request) {
  const hasAccess = await validateFeatureAccess('canAccessTransits');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Pressure windows are not available on the free tier',
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
      console.warn('[PressureWindow] Swiss failed, using fallback:', error);
    }

    const predictive = await buildPredictiveTransitBundle({
      natalPlanets: natalChart.positions || [],
      birthDate,
      mbtiType,
      userId,
      windowDays,
    });

    const emptyResonanceProfile: Awaited<ReturnType<typeof getResonanceWeightsProfile>> = {
      multipliers: {},
      planetBreakdown: {},
      history: [],
      summary: {
        feedbackCount: 0,
        strongestPlanet: undefined,
        strongestMultiplier: undefined,
      },
    };

    const [resonance, patternProfile] = userId
      ? await Promise.all([
          getResonanceWeightsProfile(userId).catch((profileError) => {
            console.warn('[PressureWindow] Resonance profile fallback:', profileError);
            return emptyResonanceProfile;
          }),
          getAtmospherePatternProfile(userId).catch((profileError) => {
            console.warn('[PressureWindow] Pattern profile fallback:', profileError);
            return null;
          }),
        ])
      : [emptyResonanceProfile, null];

    const weightedEvents = applyPlanetResonanceWeights(predictive.events, resonance.multipliers);
    const sortedEvents = [...weightedEvents].sort((a, b) => b.scores.intensity - a.scores.intensity);
    const calibrationProvenance = {
      feedbackCount: resonance.summary.feedbackCount,
      strongestPlanet: resonance.summary.strongestPlanet,
      strongestMultiplier: resonance.summary.strongestMultiplier,
      activePlanetModifiers: Object.entries(resonance.multipliers)
        .filter(([, multiplier]) => typeof multiplier === 'number' && Math.abs(multiplier - 1) > 0.01)
        .map(([planet, multiplier]) => ({ planet, multiplier }))
        .slice(0, 5),
    };

    const globalPressure = sortedEvents.length
      ? Math.round(sortedEvents.reduce((sum, event) => sum + event.scores.intensity, 0) / sortedEvents.length)
      : 0;

    const confidence = sortedEvents.length
      ? Math.round(sortedEvents.reduce((sum, event) => sum + event.scores.confidence, 0) / sortedEvents.length)
      : 0;

    const packet = buildExplainabilityPacket({
      windowStartIso: new Date().toISOString(),
      windowEndIso: new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000).toISOString(),
      globalPressure,
      confidence,
      topDrivers: toTransitDrivers(sortedEvents),
      weightingBreakdown: {
        eventCount: sortedEvents.length,
      },
      personalizationBreakdown: {
        resonanceFeedbackCount: resonance.summary.feedbackCount,
      },
    });

    return NextResponse.json({
      success: true,
      source,
      data: {
        timezoneOffsetHours: appliedOffsetHours,
        explainability: packet,
        calibrationProvenance,
        patternProfile,
        predictive: {
          generatedAt: predictive.generatedAt,
          windowDays: predictive.windowDays,
          events: sortedEvents,
          lunarTiming: predictive.lunarTiming,
          progressedMoon: predictive.progressedMoon,
        },
      },
    });
  } catch (error) {
    console.error('Error generating pressure window:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
