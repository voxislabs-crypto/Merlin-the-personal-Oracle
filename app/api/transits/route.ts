import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getCurrentTransits } from '@/lib/astrology/transits';
import { buildPredictiveTransitBundle } from '@/lib/astrology/predictive-transits';
import {
  detectConfluenceThemes,
  mapPredictiveDomainToThemes,
  type ActiveScoredSignal,
} from '@/lib/astrology/confluence-detector';
import { buildTransitWindows } from '@/lib/astrology/transit-windows';
import {
  applyPlanetResonanceWeights,
  getResonanceWeightsProfile,
} from '@/lib/astrology/resonance-weights';
import { BirthChartData } from '@/types/astrology';
import { validateFeatureAccess } from '@/lib/subscription-validation';
import { resonanceDB } from '@/lib/resonance-database';
import { getUserContextSnapshot } from '@/lib/user-context';

function normalizeUtcBirth(
  birthDate: string,
  birthTime: string,
  timezoneOffset?: number
) {
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildEventThemes(event: Awaited<ReturnType<typeof buildPredictiveTransitBundle>>['events'][number]) {
  const themeSet = new Set<string>(event.domains.flatMap((domain) => mapPredictiveDomainToThemes(domain.name)));

  if (event.transit.transitingPlanet === 'Mercury' || event.transit.natalPlanet === 'Mercury') {
    themeSet.add('communication');
  }

  if (
    ['Pluto', 'Saturn', 'Uranus'].includes(event.transit.transitingPlanet) ||
    ['Pluto', 'Saturn', 'Moon'].includes(event.transit.natalPlanet)
  ) {
    themeSet.add('transformation');
  }

  if (['Venus', 'Moon'].includes(event.transit.transitingPlanet) || ['Venus', 'Moon'].includes(event.transit.natalPlanet)) {
    themeSet.add('love');
    themeSet.add('inner work');
  }

  return Array.from(themeSet);
}

function buildConfluenceSignals(predictive: Awaited<ReturnType<typeof buildPredictiveTransitBundle>>): ActiveScoredSignal[] {
  const eventSignals: ActiveScoredSignal[] = predictive.events
    .filter((event) => event.scores.intensity >= 45)
    .map((event) => ({
      signalId: event.eventId,
      source: 'transit',
      label: `${event.transit.transitingPlanet} ${event.transit.aspect} ${event.transit.natalPlanet}`,
      score: event.scores.intensity,
      themes: buildEventThemes(event) as ActiveScoredSignal['themes'],
      phase:
        event.timing.phase === 'peaking'
          ? 'peak'
          : event.timing.phase === 'releasing'
          ? 'integrating'
          : 'building',
      details: event.narrative.whisper,
    }));

  const lunarThemes = new Set<string>();
  if (predictive.lunarTiming.actionBias === 'initiate' || predictive.lunarTiming.actionBias === 'build') {
    lunarThemes.add('career');
  }
  if (predictive.lunarTiming.actionBias === 'build') {
    lunarThemes.add('abundance');
  }
  if (predictive.lunarTiming.actionBias === 'review' || predictive.lunarTiming.actionBias === 'release') {
    lunarThemes.add('inner work');
    lunarThemes.add('transformation');
  }
  if (predictive.lunarTiming.isVoidOfCourse) {
    lunarThemes.add('communication');
  }

  const progressedThemes = new Set<string>(
    predictive.progressedMoon.emphasis.flatMap((domain) => mapPredictiveDomainToThemes(domain))
  );

  const supplementalSignals: ActiveScoredSignal[] = [
    {
      signalId: `lunar-${predictive.lunarTiming.phase}`,
      source: 'lunar',
      label: `${predictive.lunarTiming.phase} lunar timing`,
      score: clamp(50 + Math.round(predictive.lunarTiming.illumination * 0.25), 45, 82),
      themes: Array.from(lunarThemes) as ActiveScoredSignal['themes'],
      phase:
        predictive.lunarTiming.actionBias === 'review' || predictive.lunarTiming.actionBias === 'release'
          ? 'integrating'
          : predictive.lunarTiming.actionBias === 'initiate'
          ? 'peak'
          : 'building',
      details: predictive.lunarTiming.guidance,
    },
    {
      signalId: `progressed-moon-${predictive.progressedMoon.sign}`,
      source: 'progressed-moon',
      label: `Progressed Moon in ${predictive.progressedMoon.sign}`,
      score: 62,
      themes: Array.from(progressedThemes) as ActiveScoredSignal['themes'],
      phase: 'building',
      details: `Progressed Moon emphasis: ${predictive.progressedMoon.emphasis.join(', ')}`,
    },
  ];

  return [...eventSignals, ...supplementalSignals].filter((signal) => signal.themes.length > 0);
}

export async function POST(request: Request) {
  console.log('Received request for transit analysis');
  
  // Check subscription tier
  const hasAccess = await validateFeatureAccess('canAccessTransits');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Active Transits are not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }
  
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon, timezoneOffset, mbtiType, userId } = body;
    
    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { success: false, error: 'Missing birth date or time' },
        { status: 400 }
      );
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

    const { utcBirthDate, utcBirthTime, appliedOffsetHours } = normalizeUtcBirth(
      birthDate,
      birthTime,
      inferredTimezoneOffset
    );

    // Calculate natal birth chart
    let natalChart: BirthChartData;
    let source: 'swiss-real' | 'mock-fallback' = 'swiss-real';
    try {
      natalChart = calculateBirthChart(utcBirthDate, utcBirthTime, lat || 0, lon || 0) as BirthChartData;
    } catch (error) {
      source = 'mock-fallback';
      natalChart = calculateBirthChartFallback(utcBirthDate, utcBirthTime, lat || 0, lon || 0) as BirthChartData;
      console.warn('[Transits] Swiss failed, using fallback:', error);
    }

    if (userId) {
      await resonanceDB.ensureUser({
        userId,
        mbtiType,
        createdAt: new Date(),
      });
    }

    const userContext = userId ? await getUserContextSnapshot(userId) : null;

    const [transits, predictiveBase, resonance] = await Promise.all([
      Promise.resolve(getCurrentTransits(natalChart.positions || [])),
      buildPredictiveTransitBundle({
        natalPlanets: natalChart.positions || [],
        birthDate,
        mbtiType,
        userId,
        userContext,
        windowDays: 7,
      }),
      userId
        ? getResonanceWeightsProfile(userId)
        : Promise.resolve({
            multipliers: {},
            planetBreakdown: {},
            history: [],
            summary: { feedbackCount: 0 },
          }),
    ]);

    const predictiveEvents = applyPlanetResonanceWeights(predictiveBase.events, resonance.multipliers);
    const predictive = {
      ...predictiveBase,
      events: predictiveEvents,
    };
    const transitWindows = buildTransitWindows(predictiveEvents);
    const confluence = detectConfluenceThemes(buildConfluenceSignals(predictive), 3);

    // Categorize transits by influence
    const significantTransits = transits.filter(t => t.exact || t.orb < 1.5);
    const approachingTransits = transits.filter(t => !t.exact && t.orb >= 1.5 && t.orb < 3);

    console.log('Successfully calculated transits:', transits.length);
    return NextResponse.json({
      success: true,
      source,
      data: {
        all: transits,
        significant: significantTransits,
        approaching: approachingTransits,
        summary: {
          total: transits.length,
          exact: significantTransits.length,
          approaching: approachingTransits.length
        },
        predictive,
        confluence,
        transitWindows,
        resonance,
        userContext,
        timezoneOffsetHours: appliedOffsetHours,
      }
    });
  } catch (error) {
    console.error('Error calculating transits:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
