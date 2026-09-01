import type { LifeRiskDomain } from '@/lib/atmosphere/types';

export type TodayThemeId =
  | 'emotional-restraint'
  | 'emotional-heat'
  | 'communication-friction'
  | 'communication-opening'
  | 'identity-pressure'
  | 'relationship-value'
  | 'action-block'
  | 'action-surge'
  | 'structure-duty'
  | 'expansion-opening'
  | 'sudden-shift'
  | 'fog-clarity'
  | 'power-dynamics'
  | 'home-mood';

export type TodayThemePolarity = 'friction' | 'opening' | 'mixed';

export type TransitFactSource = 'transit-lookup' | 'risk-driver' | 'dominant';

/** Layer 1 — structured sky facts. No prose. */
export interface TransitFact {
  key: string;
  transiting: string;
  aspect: string;
  natal: string;
  display: string;
  orbDeg: number | null;
  band: 'hard' | 'soft' | 'merge';
  score: number;
  domains: LifeRiskDomain[];
  source: TransitFactSource;
}

export interface RankedTheme {
  id: TodayThemeId;
  label: string;
  polarity: TodayThemePolarity;
  score: number;
  facts: TransitFact[];
  domains: LifeRiskDomain[];
}

export interface TodayMoveMemory {
  date: string;
  themeId: TodayThemeId;
  move: string;
  factKey: string;
}

export interface TodaySupportingSignal {
  id: string;
  label: string;
  hint: string;
  polarity: TodayThemePolarity;
}

export interface TodayOracleBrief {
  move: string;
  whyToday: string;
  usuallyBrings: string;
  navigate: string;
  watchFor: string;
  supportingSignals: TodaySupportingSignal[];
  /** Orb / fact tightness — uncertainty from the sky data */
  chartConfidence: number;
  /** Theme clarity — uncertainty from mixed signals / framing */
  readConfidence: number;
  chartConfidenceLabel: 'High' | 'Steady' | 'Tentative';
  readConfidenceLabel: 'High' | 'Steady' | 'Tentative';
  /** Back-compat: min of chart + read, for older UI */
  confidence: number;
  confidenceLabel: 'High' | 'Steady' | 'Tentative';
  mixedSignals: boolean;
  themeId: TodayThemeId;
  themeLabel: string;
  companionThemeLabels: string[];
  leadFactKey: string;
  leadFactDisplay: string;
  heldFromYesterday: boolean;
  factCount: number;
  principle: string;
  /** "Uranus is squaring your Venus today. That's the … axis, not a mood swing." */
  leadFact: string;
  /** Why this chart — hit + lived collision + operational dual-layer */
  chartWhy: string;
  /** Dual-layer as a procedure, or null when core/mask match */
  operationalTension: string | null;
  /** What not to do — checkable, not poetic */
  doNot: string;
  /** One hook only this user would recognize */
  personalHook: string | null;
  /** Confidence as a decision, not scores for scores */
  confidenceWhy: string;
  /** Hot vs ignore domains */
  domainJob: string;
  /** Deadline baked into the move ("6pm", "noon") */
  deadline: string;
}
