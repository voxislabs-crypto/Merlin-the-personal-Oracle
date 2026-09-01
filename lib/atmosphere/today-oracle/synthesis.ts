/**
 * Layer 3 — Oracle synthesis.
 * This chart, this type, this hour. Not a weather report restated six times.
 */

import { applyMerlinVoicePass } from '@/lib/voice/merlin-voice';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';
import { THEME_CATALOG } from '@/lib/atmosphere/today-oracle/meaning';
import {
  buildChartWhy,
  buildConfidenceWhy,
  buildConstraintMove,
  buildDomainJob,
  buildDrivenByLine,
  buildLeadFactLine,
  buildLivedCollision,
  buildOperationalTension,
  buildPersonalHook,
  moveSizePhrase,
  primaryDomains,
  quietDomains,
  type CheckinSnapshot,
} from '@/lib/atmosphere/today-oracle/personal-copy';
import type {
  RankedTheme,
  TodayMoveMemory,
  TodayOracleBrief,
  TodaySupportingSignal,
  TransitFact,
} from '@/lib/atmosphere/today-oracle/types';

export const WEATHER_PRINCIPLE =
  "You can't control the weather. You can choose how to move through it.";

const DOMAIN_PHRASE: Record<string, string> = {
  love: 'relationships',
  career: 'work',
  money: 'money',
  family: 'home life',
  health: 'body and energy',
  self: 'identity and pace',
};

function joinDomains(domains: string[]): string {
  const names = domains.slice(0, 2).map((d) => DOMAIN_PHRASE[d] || d);
  if (names.length === 0) return 'pace and energy';
  if (names.length === 1) return names[0];
  return `${names[0]} and ${names[1]}`;
}

function bandLabel(score: number): TodayOracleBrief['confidenceLabel'] {
  if (score >= 70) return 'High';
  if (score >= 50) return 'Steady';
  return 'Tentative';
}

/** Uncertainty from the sky data: orbs, fact count, whether we have tight hits. */
export function chartConfidenceFromThemes(themes: RankedTheme[]): number {
  const facts = themes.flatMap((theme) => theme.facts);
  if (!facts.length) return 36;
  const orbs = facts.map((f) => f.orbDeg).filter((n): n is number => typeof n === 'number');
  const bestOrb = orbs.length ? Math.min(...orbs) : null;
  let n = 44;
  if (bestOrb === null) n += 4;
  else if (bestOrb <= 1) n += 26;
  else if (bestOrb <= 2) n += 18;
  else if (bestOrb <= 3.5) n += 10;
  else n += 3;
  n += Math.min(3, Math.max(0, facts.length - 1)) * 6;
  const lookupHits = facts.filter((f) => f.source === 'transit-lookup').length;
  if (lookupHits === 0) n -= 8;
  return Math.max(28, Math.min(92, Math.round(n)));
}

/** Uncertainty from the read: mixed themes, opposing polarities, framing. */
export function readConfidenceFromThemes(
  close: RankedTheme[],
  options?: { framed?: boolean; held?: boolean },
): number {
  const primary = close[0];
  if (!primary) return 40;
  let n = 72;
  if (close.length >= 2) n -= 14;
  if (close.length >= 3) n -= 8;
  const polarities = new Set(close.map((t) => t.polarity));
  if (polarities.has('friction') && polarities.has('opening')) n -= 10;
  if (options?.framed) n += 6;
  if (options?.held) n += 4;
  return Math.max(28, Math.min(90, Math.round(n)));
}

function supportingSignals(close: RankedTheme[]): TodaySupportingSignal[] {
  return close.map((theme) => ({
    id: theme.id,
    label: theme.label,
    hint:
      theme.polarity === 'opening'
        ? `Opening in ${joinDomains(theme.domains)}`
        : theme.polarity === 'friction'
          ? `Friction in ${joinDomains(theme.domains)}`
          : `Mixed weather in ${joinDomains(theme.domains)}`,
    polarity: theme.polarity,
  }));
}

export function synthesizeTodayOracle(input: {
  theme: RankedTheme;
  closeThemes?: RankedTheme[];
  allFacts?: TransitFact[];
  date: string;
  held: boolean;
  memory?: TodayMoveMemory | null;
  mbtiType?: string | null;
  maskType?: string | null;
  sunSign?: string | null;
  moonSign?: string | null;
  moonPhase?: string | null;
  streak?: number | null;
  yesterdayCheckin?: CheckinSnapshot | null;
  intensity?: number | null;
  risk?: LifeRiskPacket | null;
  confluenceAligned?: boolean;
  tripleHit?: boolean;
}): TodayOracleBrief {
  const close = input.closeThemes?.length ? input.closeThemes : [input.theme];
  const primary = close.find((t) => t.id === input.theme.id) || input.theme;
  const spec = THEME_CATALOG[primary.id];
  const lead = primary.facts[0];
  const allFacts = (input.allFacts?.length ? input.allFacts : close.flatMap((theme) => theme.facts)).slice();
  const framed = Boolean(input.mbtiType && /^[IE][NS][TF][JP]$/i.test(input.mbtiType));

  let chartConfidence = chartConfidenceFromThemes(close);
  let readConfidence = readConfidenceFromThemes(close, { framed, held: input.held });
  if (input.confluenceAligned) readConfidence = Math.min(90, readConfidence + 4);
  if (input.tripleHit) chartConfidence = Math.min(92, chartConfidence + 6);

  const blended = Math.round(chartConfidence * 0.55 + readConfidence * 0.45);
  const ctx = {
    date: input.date,
    held: input.held,
    mbtiType: input.mbtiType,
    maskType: input.maskType,
    sunSign: input.sunSign,
    moonSign: input.moonSign,
    moonPhase: input.moonPhase,
    streak: input.streak,
    yesterdayCheckin: input.yesterdayCheckin,
    intensity: input.intensity,
    risk: input.risk,
  };
  const domains = primaryDomains(primary, input.risk);
  const quiet = quietDomains(input.risk, domains);
  const leadFact = buildLeadFactLine(lead);
  const lived = buildLivedCollision(primary, ctx);
  const domainWord = domains[0] ? DOMAIN_PHRASE[domains[0]] || 'the situation' : 'the situation';
  const operational = buildOperationalTension(input.mbtiType, input.maskType, domainWord);
  const constraint = buildConstraintMove(primary, allFacts, ctx, domains);
  const heldMove =
    input.held && input.memory?.move && input.memory.themeId === primary.id ? input.memory.move : null;
  const move = heldMove || constraint.move;
  const chartWhy = buildChartWhy({
    leadFact,
    lived,
    operational,
    facts: allFacts,
  });
  const drivenBy = buildDrivenByLine(allFacts, input.held);
  const personalHook = buildPersonalHook(ctx, constraint.deadline, spec.label);
  const confidenceWhy = buildConfidenceWhy({
    chartConfidence,
    readConfidence,
    domains,
    held: input.held,
    moveSize: moveSizePhrase(primary),
  });
  const domainJob = buildDomainJob(domains, quiet);

  return {
    move: applyMerlinVoicePass(move),
    whyToday: applyMerlinVoicePass(drivenBy),
    usuallyBrings: '',
    navigate: operational ? applyMerlinVoicePass(operational) : applyMerlinVoicePass(move),
    watchFor: applyMerlinVoicePass(constraint.watchFor),
    supportingSignals: supportingSignals(close),
    chartConfidence,
    readConfidence,
    chartConfidenceLabel: bandLabel(chartConfidence),
    readConfidenceLabel: bandLabel(readConfidence),
    confidence: blended,
    confidenceLabel: bandLabel(blended),
    mixedSignals: close.length > 1,
    themeId: primary.id,
    themeLabel: spec.label,
    companionThemeLabels: close.slice(1).map((t) => t.label),
    leadFactKey: lead?.key || primary.id,
    leadFactDisplay: lead?.display || spec.label,
    heldFromYesterday: input.held,
    factCount: close.reduce((n, t) => n + t.facts.length, 0),
    principle: WEATHER_PRINCIPLE,
    leadFact: applyMerlinVoicePass(leadFact),
    chartWhy: applyMerlinVoicePass(chartWhy),
    operationalTension: operational ? applyMerlinVoicePass(operational) : null,
    doNot: applyMerlinVoicePass(constraint.doNot),
    personalHook: personalHook ? applyMerlinVoicePass(personalHook) : null,
    confidenceWhy: applyMerlinVoicePass(confidenceWhy),
    domainJob: applyMerlinVoicePass(domainJob),
    deadline: constraint.deadline,
  };
}
