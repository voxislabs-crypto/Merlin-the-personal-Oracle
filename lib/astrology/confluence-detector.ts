export type PredictionTheme =
  | 'transformation'
  | 'love'
  | 'career'
  | 'inner work'
  | 'communication'
  | 'abundance';

export type ConfluencePhase = 'building' | 'peak' | 'integrating';

export type ConfluenceSignalSource =
  | 'transit'
  | 'lunar'
  | 'progressed-moon'
  | 'solar-arc'
  | 'profection';

export interface ActiveScoredSignal {
  signalId: string;
  source: ConfluenceSignalSource;
  label: string;
  score: number;
  themes: PredictionTheme[];
  phase?: ConfluencePhase;
  details?: string;
}

export interface ConfluenceSignalSummary {
  signalId: string;
  source: ActiveScoredSignal['source'];
  label: string;
  score: number;
  phase: ConfluencePhase;
  details?: string;
}

export interface ConfluenceThemeResult {
  theme: PredictionTheme;
  title: string;
  headline: string;
  summary: string;
  score: number;
  signalCount: number;
  dominantPhase: ConfluencePhase;
  signals: ConfluenceSignalSummary[];
}

const THEME_COPY: Record<PredictionTheme, { title: string; headline: string; summary: string }> = {
  transformation: {
    title: 'Transformation',
    headline: 'Multiple signals point to deep change rather than surface adjustment.',
    summary: 'This is a threshold period: the old structure is being reworked so a truer pattern can replace it.',
  },
  love: {
    title: 'Love',
    headline: 'Relationship energy is repeating loudly enough to treat it as a central storyline.',
    summary: 'Themes of attraction, emotional reciprocity, and connection are not random background noise right now.',
  },
  career: {
    title: 'Career',
    headline: 'Professional direction and public role are under clear pressure or momentum.',
    summary: 'Work, ambition, and visible responsibility are being activated by several layers at once.',
  },
  'inner work': {
    title: 'Inner Work',
    headline: 'The chart is pointing inward: regulation, healing, and emotional processing matter more than speed.',
    summary: 'This cycle asks for integration, honesty, and nervous-system-level recalibration before the next leap.',
  },
  communication: {
    title: 'Communication',
    headline: 'Messages, conversations, and decisions are carrying unusual weight.',
    summary: 'What is said, avoided, clarified, or negotiated now can materially change the outcome.',
  },
  abundance: {
    title: 'Abundance',
    headline: 'Resource flow is a real theme right now, whether through growth, scarcity, or reprioritization.',
    summary: 'Money, stability, and value exchange are prominent enough to deserve direct strategy.',
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getDominantPhase(phases: ConfluencePhase[]): ConfluencePhase {
  const counts: Record<ConfluencePhase, number> = {
    building: 0,
    peak: 0,
    integrating: 0,
  };

  phases.forEach((phase) => {
    counts[phase] += 1;
  });

  if (counts.peak >= counts.building && counts.peak >= counts.integrating) return 'peak';
  if (counts.building >= counts.integrating) return 'building';
  return 'integrating';
}

export function mapPredictiveDomainToThemes(domain: string): PredictionTheme[] {
  switch (domain) {
    case 'love':
      return ['love'];
    case 'career':
      return ['career'];
    case 'money':
      return ['abundance', 'career'];
    case 'family':
      return ['inner work', 'love'];
    case 'health':
      return ['inner work', 'transformation'];
    case 'self':
      return ['transformation', 'inner work'];
    default:
      return [];
  }
}

export function detectConfluenceThemes(
  signals: ActiveScoredSignal[],
  minimumSignals: number = 3
): ConfluenceThemeResult[] {
  const grouped = new Map<PredictionTheme, ActiveScoredSignal[]>();

  signals.forEach((signal) => {
    const uniqueThemes = Array.from(new Set(signal.themes));
    uniqueThemes.forEach((theme) => {
      const current = grouped.get(theme) || [];
      current.push(signal);
      grouped.set(theme, current);
    });
  });

  return Array.from(grouped.entries())
    .map(([theme, themeSignals]) => {
      const uniqueSignals = Array.from(
        new Map(themeSignals.map((signal) => [signal.signalId, signal])).values()
      );

      if (uniqueSignals.length < minimumSignals) return null;

      const sortedSignals = uniqueSignals
        .map<ConfluenceSignalSummary>((signal) => ({
          signalId: signal.signalId,
          source: signal.source,
          label: signal.label,
          score: clamp(Math.round(signal.score), 0, 100),
          phase: signal.phase || 'building',
          details: signal.details,
        }))
        .sort((left, right) => right.score - left.score);

      const averageScore =
        sortedSignals.reduce((total, signal) => total + signal.score, 0) / sortedSignals.length;
      const diversityBonus = new Set(sortedSignals.map((signal) => signal.source)).size * 4;
      const score = clamp(Math.round(averageScore + diversityBonus), 0, 100);
      const copy = THEME_COPY[theme];

      return {
        theme,
        title: copy.title,
        headline: copy.headline,
        summary: copy.summary,
        score,
        signalCount: sortedSignals.length,
        dominantPhase: getDominantPhase(sortedSignals.map((signal) => signal.phase)),
        signals: sortedSignals,
      } satisfies ConfluenceThemeResult;
    })
    .filter((result): result is ConfluenceThemeResult => Boolean(result))
    .sort((left, right) => right.score - left.score);
}