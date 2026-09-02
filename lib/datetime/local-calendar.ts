/**
 * Client-local calendar day helpers.
 * Weather "today" must follow the user's clock, not server UTC.
 */

/** YYYY-MM-DD in the environment's local timezone. */
export function getLocalCalendarDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Add whole days to a YYYY-MM-DD calendar date without UTC shift. */
export function addCalendarDays(dateStr: string, days: number): string {
  const base = calendarDateToLocalNoon(dateStr);
  base.setDate(base.getDate() + days);
  return getLocalCalendarDate(base);
}

/**
 * Calendar day for a timestamp.
 * Bare / naive YYYY-MM-DD[THH:mm:ss] keeps the written date (local-noon convention).
 * Zoned ISO (Z / offset) converts to the *local* calendar — never slice the UTC date.
 */
export function calendarDateFromInstant(value?: string | null): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const naive = raw.match(/^(\d{4}-\d{2}-\d{2})T[\d:.]+$/);
  if (naive && !/[zZ]|[+-]\d{2}:\d{2}$/.test(raw)) return naive[1];
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return getLocalCalendarDate(d);
}

/**
 * Map a friction/support window onto the user's local horizon.
 * "Peaking now" (daysToPeak <= 0) always lands on local today, even if peakAt is UTC tomorrow.
 */
export function resolveWindowCalendarDate(
  window: {
    peakAt?: string;
    startsAt?: string;
    endsAt?: string;
    daysToPeak?: number;
  },
  today: string,
): string | null {
  if (typeof window.daysToPeak === 'number' && Number.isFinite(window.daysToPeak) && window.daysToPeak <= 0) {
    return today;
  }
  return (
    calendarDateFromInstant(window.peakAt) ||
    calendarDateFromInstant(window.startsAt) ||
    calendarDateFromInstant(window.endsAt) ||
    (typeof window.daysToPeak === 'number' && Number.isFinite(window.daysToPeak)
      ? addCalendarDays(today, Math.round(window.daysToPeak))
      : null)
  );
}

export function isValidCalendarDate(value?: string | null): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Parse YYYY-MM-DD as local noon (avoids UTC day-shift when building Date for ephemeris).
 */
export function calendarDateToLocalNoon(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * Prefer clientDate when valid; else local calendar day of `now`.
 * On the server, always prefer an explicit clientDate — bare `new Date()` is host TZ/UTC.
 */
export function resolveForecastTargetDate(
  clientDate?: string | null,
  now = new Date(),
): string {
  if (isValidCalendarDate(clientDate)) return clientDate;
  return getLocalCalendarDate(now);
}

/** True when weather packet date is for a different local day than now. */
export function isWeatherDateStale(
  packetDate?: string | null,
  localDay = getLocalCalendarDate(),
): boolean {
  if (!isValidCalendarDate(packetDate)) return false;
  return packetDate !== localDay;
}

/** ms until next local midnight (+ small buffer). */
export function msUntilNextLocalMidnight(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 5, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}

function clockToMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec((hhmm || '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function minutesToClock(total: number): string {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Shift an HH:MM clock by whole hours (wraps 24h). */
export function shiftClockHours(hhmm: string, offsetHours: number): string {
  const minutes = clockToMinutes(hhmm);
  if (minutes === null || !Number.isFinite(offsetHours)) return (hhmm || '').slice(0, 5);
  return minutesToClock(minutes + Math.round(offsetHours * 60));
}

/**
 * Natal clock for You-tab display.
 * Engine stores UTC after timezone conversion; the user entered local civil time.
 * Prefer the original intake time. If we only have UTC + offset, convert back.
 */
export function resolveDisplayBirthTime(options: {
  storedTime?: string | null;
  utcTime?: string | null;
  inputTime?: string | null;
  timezoneOffsetHours?: number | null;
}): string {
  const input = (options.inputTime || '').trim().slice(0, 5);
  if (input && /^\d{1,2}:\d{2}$/.test(input)) {
    const [h, m] = input.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  const stored = (options.storedTime || '').trim().slice(0, 5);
  const utc = (options.utcTime || '').trim().slice(0, 5);
  const offset = options.timezoneOffsetHours;
  if (typeof offset === 'number' && Number.isFinite(offset) && stored && stored === utc) {
    return shiftClockHours(stored, offset);
  }
  return stored;
}
