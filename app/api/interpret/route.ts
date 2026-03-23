import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { InterpretationEngine } from '@/lib/astrology/interpretations';
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
import { generateGrokInterpretation } from '@/lib/grok-service';
import { BirthChartData } from '@/types/astrology';
import { validateFeatureAccess } from '@/lib/subscription-validation';
import { getUserContextSnapshot } from '@/lib/user-context';
import { enhanceResponse } from '@/lib/astrology/ancient-astrology';

function normalizeUtcBirth(
  birthDate: string,
  birthTime: string,
  timezoneOffset?: number
) {
  if (typeof timezoneOffset !== 'number' || Number.isNaN(timezoneOffset)) {
    return { utcBirthDate: birthDate, utcBirthTime: birthTime };
  }

  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  const offsetHours = Math.abs(timezoneOffset) > 16 ? timezoneOffset / 60 : timezoneOffset;
  const localMs = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const utcMs = localMs - offsetHours * 60 * 60 * 1000;
  const utcDate = new Date(utcMs);

  return {
    utcBirthDate: utcDate.toISOString().slice(0, 10),
    utcBirthTime: `${utcDate.getUTCHours().toString().padStart(2, '0')}:${utcDate
      .getUTCMinutes()
      .toString()
      .padStart(2, '0')}`,
  };
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

  return [
    ...eventSignals,
    {
      signalId: `lunar-${predictive.lunarTiming.phase}`,
      source: 'lunar',
      label: `${predictive.lunarTiming.phase} lunar timing`,
      score: 58,
      themes:
        predictive.lunarTiming.actionBias === 'review' || predictive.lunarTiming.actionBias === 'release'
          ? ['inner work', 'transformation']
          : ['career', 'abundance'],
      phase:
        predictive.lunarTiming.actionBias === 'review' || predictive.lunarTiming.actionBias === 'release'
          ? 'integrating'
          : 'building',
      details: predictive.lunarTiming.guidance,
    },
    {
      signalId: `progressed-moon-${predictive.progressedMoon.sign}`,
      source: 'progressed-moon',
      label: `Progressed Moon in ${predictive.progressedMoon.sign}`,
      score: 62,
      themes: predictive.progressedMoon.emphasis.flatMap((domain) => mapPredictiveDomainToThemes(domain)) as ActiveScoredSignal['themes'],
      phase: 'building',
      details: `Progressed Moon emphasis: ${predictive.progressedMoon.emphasis.join(', ')}`,
    },
  ].filter((signal) => signal.themes.length > 0);
}

function buildUnifiedReading(params: {
  natalSummary: string;
  confluence: ReturnType<typeof detectConfluenceThemes>;
  transitWindows: ReturnType<typeof buildTransitWindows>;
  resonance: Awaited<ReturnType<typeof getResonanceWeightsProfile>> | null;
}) {
  const { natalSummary, confluence, transitWindows, resonance } = params;
  const topThemes = confluence.slice(0, 2);
  const topWindows = transitWindows.slice(0, 2);

  const themeSentence =
    topThemes.length > 0
      ? `Right now the strongest storyline is ${topThemes
          .map((theme) => `${theme.title.toLowerCase()} (${theme.signalCount} aligned signals)`)
          .join(' with secondary emphasis on ')}.`
      : 'Right now the chart is active, but no single prediction theme has enough alignment to dominate the reading.';

  const timingSentence =
    topWindows.length > 0
      ? `The clearest timing windows are ${topWindows
          .map((window) => `${window.title} peaking ${new Date(window.exactAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
          .join(' and ')}.`
      : 'The current transits are active, but there is not yet a clean peak window to prioritize over the others.';

  const resonanceSentence = resonance?.summary.feedbackCount
    ? resonance.summary.strongestPlanet && resonance.summary.strongestMultiplier
      ? `Your past feedback suggests Merlin lands most reliably when ${resonance.summary.strongestPlanet} themes are involved, so this reading leans into that pattern.`
      : 'Your past feedback is being used to bias this reading toward what has actually resonated for you before.'
    : 'There is no user resonance history yet, so this synthesis is using the base predictive model only.';

  return {
    unifiedReading: `${themeSentence} ${timingSentence} ${resonanceSentence} ${natalSummary}`,
    dominantThemes: topThemes.map((theme) => theme.title),
    timingHighlights: topWindows.map((window) => `${window.title} · ${window.currentPhase}`),
    resonanceNote: resonanceSentence,
    natalFoundation: natalSummary,
  };
}

export async function POST(request: Request) {
  console.log('Received request for chart interpretation');
  
  // Check subscription tier
  const hasAccess = await validateFeatureAccess('canAccessInterpretations');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Chart Interpretations are not available on the free tier',
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
      mode = 'traditional',
      userId,
      mbtiType,
      timezoneOffset,
      question = '',
      ancientLayer = false,
    } = body;
    
    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { success: false, error: 'Missing birth date or time' },
        { status: 400 }
      );
    }

    const userContext = userId ? await getUserContextSnapshot(userId) : null;
    const { utcBirthDate, utcBirthTime } = normalizeUtcBirth(birthDate, birthTime, timezoneOffset);

    // Calculate natal birth chart
    let natalChart: BirthChartData;
    let source: 'swiss-real' | 'mock-fallback' = 'swiss-real';
    try {
      natalChart = calculateBirthChart(utcBirthDate, utcBirthTime, lat || 0, lon || 0) as BirthChartData;
    } catch (error) {
      source = 'mock-fallback';
      natalChart = calculateBirthChartFallback(utcBirthDate, utcBirthTime, lat || 0, lon || 0) as BirthChartData;
      console.warn('[Interpret API] Swiss failed, using fallback:', error);
    }

    let chartSummary = '';
    let planetInterpretations: Array<{ planet: string; interpretation: string }> = [];
    let aspectInterpretations: Array<{ planets: string; interpretation: string }> = [];
    let cacheHit = false;
    let usedGrok = false;

    // Try Grok AI if requested
    if (mode === 'grok') {
      try {
        console.log('[Interpret API] Attempting Grok interpretation...');
        const grokResult = await generateGrokInterpretation({
          planets: natalChart.positions || [],
          aspects: natalChart.aspects || [],
          houses: natalChart.houses,
          ascendant: (natalChart as any).ascendant,
          birthData: {
            date: birthDate,
            time: birthTime,
            location: `${lat},${lon}`
          }
        });

        chartSummary = grokResult.chartSummary;
        planetInterpretations = grokResult.planetInterpretations;
        aspectInterpretations = grokResult.aspectInterpretations;
        usedGrok = true;
        console.log('[Interpret API] ✅ Successfully used Grok AI');
      } catch (error) {
        console.warn('[Interpret API] Grok failed, falling back to traditional:', (error as Error).message);
        // Fall through to traditional engine
      }
    }

    // Use traditional engine if Grok wasn't used or failed
    if (!usedGrok) {
      console.log('[Interpret API] Using traditional interpretation engine');
      const engine = new InterpretationEngine();
      
      // Generate chart summary
      chartSummary = engine.generateChartSummary(
        natalChart.positions || [],
        natalChart.aspects || []
      );

      // Generate interpretations for personal planets (Sun through Mars)
      const personalPlanets = natalChart.positions?.filter(p => 
        ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(p.name)
      ) || [];

      planetInterpretations = personalPlanets.map(planet => ({
        planet: planet.name,
        interpretation: engine.generateInterpretation({
          planet: planet.name,
          sign: planet.sign,
          house: planet.house,
          quality: 75 // Default quality score
        })
      }));

      // Generate aspect interpretations (top 5 most significant)
      const topAspects = (natalChart.aspects || [])
        .sort((a, b) => (a.orb || 0) - (b.orb || 0))
        .slice(0, 5);

      aspectInterpretations = topAspects.map(aspect => ({
        planets: `${aspect.planet1.name} ${aspect.type} ${aspect.planet2.name}`,
        interpretation: engine.generateAspectInterpretation(aspect)
      }));
    }

    const [predictiveBase, resonance] = await Promise.all([
      buildPredictiveTransitBundle({
        natalPlanets: natalChart.positions || [],
        birthDate,
        mbtiType,
        userId,
        userContext,
        windowDays: 7,
      }),
      userId ? getResonanceWeightsProfile(userId) : Promise.resolve(null),
    ]);

    const predictive = resonance
      ? {
          ...predictiveBase,
          events: applyPlanetResonanceWeights(predictiveBase.events, resonance.multipliers),
        }
      : predictiveBase;
    const confluence = detectConfluenceThemes(buildConfluenceSignals(predictive), 3);
    const transitWindows = buildTransitWindows(predictive.events);
    const synthesis = buildUnifiedReading({
      natalSummary: chartSummary,
      confluence,
      transitWindows,
      resonance,
    });
    chartSummary = synthesis.unifiedReading;

    const simplifiedTransits = predictive.events.map((event) => ({
      transitingPlanet: event.transit.transitingPlanet,
      natalPlanet: event.transit.natalPlanet,
      aspect: event.transit.aspect,
      orb: event.transit.orb,
    }));

    const ancientEnhanced = await enhanceResponse({
      baseResponse: chartSummary,
      transits: simplifiedTransits,
      natal: natalChart,
      query: question,
      settings: { ancientLayer },
    });

    chartSummary = ancientEnhanced.text;

    console.log(`Successfully generated ${usedGrok ? 'Grok' : 'traditional'} interpretations`);
    return NextResponse.json({
      success: true,
      cached: cacheHit,
      source,
      interpreter: usedGrok ? 'grok' : 'traditional',
      data: {
        chartSummary,
        synthesis,
        confluence,
        transitWindows,
        planetInterpretations,
        aspectInterpretations,
        metadata: {
          generatedAt: new Date().toISOString(),
          birthDate,
          birthTime,
          ancientLayerRequested: Boolean(ancientLayer),
          ancientLayerApplied: ancientEnhanced.enabled,
        }
      },
      ancientLayer: {
        enabled: ancientEnhanced.enabled,
        text: ancientEnhanced.ancientLayer,
      }
    });
  } catch (error) {
    console.error('Error generating interpretations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

