/**
 * Today's move — three-layer engine.
 * 1. Facts: structured transits (no copy)
 * 2. Meaning: merge into ranked themes
 * 3. Oracle synthesis: one narrative tied back to those facts
 */

import type { AtmospherePacket } from '@/lib/atmosphere/types';
import { gatherTodayFacts, type TodayFactTransitRow } from '@/lib/atmosphere/today-oracle/facts';
import { mergeFactsIntoThemes, selectCloseThemes } from '@/lib/atmosphere/today-oracle/meaning';
import { selectThemeWithNovelty } from '@/lib/atmosphere/today-oracle/novelty';
import { synthesizeTodayOracle } from '@/lib/atmosphere/today-oracle/synthesis';
import type { TodayMoveMemory, TodayOracleBrief } from '@/lib/atmosphere/today-oracle/types';

export type { TransitFact, RankedTheme, TodayMoveMemory, TodayOracleBrief, TodayThemeId } from '@/lib/atmosphere/today-oracle/types';
export { gatherTodayFacts } from '@/lib/atmosphere/today-oracle/facts';
export {
  mergeFactsIntoThemes,
  selectCloseThemes,
  themeIdForFact,
  THEME_CATALOG,
  CLOSE_THEME_RATIO,
} from '@/lib/atmosphere/today-oracle/meaning';
export { personalityFrame } from '@/lib/atmosphere/today-oracle/personality-lens';
export { WEATHER_PRINCIPLE } from '@/lib/atmosphere/today-oracle/synthesis';
export {
  selectThemeWithNovelty,
  readTodayMoveMemory,
  writeTodayMoveMemory,
  NOVELTY_KEEP_RATIO,
} from '@/lib/atmosphere/today-oracle/novelty';
export { synthesizeTodayOracle } from '@/lib/atmosphere/today-oracle/synthesis';

export interface ComposeTodayOracleInput {
  date?: string | null;
  packet?: AtmospherePacket | null;
  transitLookup?: TodayFactTransitRow[] | null;
  memory?: TodayMoveMemory | null;
  mbtiType?: string | null;
  maskType?: string | null;
}

export function composeTodayOracle(input: ComposeTodayOracleInput): TodayOracleBrief | null {
  const date = input.date || input.packet?.date;
  if (!date) return null;

  const facts = gatherTodayFacts({
    transitLookup: input.transitLookup,
    packet: input.packet,
  });
  if (!facts.length) return null;

  const themes = mergeFactsIntoThemes(facts);
  const selected = selectThemeWithNovelty(themes, input.memory ?? null, date);
  if (!selected) return null;

  const close = selectCloseThemes(themes);
  const closeWithPrimary = [
    selected.theme,
    ...close.filter((theme) => theme.id !== selected.theme.id),
  ].slice(0, 3);

  return synthesizeTodayOracle({
    theme: selected.theme,
    closeThemes: closeWithPrimary,
    date,
    held: selected.held,
    memory: input.memory,
    mbtiType: input.mbtiType,
    maskType: input.maskType,
    confluenceAligned: input.packet?.confluence?.aligned,
    tripleHit: input.packet?.confluence?.tripleHit,
  });
}
