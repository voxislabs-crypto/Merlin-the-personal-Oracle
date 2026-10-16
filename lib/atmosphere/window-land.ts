import { addCalendarDays, getLocalCalendarDate } from '@/lib/datetime/local-calendar';
import { readTodayMoveMemory } from '@/lib/atmosphere/today-oracle/novelty';

export type WeatherLandVote = 'landed' | 'somewhat' | 'missed';

export type WeatherWindowSnapshot = {
  date: string;
  move?: string;
  themeLabel?: string;
  intensity?: number;
  behaviorTell?: string;
  /** Pre-stated observable from today's future-sight horizon, when one was issued. */
  watchFor?: string;
};

const SNAPSHOT_PREFIX = 'merlin_weather_window_v1:';
const VOTE_PREFIX = 'merlin_weather_land_v1:';

function snapshotKey(userId: string | null | undefined, date: string): string {
  return `${SNAPSHOT_PREFIX}${userId || 'anonymous'}:${date}`;
}

function voteKey(userId: string | null | undefined, date: string): string {
  return `${VOTE_PREFIX}${userId || 'anonymous'}:${date}`;
}

function withDefinedFields(snapshot: WeatherWindowSnapshot): WeatherWindowSnapshot {
  const next: WeatherWindowSnapshot = { date: snapshot.date };
  if (snapshot.move != null) next.move = snapshot.move;
  if (snapshot.themeLabel != null) next.themeLabel = snapshot.themeLabel;
  if (snapshot.intensity != null) next.intensity = snapshot.intensity;
  if (snapshot.behaviorTell != null) next.behaviorTell = snapshot.behaviorTell;
  if (snapshot.watchFor != null) next.watchFor = snapshot.watchFor;
  return next;
}

export function writeWeatherWindowSnapshot(
  snapshot: WeatherWindowSnapshot,
  userId?: string | null,
): void {
  if (typeof window === 'undefined') return;
  if (!snapshot.date) return;
  const prior = readWeatherWindowSnapshot(snapshot.date, userId);
  const merged: WeatherWindowSnapshot = {
    ...(prior ?? { date: snapshot.date }),
    ...withDefinedFields(snapshot),
  };
  try {
    window.localStorage.setItem(snapshotKey(userId, snapshot.date), JSON.stringify(merged));
  } catch {
    // ignore quota
  }
}

export function readWeatherWindowSnapshot(
  date: string,
  userId?: string | null,
): WeatherWindowSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(snapshotKey(userId, date));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherWindowSnapshot;
    if (!parsed?.date) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readWeatherLandVote(
  date: string,
  userId?: string | null,
): WeatherLandVote | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(voteKey(userId, date));
    if (raw === 'landed' || raw === 'somewhat' || raw === 'missed') return raw;
    return null;
  } catch {
    return null;
  }
}

export function writeWeatherLandVote(
  date: string,
  vote: WeatherLandVote,
  userId?: string | null,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(voteKey(userId, date), vote);
  } catch {
    // ignore
  }
}

export function yesterdayCalendarDate(today = getLocalCalendarDate()): string {
  return addCalendarDays(today, -1);
}

/** Hydrate a dated snapshot from the single-slot today-move memory. */
export function snapshotFromTodayMoveMemory(
  date: string,
  userId?: string | null,
): WeatherWindowSnapshot | null {
  const memory = readTodayMoveMemory(userId);
  if (!memory?.date || !memory.move || memory.date !== date) return null;
  return {
    date: memory.date,
    move: memory.move,
    themeLabel: memory.themeId,
  };
}

/**
 * Copy yesterday's move into a dated snapshot before today's memory overwrites it.
 */
export function preservePriorWeatherWindow(
  today: string,
  userId?: string | null,
): void {
  const memory = readTodayMoveMemory(userId);
  if (!memory?.date || !memory.move || memory.date === today) return;
  if (readWeatherWindowSnapshot(memory.date, userId)) return;
  writeWeatherWindowSnapshot(
    { date: memory.date, move: memory.move, themeLabel: memory.themeId },
    userId,
  );
}

export function readOrHydrateWeatherWindowSnapshot(
  date: string,
  userId?: string | null,
): WeatherWindowSnapshot | null {
  const stored = readWeatherWindowSnapshot(date, userId);
  if (stored) return stored;
  const fromMemory = snapshotFromTodayMoveMemory(date, userId);
  if (fromMemory) {
    writeWeatherWindowSnapshot(fromMemory, userId);
    return fromMemory;
  }
  return null;
}
