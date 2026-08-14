/**
 * Novelty weight — keep yesterday's theme if it still applies,
 * otherwise rotate to the next-best theme.
 */

import { getLocalCalendarDate } from '@/lib/datetime/local-calendar';
import type { RankedTheme, TodayMoveMemory } from '@/lib/atmosphere/today-oracle/types';

export const TODAY_MOVE_MEMORY_KEY = 'merlin_today_move_memory';

/** Keep yesterday's theme if it is still within this fraction of today's winner. */
export const NOVELTY_KEEP_RATIO = 0.72;

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(y, (m || 1) - 1, (d || 1) + days);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isMemoryCurrentOrYesterday(memory: TodayMoveMemory | null, today: string): boolean {
  if (!memory?.date || !today) return false;
  return memory.date === today || memory.date === addDays(today, -1);
}

export function selectThemeWithNovelty(
  themes: RankedTheme[],
  memory: TodayMoveMemory | null,
  today: string,
): { theme: RankedTheme; held: boolean } | null {
  if (!themes.length) return null;
  const winner = themes[0];

  if (!memory || !isMemoryCurrentOrYesterday(memory, today)) {
    return { theme: winner, held: false };
  }

  // Same calendar day: do not rotate mid-day.
  if (memory.date === today) {
    const same = themes.find((theme) => theme.id === memory.themeId);
    if (same) return { theme: same, held: true };
    return { theme: winner, held: false };
  }

  const previous = themes.find((theme) => theme.id === memory.themeId);
  if (previous && previous.score >= winner.score * NOVELTY_KEEP_RATIO) {
    return { theme: previous, held: true };
  }

  const rotated = themes.find((theme) => theme.id !== memory.themeId) || winner;
  return { theme: rotated, held: false };
}

function storageKey(userId?: string | null): string {
  return userId ? `${TODAY_MOVE_MEMORY_KEY}:${userId}` : TODAY_MOVE_MEMORY_KEY;
}

export function readTodayMoveMemory(userId?: string | null): TodayMoveMemory | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TodayMoveMemory;
    if (!parsed?.date || !parsed.themeId || !parsed.move) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeTodayMoveMemory(
  memory: TodayMoveMemory,
  userId?: string | null,
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(memory));
  } catch {
    // localStorage failures should never block the dashboard
  }
}

export function todayStamp(now = new Date()): string {
  return getLocalCalendarDate(now);
}
