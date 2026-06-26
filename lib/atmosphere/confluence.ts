import {
  detectConfluenceThemes,
  mapPredictiveDomainToThemes,
  type ActiveScoredSignal,
  type ConfluenceSignalSource,
  type PredictionTheme,
} from '@/lib/astrology/confluence-detector';
import { predictiveIntensityScore } from '@/lib/atmosphere/normalize';
import type {
  AtmosphereConfluence,
  AtmospherePredictiveInput,
  AtmosphereTemporalInput,
} from '@/lib/atmosphere/types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const TIME_LORD_THEMES: Record<string, PredictionTheme[]> = {
  Sun: ['career', 'inner work'],
  Moon: ['inner work', 'love'],
  Mercury: ['communication', 'career'],
  Venus: ['love', 'abundance'],
  Mars: ['career', 'transformation'],
  Jupiter: ['abundance', 'career'],
  Saturn: ['career', 'inner work', 'transformation'],
};

function buildEventThemes(event: NonNullable<AtmospherePredictiveInput['events']>[number]): PredictionTheme[] {
  const themeSet = new Set<PredictionTheme>(['inner work']);
  const transiting = event.transit?.transitingPlanet || '';
  const natal = event.transit?.natalPlanet || '';
  const aspect = (event.transit?.aspect || '').toLowerCase();

  if (['Venus', 'Moon'].includes(transiting) || ['Venus', 'Moon'].includes(natal)) {
    themeSet.add('love');
  }

  if (['Saturn', 'Mars', 'Sun', 'MC'].includes(transiting) || ['Saturn', 'Mars', 'Sun'].includes(natal)) {
    themeSet.add('career');
  }

  if (['Jupiter', 'Venus', 'Saturn'].includes(transiting) || aspect.includes('trine')) {
    themeSet.add('abundance');
  }

  if (['Mercury', 'Moon'].includes(transiting) || ['Mercury', 'Moon'].includes(natal)) {
    themeSet.add('communication');
  }

  if (
    ['Pluto', 'Saturn', 'Uranus'].includes(transiting) ||
    ['Pluto', 'Saturn', 'Moon'].includes(natal)
  ) {
    themeSet.add('transformation');
  }

  return Array.from(themeSet);
}

function buildSolarArcThemes(hit: {
  directedPlanet: string;
  natalPlanet: string;
  aspect: string;
}): PredictionTheme[] {
  const themes = new Set<PredictionTheme>(['transformation']);
  const bodies = [hit.directedPlanet, hit.natalPlanet];

  if (bodies.some((body) => ['Venus', 'Moon'].includes(body))) {
    themes.add('love');
  }
  if (bodies.some((body) => ['Saturn', 'Mars', 'Sun', 'Midheaven'].includes(body))) {
    themes.add('career');
  }
  if (bodies.some((body) => ['Jupiter', 'Venus'].includes(body))) {
    themes.add('abundance');
  }
  if (bodies.some((body) => ['Mercury', 'Moon'].includes(body))) {
    themes.add('communication');
  }

  return Array.from(themes);
}

function collectSourcesForTheme(
  signals: ActiveScoredSignal[],
  theme: PredictionTheme
): Set<ConfluenceSignalSource> {
  const sources = new Set<ConfluenceSignalSource>();
  signals.forEach((signal) => {
    if (signal.themes.includes(theme)) {
      sources.add(signal.source);
    }
  });
  return sources;
}

export function buildAtmosphereConfluenceSignals(
  predictive?: AtmospherePredictiveInput | null,
  temporal?: AtmosphereTemporalInput | null
): ActiveScoredSignal[] {
  const eventSignals: ActiveScoredSignal[] = (predictive?.events || [])
    .filter((event) => predictiveIntensityScore(event.scores?.intensity) >= 45)
    .map((event, index) => ({
      signalId: event.eventId || `transit-${index}`,
      source: 'transit' as const,
      label: `${event.transit?.transitingPlanet || 'Planet'} ${event.transit?.aspect || 'aspect'} ${event.transit?.natalPlanet || 'point'}`,
      score: predictiveIntensityScore(event.scores?.intensity),
      themes: buildEventThemes(event),
      phase: 'building' as const,
      details: event.narrative?.whisper,
    }));

  const lunarThemes = new Set<PredictionTheme>();
  const lunar = predictive?.lunarTiming;
  if (lunar) {
    if (lunar.actionBias === 'initiate' || lunar.actionBias === 'build') {
      lunarThemes.add('career');
    }
    if (lunar.actionBias === 'build') {
      lunarThemes.add('abundance');
    }
    if (lunar.actionBias === 'review' || lunar.actionBias === 'release') {
      lunarThemes.add('inner work');
      lunarThemes.add('transformation');
    }
    if (lunar.isVoidOfCourse) {
      lunarThemes.add('communication');
    }
  }

  const progressedThemes = new Set<PredictionTheme>(
    (predictive?.progressedMoon?.emphasis || []).flatMap((domain) => mapPredictiveDomainToThemes(domain))
  );

  const supplementalSignals: ActiveScoredSignal[] = [];

  if (lunar?.phase) {
    supplementalSignals.push({
      signalId: `lunar-${lunar.phase}`,
      source: 'lunar',
      label: `${lunar.phase} lunar timing`,
      score: clamp(50 + Math.round((lunar.illumination ?? 0.5) * 25), 45, 82),
      themes: Array.from(lunarThemes),
      phase:
        lunar.actionBias === 'review' || lunar.actionBias === 'release'
          ? 'integrating'
          : lunar.actionBias === 'initiate'
            ? 'peak'
            : 'building',
      details: lunar.guidance,
    });
  }

  if (predictive?.progressedMoon?.sign) {
    supplementalSignals.push({
      signalId: `progressed-moon-${predictive.progressedMoon.sign}`,
      source: 'progressed-moon',
      label: `Progressed Moon in ${predictive.progressedMoon.sign}`,
      score: 62,
      themes: Array.from(progressedThemes),
      phase: 'building',
      details: `Progressed Moon emphasis: ${(predictive.progressedMoon.emphasis || []).join(', ')}`,
    });
  }

  if (temporal?.profection) {
    supplementalSignals.push({
      signalId: `profection-${temporal.profection.profectedSign}-${temporal.profection.age}`,
      source: 'profection',
      label: `${temporal.profection.profectedSign} profection year (${temporal.profection.timeLord})`,
      score: 70,
      themes: TIME_LORD_THEMES[temporal.profection.timeLord] || ['inner work', 'career'],
      phase: 'building',
      details: temporal.profection.themeOfYear,
    });
  }

  temporal?.solarArc?.activeHits?.forEach((hit, index) => {
    supplementalSignals.push({
      signalId: `solar-arc-${hit.directedPlanet}-${hit.natalPlanet}-${index}`,
      source: 'solar-arc',
      label: `Solar arc ${hit.directedPlanet} ${hit.aspect} natal ${hit.natalPlanet}`,
      score: clamp(hit.score, 45, 90),
      themes: buildSolarArcThemes(hit),
      phase: hit.orb <= 0.35 ? 'peak' : 'building',
      details: `Directed hit active near age ${Math.round(temporal.solarArc?.ageYears || 0)} (${hit.orb.toFixed(2)}° orb).`,
    });
  });

  return [...eventSignals, ...supplementalSignals].filter((signal) => signal.themes.length > 0);
}

export function computeAtmosphereConfluence(
  predictive?: AtmospherePredictiveInput | null,
  temporal?: AtmosphereTemporalInput | null
): AtmosphereConfluence {
  const signals = buildAtmosphereConfluenceSignals(predictive, temporal);
  if (!signals.length) {
    return { aligned: false, tripleHit: false, themes: [], signalCount: 0, sources: [] };
  }

  const themes = detectConfluenceThemes(signals, 3);
  const topTheme = themes[0];

  if (!topTheme) {
    return {
      aligned: false,
      tripleHit: false,
      themes: [],
      signalCount: signals.length,
      sources: Array.from(new Set(signals.map((signal) => signal.source))),
    };
  }

  const themeSources = collectSourcesForTheme(signals, topTheme.theme);
  const legacyAligned =
    themeSources.has('transit') &&
    themeSources.has('progressed-moon') &&
    themeSources.has('lunar');
  const tripleHit =
    themeSources.has('transit') &&
    themeSources.has('solar-arc') &&
    themeSources.has('profection');

  return {
    aligned: legacyAligned || tripleHit,
    tripleHit,
    themes: [topTheme.theme, ...themes.slice(1, 3).map((entry) => entry.theme)],
    signalCount: topTheme.signalCount,
    sources: Array.from(themeSources),
  };
}