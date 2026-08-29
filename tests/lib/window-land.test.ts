import { writeTodayMoveMemory } from '@/lib/atmosphere/today-oracle/novelty';
import {
  preservePriorWeatherWindow,
  readOrHydrateWeatherWindowSnapshot,
  readWeatherLandVote,
  readWeatherWindowSnapshot,
  snapshotFromTodayMoveMemory,
  writeWeatherLandVote,
  writeWeatherWindowSnapshot,
  yesterdayCalendarDate,
} from '@/lib/atmosphere/window-land';

describe('window-land', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores a dated snapshot without overwriting other days', () => {
    writeWeatherWindowSnapshot(
      { date: '2026-08-28', move: 'Send the draft.', themeLabel: 'Clarity is thin', intensity: 42 },
      'user-1',
    );
    writeWeatherWindowSnapshot(
      { date: '2026-08-29', move: 'Ask once, then wait.', themeLabel: 'Emotional heat' },
      'user-1',
    );

    expect(readWeatherWindowSnapshot('2026-08-28', 'user-1')?.move).toBe('Send the draft.');
    expect(readWeatherWindowSnapshot('2026-08-29', 'user-1')?.move).toBe('Ask once, then wait.');
    expect(readWeatherWindowSnapshot('2026-08-28', 'user-2')).toBeNull();
  });

  it('records a land/miss vote once per date', () => {
    writeWeatherLandVote('2026-08-28', 'landed', 'user-1');
    expect(readWeatherLandVote('2026-08-28', 'user-1')).toBe('landed');
    expect(readWeatherLandVote('2026-08-29', 'user-1')).toBeNull();
  });

  it('preserves yesterday’s move before today overwrites memory', () => {
    writeTodayMoveMemory(
      {
        date: '2026-08-28',
        themeId: 'emotional-restraint',
        move: 'Ask for the concrete need.',
        factKey: 'Moon square Saturn',
      },
      'user-1',
    );

    preservePriorWeatherWindow('2026-08-29', 'user-1');
    expect(readWeatherWindowSnapshot('2026-08-28', 'user-1')?.move).toBe(
      'Ask for the concrete need.',
    );
  });

  it('hydrates a snapshot from today-move memory for the matching date', () => {
    writeTodayMoveMemory(
      {
        date: '2026-08-28',
        themeId: 'fog-clarity',
        move: 'Name one fact, then stop.',
        factKey: 'Neptune square Mercury',
      },
      'user-1',
    );

    expect(snapshotFromTodayMoveMemory('2026-08-28', 'user-1')?.move).toBe(
      'Name one fact, then stop.',
    );
    expect(readOrHydrateWeatherWindowSnapshot('2026-08-28', 'user-1')?.themeLabel).toBe(
      'fog-clarity',
    );
    expect(readWeatherWindowSnapshot('2026-08-28', 'user-1')?.move).toBe('Name one fact, then stop.');
  });

  it('steps calendar dates without UTC drift', () => {
    expect(yesterdayCalendarDate('2026-03-01')).toBe('2026-02-28');
    expect(yesterdayCalendarDate('2026-01-01')).toBe('2025-12-31');
  });
});
