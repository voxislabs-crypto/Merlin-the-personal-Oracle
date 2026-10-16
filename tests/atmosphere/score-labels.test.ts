import {
  dualScoresNeedLabels,
  formatDualScoreUi,
  formatScorePairContext,
  formatShareScoreSuffix,
  formatStormWatchScoreLine,
  resolveFrictionPercent,
} from '@/lib/atmosphere/score-labels';

describe('score-labels', () => {
  it('treats a 85 vs 71 gap as two meters that need labels', () => {
    expect(dualScoresNeedLabels(85, 71)).toBe(true);
    expect(dualScoresNeedLabels(85, 85)).toBe(false);
    expect(dualScoresNeedLabels(85, 83)).toBe(false);
  });

  it('cites symbolic intensity and friction load as heuristics', () => {
    expect(formatStormWatchScoreLine('Storm Watch', 85, 71)).toBe(
      'Symbolic intensity 85 (heuristic), friction load 71',
    );
    expect(formatStormWatchScoreLine('Storm Watch', 85, 85)).toBe(
      'Symbolic intensity 85 (heuristic), friction load 85',
    );
    expect(formatStormWatchScoreLine('Caution', 65, null)).toBe(
      'Symbolic intensity 65 (heuristic)',
    );
  });

  it('labels the compact UI pair without a percent glyph', () => {
    expect(formatDualScoreUi(85, 71)).toBe('85 symbolic intensity · 71 friction load');
    expect(formatDualScoreUi(85, 85)).toBe('85 symbolic intensity · 85 friction load');
    expect(formatDualScoreUi(85, null)).toBe('85 symbolic intensity');
    expect(formatDualScoreUi(85, 71)).not.toMatch(/%|alarm|risk|probability/i);
  });

  it('does not fall friction back to the alarm', () => {
    expect(resolveFrictionPercent({ overallFriction: 71 })).toBe(71);
    expect(resolveFrictionPercent(null)).toBeNull();
    expect(resolveFrictionPercent({ overallFriction: Number.NaN })).toBeNull();
  });

  it('share suffix names both meters when they differ', () => {
    expect(formatShareScoreSuffix(85, 71)).toBe(
      ' · symbolic intensity 85, friction load 71',
    );
    expect(formatShareScoreSuffix(undefined, 73)).toBe(' · friction load 73');
    expect(formatShareScoreSuffix(40, undefined)).toBe(
      ' · symbolic intensity 40 (heuristic)',
    );
    expect(formatShareScoreSuffix(85, 71)).not.toMatch(/%|alarm|risk|probability/i);
  });

  it('oracle block treats scores as heuristic intensity', () => {
    const block = formatScorePairContext('Storm Watch', 85, 71);
    expect(block).toMatch(/SCORE PAIR/);
    expect(block).toMatch(/Symbolic intensity 85 \(heuristic\), friction load 71/);
    expect(block).toMatch(/hard-aspect load/);
    expect(block).toMatch(/not a calibrated probability/);
    expect(block).toMatch(/not a 70% chance/);
    expect(block).toMatch(/Never say "N% risk"/);
    expect(block).not.toMatch(/\d+% alarm/);
    expect(block).not.toMatch(/Symbolic intensity \d+%/);
  });
});
