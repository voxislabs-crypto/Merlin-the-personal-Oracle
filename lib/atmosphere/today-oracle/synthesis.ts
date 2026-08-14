/**
 * Layer 3 — Oracle synthesis.
 * Weather report + navigation. Not a prediction of events.
 */

import { applyMerlinVoicePass } from '@/lib/voice/merlin-voice';
import type { LifeRiskDomain } from '@/lib/atmosphere/types';
import { THEME_CATALOG } from '@/lib/atmosphere/today-oracle/meaning';
import {
  personalityCloser,
  personalityFrame,
  type PersonalityFrame,
} from '@/lib/atmosphere/today-oracle/personality-lens';
import type {
  RankedTheme,
  TodayMoveMemory,
  TodayOracleBrief,
  TodaySupportingSignal,
  TodayThemePolarity,
} from '@/lib/atmosphere/today-oracle/types';

export const WEATHER_PRINCIPLE =
  "You can't control the weather. You can choose how to move through it.";

function hashSalt(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDatedLine(lines: readonly string[], salt: string): string {
  const usable = lines.map((s) => s.trim()).filter(Boolean);
  if (!usable.length) return '';
  return usable[hashSalt(salt) % usable.length];
}

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

function primaryDomain(theme: RankedTheme): LifeRiskDomain | undefined {
  return theme.domains[0];
}

function navigateLines(theme: RankedTheme): [string, string, string] {
  const spec = THEME_CATALOG[theme.id];
  const domain = primaryDomain(theme);
  const override = domain ? spec.domainMoves?.[domain] : undefined;
  return override || spec.moves;
}

function pickNavigate(
  theme: RankedTheme,
  date: string,
  held: boolean,
  memory?: TodayMoveMemory | null,
): string {
  if (held && memory?.move && memory.themeId === theme.id) {
    return memory.move;
  }
  const lines = navigateLines(theme);
  const salt = `${date}:${theme.id}:${theme.facts[0]?.key || 'none'}:${primaryDomain(theme) || 'default'}`;
  let move = pickDatedLine(lines, salt) || lines[0];
  if (memory?.move && move === memory.move && !held) {
    const idx = lines.findIndex((line) => line === move);
    move = lines[(Math.max(0, idx) + 1) % lines.length];
  }
  return move;
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

function synthesizeWhy(primary: RankedTheme, close: RankedTheme[], held: boolean): string {
  const domainBit = joinDomains(primary.domains);
  const weather =
    primary.polarity === 'opening'
      ? `A lane is open around ${primary.label.toLowerCase()}`
      : primary.polarity === 'mixed'
        ? `The weather is mixed around ${primary.label.toLowerCase()}`
        : `Pressure is up around ${primary.label.toLowerCase()}`;

  let extra = '';
  if (close.length > 1) {
    const others = close
      .slice(1)
      .map((t) => t.label.toLowerCase())
      .join(' and ');
    extra = ` A second weather is close (${others}) — treat that as mixed signals, not a second forecast.`;
  }
  const hold = held ? ' Same condition as yesterday — still on.' : '';
  return applyMerlinVoicePass(`${weather} — especially in ${domainBit}.${extra}${hold}`);
}

function synthesizeUsuallyBrings(primary: RankedTheme, close: RankedTheme[]): string {
  const lead = THEME_CATALOG[primary.id].usuallyBrings;
  if (close.length < 2) return applyMerlinVoicePass(lead);
  const second = THEME_CATALOG[close[1].id].usuallyBrings;
  return applyMerlinVoicePass(`${lead} Also nearby: ${second.charAt(0).toLowerCase()}${second.slice(1)}`);
}

function polarityForMix(close: RankedTheme[]): TodayThemePolarity {
  const set = new Set(close.map((t) => t.polarity));
  if (set.size <= 1) return close[0]?.polarity || 'mixed';
  if (set.has('friction') && set.has('opening')) return 'mixed';
  return 'mixed';
}

function synthesizeNavigate(
  primary: RankedTheme,
  close: RankedTheme[],
  date: string,
  held: boolean,
  memory: TodayMoveMemory | null | undefined,
  frame: PersonalityFrame,
): { move: string; navigate: string } {
  const core = pickNavigate(primary, date, held, memory);
  const closer = personalityCloser(frame, polarityForMix(close));
  let navigate = core;
  if (close.length > 1 && close[1].polarity !== primary.polarity) {
    const second = close[1];
    const secondHint =
      second.polarity === 'opening'
        ? `use the ${second.label.toLowerCase()} only after the first step`
        : `do not let ${second.label.toLowerCase()} steal the whole day`;
    navigate = `${core} ${secondHint.charAt(0).toUpperCase()}${secondHint.slice(1)}.`;
  }
  if (!navigate.toLowerCase().includes(closer.slice(0, 18).toLowerCase())) {
    navigate = `${navigate} ${closer}`;
  }
  return { move: core, navigate: applyMerlinVoicePass(navigate) };
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
  date: string;
  held: boolean;
  memory?: TodayMoveMemory | null;
  mbtiType?: string | null;
  confluenceAligned?: boolean;
  tripleHit?: boolean;
}): TodayOracleBrief {
  const close = input.closeThemes?.length ? input.closeThemes : [input.theme];
  const primary = close.find((t) => t.id === input.theme.id) || input.theme;
  const spec = THEME_CATALOG[primary.id];
  const lead = primary.facts[0];
  const frame = personalityFrame(input.mbtiType);
  const framed = Boolean(input.mbtiType && /^[IE][NS][TF][JP]$/i.test(input.mbtiType));

  let chartConfidence = chartConfidenceFromThemes(close);
  let readConfidence = readConfidenceFromThemes(close, { framed, held: input.held });
  if (input.confluenceAligned) readConfidence = Math.min(90, readConfidence + 4);
  if (input.tripleHit) chartConfidence = Math.min(92, chartConfidence + 6);

  const blended = Math.round((chartConfidence * 0.55 + readConfidence * 0.45));
  const { move, navigate } = synthesizeNavigate(
    primary,
    close,
    input.date,
    input.held,
    input.memory,
    frame,
  );

  return {
    move: applyMerlinVoicePass(move),
    whyToday: synthesizeWhy(primary, close, input.held),
    usuallyBrings: synthesizeUsuallyBrings(primary, close),
    navigate,
    watchFor: spec.watch,
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
  };
}
