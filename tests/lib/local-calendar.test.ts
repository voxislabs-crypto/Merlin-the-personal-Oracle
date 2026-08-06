import {
  calendarDateToLocalNoon,
  getLocalCalendarDate,
  isValidCalendarDate,
  isWeatherDateStale,
  resolveForecastTargetDate,
} from '@/lib/datetime/local-calendar';

describe('local-calendar', () => {
  it('validates YYYY-MM-DD', () => {
    expect(isValidCalendarDate('2026-08-06')).toBe(true);
    expect(isValidCalendarDate('08-06-2026')).toBe(false);
    expect(isValidCalendarDate(null)).toBe(false);
  });

  it('prefers clientDate for forecast target', () => {
    expect(resolveForecastTargetDate('2026-08-06')).toBe('2026-08-06');
    const fallback = resolveForecastTargetDate(undefined, new Date(2026, 7, 6, 15, 0, 0));
    expect(fallback).toBe('2026-08-06');
  });

  it('detects stale weather packets', () => {
    expect(isWeatherDateStale('2026-08-05', '2026-08-06')).toBe(true);
    expect(isWeatherDateStale('2026-08-06', '2026-08-06')).toBe(false);
    expect(isWeatherDateStale(null, '2026-08-06')).toBe(false);
  });

  it('parses calendar date as local noon', () => {
    const d = calendarDateToLocalNoon('2026-08-06');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(6);
    expect(d.getHours()).toBe(12);
  });

  it('formats local calendar date', () => {
    expect(getLocalCalendarDate(new Date(2026, 7, 6, 0, 30, 0))).toBe('2026-08-06');
  });
});
