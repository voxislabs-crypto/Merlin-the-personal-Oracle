import {
  APPROVED_PATTERN_HINTS,
  assertCopySafeText,
  findBlockedPhrases,
  isCopySafe,
  sanitizeCopyText,
} from '@/lib/safety/copy-safety';

describe('copy safety blocker', () => {
  it('flags deterministic and fear-amplifying phrasing', () => {
    const sample = 'This will happen soon and you cannot avoid the outcome.';
    const blocked = findBlockedPhrases(sample);

    expect(blocked.length).toBeGreaterThan(0);
    expect(isCopySafe(sample)).toBe(false);
  });

  it('accepts approved probabilistic phrasing', () => {
    const safeCopy = [
      'This period may increase relationship pressure; choose reversible steps.',
      'You might notice emotional intensity rise and fall through the week.',
      'Potential pressure is elevated in career decisions. Consider pausing before major conclusions.',
    ];

    const result = assertCopySafeText(safeCopy);

    expect(result.safe).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('exports guideline hints for UI/tooling', () => {
    expect(APPROVED_PATTERN_HINTS.length).toBeGreaterThanOrEqual(3);
  });

  it('sanitizes blocked phrasing into probabilistic language', () => {
    const unsafe = 'This will happen soon. You cannot avoid what comes next.';
    const safe = sanitizeCopyText(unsafe);

    expect(safe).toContain('This may unfold');
    expect(safe).toContain('This may be hard to avoid');
    expect(isCopySafe(safe)).toBe(true);
  });
});
