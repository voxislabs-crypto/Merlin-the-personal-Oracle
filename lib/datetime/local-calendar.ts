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
