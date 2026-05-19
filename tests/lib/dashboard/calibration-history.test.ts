import {
  getCalibrationImpact,
  parseCalibrationHistoryDays,
  parseCalibrationSortMode,
  sortCalibrationHistory,
  type CalibrationHistoryEntry,
} from '../../../lib/dashboard/calibration-history';

describe('dashboard calibration history helpers', () => {
  const baseEntry = (id: string, createdAt: string, delta: number, impactScore?: number): CalibrationHistoryEntry => ({
    id,
    createdAt,
    windowDays: 30,
    sampleSize: 10,
    minSamples: 3,
    strongestModifier: null,
    modifierCount: 1,
    modifiers: { Saturn: 1.1 },
    modifierDelta: [{ planet: 'Saturn', previous: 1.0, current: 1.0 + delta, delta }],
    impactScore,
  });

  it('parses supported history day windows', () => {
    expect(parseCalibrationHistoryDays('7')).toBe(7);
    expect(parseCalibrationHistoryDays('30')).toBe(30);
    expect(parseCalibrationHistoryDays('90')).toBe(90);
    expect(parseCalibrationHistoryDays('15')).toBeNull();
  });

  it('parses calibration sort mode values', () => {
    expect(parseCalibrationSortMode('recent')).toBe('recent');
    expect(parseCalibrationSortMode('impact')).toBe('impact');
    expect(parseCalibrationSortMode('other')).toBeNull();
  });

  it('computes impact from explicit score first', () => {
    const entry = baseEntry('a', '2026-05-19T12:00:00.000Z', 0.04, 0.21);
    expect(getCalibrationImpact(entry)).toBe(0.21);
  });

  it('sorts by impact then recency', () => {
    const highImpactOlder = baseEntry('a', '2026-05-18T12:00:00.000Z', 0.2);
    const lowImpactNewer = baseEntry('b', '2026-05-19T12:00:00.000Z', 0.05);

    const sorted = sortCalibrationHistory([lowImpactNewer, highImpactOlder], 'impact');
    expect(sorted.map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('sorts by recency in recent mode', () => {
    const older = baseEntry('a', '2026-05-18T12:00:00.000Z', 0.2);
    const newer = baseEntry('b', '2026-05-19T12:00:00.000Z', 0.05);

    const sorted = sortCalibrationHistory([older, newer], 'recent');
    expect(sorted.map((entry) => entry.id)).toEqual(['b', 'a']);
  });
});
