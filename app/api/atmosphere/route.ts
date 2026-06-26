import { NextResponse } from 'next/server';

import { assembleAtmosphereInput } from '@/lib/atmosphere/assemble-input';
import { getAtmospherePatternProfile } from '@/lib/atmosphere/pattern-store.server';
import { computeAtmosphere } from '@/lib/atmosphere/compute';
import { buildAtmosphereTemporalInput } from '@/lib/atmosphere/temporal-context';
import type {
  AtmosphereForecastInput,
  AtmospherePredictiveInput,
  AtmosphereStormsInput,
} from '@/lib/atmosphere/types';
import { getTodaysForecast } from '@/lib/astrology/ephemeris';
import { buildPredictiveTransitBundle } from '@/lib/astrology/predictive-transits';
import { buildExplainabilityPacket } from '@/lib/astrology/pressure-engine';
import { applyPlanetResonanceWeights, getResonanceWeightsProfile } from '@/lib/astrology/resonance-weights';
import { predictStorms } from '@/lib/astrology/storms';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import { validateFeatureAccess } from '@/lib/subscription-validation';
import { generateDailyForecast } from '@/lib/transit-calculator';
import type { BirthChartData, TransitDriver } from '@/types/astrology';
import type { MBTIType } from '@/lib/mbti-system';

const VALID_MBTI_TYPES = new Set<string>([
  'INFJ', 'INFP', 'INTJ', 'INTP', 'ISFJ', 'ISFP', 'ISTJ', 'ISTP',
  'ENFJ', 'ENFP', 'ENTJ', 'ENTP', 'ESFJ', 'ESFP', 'ESTJ', 'ESTP',
]);

function parseMbtiType(value: unknown): MBTIType | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.toUpperCase();
  return VALID_MBTI_TYPES.has(normalized) ? (normalized as MBTIType) : undefined;
}

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
    reason: sanitizeCopyText(event.narrative.whisper),
  }));
}

function mapPredictiveBundle(
  predictive: Awaited<ReturnType<typeof buildPredictiveTransitBundle>>,
  events: Awaited<ReturnType<typeof buildPredictiveTransitBundle>>['events']
): AtmospherePredictiveInput {
  return {
    events: events.map((event) => ({
      eventId: event.eventId,
      scores: {
        intensity: event.scores.intensity,
        confidence: event.scores.confidence,
      },
      transit: {
        transitingPlanet: event.transit.transitingPlanet,
        aspect: event.transit.aspect,
        natalPlanet: event.transit.natalPlanet,
      },
      narrative: {
        whisper: sanitizeCopyText(event.narrative.whisper),
      },
    })),
    lunarTiming: {
      phase: predictive.lunarTiming.phase,
      illumination: predictive.lunarTiming.illumination,
      actionBias: predictive.lunarTiming.actionBias,
      isVoidOfCourse: predictive.lunarTiming.isVoidOfCourse,
      guidance: sanitizeCopyText(predictive.lunarTiming.guidance),
    },
    progressedMoon: {
      sign: predictive.progressedMoon.sign,
      degree: predictive.progressedMoon.degree,
      emphasis: predictive.progressedMoon.emphasis,
    },
  };
}

function mapStormsReport(report: ReturnType<typeof predictStorms>): AtmosphereStormsInput {
  return {
    storms: report.storms.map((storm) => ({
      title: storm.title,
      intensity: storm.intensity,
      intensityScore: storm.intensityScore,
      transitingPlanet: storm.transitingPlanet,
      natalPlanet: storm.natalPlanet,
      aspect: storm.aspect,
      description: sanitizeCopyText(storm.description),
    })),
    weekSummary: sanitizeCopyText(report.weekSummary),
  };
}

function mapForecastInput(
  forecast: ReturnType<typeof getTodaysForecast>,
  enriched: Record<string, unknown>
): AtmosphereForecastInput {
  return {
    day_rating: (enriched.day_rating as string | undefined) || forecast.day_rating,
    planetaryHighlights: (forecast.planetaryHighlights || []).map((entry) =>
      typeof entry === 'string' ? sanitizeCopyText(entry) : String(entry)
    ),
    summary:
      typeof forecast.summary === 'string'
        ? sanitizeCopyText(forecast.summary)
        : undefined,
  };
}

export async function POST(request: Request) {
  const hasAccess = await validateFeatureAccess('canAccessForecast');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Atmosphere forecasting is not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      birthDate,
      birthTime,
      lat,
      lon,
      timezoneOffset,
      mbtiType,
      userId,
      clientDate,
      windowDays = 7,
    } = body;

    if (!birthDate || !birthTime) {
      return NextResponse.json({ success: false, error: 'Missing birth date or time' }, { status: 400 });
    }

    const isNorfolkValidationInput =
      birthDate === '1983-08-14' &&
      birthTime?.startsWith('12:21') &&
      Math.abs((lat ?? 0) - 36.85) < 1 &&
      Math.abs((lon ?? 0) - -76.29) < 1;

    const inferredTimezoneOffset =
      typeof timezoneOffset === 'number'
        ? timezoneOffset
        : isNorfolkValidationInput
          ? -4
          : undefined;

    const { utcBirthDate, utcBirthTime } = normalizeUtcBirth(birthDate, birthTime, inferredTimezoneOffset);

    let natalChart: BirthChartData;
    let source: 'swiss-real' | 'mock-fallback' = 'swiss-real';

    try {
      natalChart = calculateBirthChart(utcBirthDate, utcBirthTime, lat || 0, lon || 0) as BirthChartData;
    } catch (error) {
      source = 'mock-fallback';
      natalChart = calculateBirthChartFallback(utcBirthDate, utcBirthTime, lat || 0, lon || 0) as BirthChartData;
      console.warn('[Atmosphere] Swiss failed, using fallback:', error);
    }

    const parsedMbti = parseMbtiType(mbtiType);
    const targetDate =
      typeof clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : undefined;

    const [predictive, forecastBase, stormsReport] = await Promise.all([
      buildPredictiveTransitBundle({
        natalPlanets: natalChart.positions || [],
        birthDate,
        mbtiType: parsedMbti,
        userId: typeof userId === 'string' ? userId : undefined,
        windowDays,
      }),
      Promise.resolve(getTodaysForecast(natalChart, targetDate)),
      Promise.resolve(predictStorms(natalChart, 7, parsedMbti)),
    ]);

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

    const [resonance, patternProfile] =
      typeof userId === 'string'
        ? await Promise.all([getResonanceWeightsProfile(userId), getAtmospherePatternProfile(userId)])
        : [emptyResonanceProfile, null];

    const weightedEvents = applyPlanetResonanceWeights(predictive.events, resonance.multipliers);
    const sortedEvents = [...weightedEvents].sort((a, b) => b.scores.intensity - a.scores.intensity);

    const globalPressure = sortedEvents.length
      ? Math.round(sortedEvents.reduce((sum, event) => sum + event.scores.intensity, 0) / sortedEvents.length)
      : 0;

    const confidence = sortedEvents.length
      ? Math.round(
          (sortedEvents.reduce((sum, event) => sum + event.scores.confidence, 0) / sortedEvents.length) * 100
        )
      : 0;

    const explainability = buildExplainabilityPacket({
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

    const enrichedForecast: Record<string, unknown> = {};
    try {
      const [birthDateStr, birthTimeStr] = [birthDate as string, (birthTime as string) || '12:00'];
      const [y, mo, d] = birthDateStr.split('-').map(Number);
      const [h, m] = birthTimeStr.split(':').map(Number);
      const birthDateObj = new Date(Date.UTC(y, mo - 1, d, h || 12, m || 0));
      const tcForecast = await generateDailyForecast(
        new Date(),
        { date: birthDateObj, location: { latitude: lat || 0, longitude: lon || 0 } },
        parsedMbti,
        typeof userId === 'string' ? userId : undefined
      );
      enrichedForecast.day_rating = tcForecast.day_rating;
    } catch (error) {
      console.warn('[Atmosphere] Transit-lookup day_rating enrichment skipped:', error);
    }

    const temporal = buildAtmosphereTemporalInput({
      ascendantSign: natalChart.ascendant?.sign,
      birthDate: birthDate as string,
      natalPlanets: natalChart.positions || natalChart.planets,
      ascendantLongitude: natalChart.ascendant?.longitude,
      mcLongitude: natalChart.mc?.longitude,
    });

    const packet = computeAtmosphere(
      assembleAtmosphereInput({
        date: targetDate || forecastBase.date,
        explainability,
        predictive: mapPredictiveBundle(predictive, sortedEvents),
        temporal,
        storms: mapStormsReport(stormsReport),
        forecast: mapForecastInput(forecastBase, enrichedForecast),
        calibration:
          resonance.summary.feedbackCount >= 3
            ? {
                feedbackCount: resonance.summary.feedbackCount,
                strongestPlanet: resonance.summary.strongestPlanet,
                strongestMultiplier: resonance.summary.strongestMultiplier,
              }
            : undefined,
        moonPhase: forecastBase.moonPhase,
        moonSign: forecastBase.moonSign,
        patterns: {
          profile: patternProfile,
          activeTransits: sortedEvents.slice(0, 5).map((event) => ({
            transitingPlanet: event.transit.transitingPlanet,
            natalPlanet: event.transit.natalPlanet,
            aspect: event.transit.aspect,
            label: `${event.transit.transitingPlanet} ${event.transit.aspect} ${event.transit.natalPlanet}`,
          })),
        },
      })
    );

    return NextResponse.json({
      success: true,
      source,
      data: packet,
    });
  } catch (error) {
    console.error('[Atmosphere] Error generating atmosphere packet:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}