import {
  buildSparklinePoints,
  getCalibrationImpact,
  getLatestCalibrationComparison,
  getRecentImpactSeries,
  getTopMover,
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

  it('returns top mover by absolute delta', () => {
    const entry: CalibrationHistoryEntry = {
      ...baseEntry('a', '2026-05-19T12:00:00.000Z', 0.04),
      modifierDelta: [
        { planet: 'Moon', previous: 1.0, current: 1.05, delta: 0.05 },
        { planet: 'Mars', previous: 1.0, current: 0.88, delta: -0.12 },
      ],
    };

    const topMover = getTopMover(entry);
    expect(topMover?.planet).toBe('Mars');
    expect(topMover?.delta).toBe(-0.12);
  });

  it('builds latest vs previous comparison using recent ordering', () => {
    const latest = baseEntry('latest', '2026-05-19T12:00:00.000Z', 0.03);
    latest.modifierDelta = [
      { planet: 'Saturn', previous: 1.0, current: 1.11, delta: 0.11 },
      { planet: 'Moon', previous: 1.0, current: 0.95, delta: -0.05 },
    ];

    const previous = baseEntry('previous', '2026-05-18T12:00:00.000Z', 0.02);

    const comparison = getLatestCalibrationComparison([previous, latest]);
    expect(comparison?.latest.id).toBe('latest');
    expect(comparison?.previous.id).toBe('previous');
    expect(comparison?.topMovers[0].planet).toBe('Saturn');
  });

  it('returns recent impact series in chronological order', () => {
    const oldest = baseEntry('oldest', '2026-05-17T12:00:00.000Z', 0.02);
    const middle = baseEntry('middle', '2026-05-18T12:00:00.000Z', 0.07);
    const latest = baseEntry('latest', '2026-05-19T12:00:00.000Z', 0.03);

    const series = getRecentImpactSeries([latest, oldest, middle], 3);
    expect(series).toEqual([0.02, 0.07, 0.03]);
  });

  it('builds svg sparkline points for multiple values', () => {
    const points = buildSparklinePoints([0.02, 0.07, 0.03], 100, 20, 2);
    expect(points.length).toBeGreaterThan(0);
    expect(points.split(' ').length).toBe(3);
  });

  it('builds centered point for single value sparkline', () => {
    const points = buildSparklinePoints([0.05], 100, 20, 2);
    expect(points.includes(',')).toBe(true);
    expect(points.split(' ').length).toBe(1);
  });
});
