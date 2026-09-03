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

  it('cites Storm Watch alarm and friction so they do not look like a fight', () => {
    expect(formatStormWatchScoreLine('Storm Watch', 85, 71)).toBe(
      'Storm Watch 85, friction 71',
    );
    expect(formatStormWatchScoreLine('Storm Watch', 85, 85)).toBe('Storm Watch 85');
    expect(formatStormWatchScoreLine('Caution', 65, null)).toBe('Caution 65');
  });

  it('labels the compact UI pair', () => {
    expect(formatDualScoreUi(85, 71)).toBe('85% alarm · 71% friction');
    expect(formatDualScoreUi(85, 85)).toBe('85% alarm');
    expect(formatDualScoreUi(85, null)).toBe('85% alarm');
  });

  it('does not fall friction back to the alarm', () => {
    expect(resolveFrictionPercent({ overallFriction: 71 })).toBe(71);
    expect(resolveFrictionPercent(null)).toBeNull();
    expect(resolveFrictionPercent({ overallFriction: Number.NaN })).toBeNull();
  });

  it('share suffix names both meters when they differ', () => {
    expect(formatShareScoreSuffix(85, 71)).toBe(' · Storm Watch 85, friction 71');
    expect(formatShareScoreSuffix(undefined, 73)).toBe(' · friction 73/100');
    expect(formatShareScoreSuffix(40, undefined)).toBe(' · alarm 40%');
  });

  it('oracle block names alarm vs hard-aspect load', () => {
    const block = formatScorePairContext('Storm Watch', 85, 71);
    expect(block).toMatch(/SCORE PAIR/);
    expect(block).toMatch(/Storm Watch 85, friction 71/);
    expect(block).toMatch(/hard-aspect load/);
    expect(block).toMatch(/alarm: 85%/);
    expect(block).toMatch(/Never present two unlabeled percents as competing official scores/);
  });
});
