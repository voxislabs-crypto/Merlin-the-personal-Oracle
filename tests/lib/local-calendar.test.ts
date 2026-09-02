import {
  addCalendarDays,
  calendarDateFromInstant,
  calendarDateToLocalNoon,
  getLocalCalendarDate,
  isValidCalendarDate,
  isWeatherDateStale,
  resolveDisplayBirthTime,
  resolveForecastTargetDate,
  resolveWindowCalendarDate,
  shiftClockHours,
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

  it('does not slice UTC ISO strings as the calendar date', () => {
    expect(calendarDateFromInstant('2026-08-13')).toBe('2026-08-13');
    expect(calendarDateFromInstant('2026-08-13T12:00:00')).toBe('2026-08-13');
    const local = calendarDateFromInstant('2026-08-14T04:00:00.000Z');
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // US evening on the 13th is 04:00Z on the 14th — must not blindly become 08-14
    expect(local).toBe(getLocalCalendarDate(new Date('2026-08-14T04:00:00.000Z')));
  });

  it('pins peaking-now windows to local today even if peakAt is UTC tomorrow', () => {
    const today = '2026-08-13';
    expect(
      resolveWindowCalendarDate(
        { peakAt: '2026-08-14T04:00:00.000Z', daysToPeak: 0 },
        today,
      ),
    ).toBe('2026-08-13');
    expect(
      resolveWindowCalendarDate({ peakAt: '2026-08-16T12:00:00', daysToPeak: 3 }, today),
    ).toBe('2026-08-16');
    expect(addCalendarDays('2026-08-13', 1)).toBe('2026-08-14');
  });

  it('converts a UTC natal clock back to the civil time the user entered', () => {
    expect(shiftClockHours('17:21', -5)).toBe('12:21');
    expect(shiftClockHours('16:21', -4)).toBe('12:21');
    expect(
      resolveDisplayBirthTime({
        storedTime: '17:21',
        utcTime: '17:21',
        timezoneOffsetHours: -5,
      }),
    ).toBe('12:21');
    expect(
      resolveDisplayBirthTime({
        storedTime: '17:21',
        utcTime: '17:21',
        inputTime: '12:21',
        timezoneOffsetHours: -5,
      }),
    ).toBe('12:21');
    expect(
      resolveDisplayBirthTime({
        storedTime: '12:21',
        utcTime: '17:21',
        timezoneOffsetHours: -5,
      }),
    ).toBe('12:21');
  });
});
