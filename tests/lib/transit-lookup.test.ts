import {
  formatTransitAspectKey,
  getDayRating,
  isGenericTransitDo,
  lookupTransitInterpretation,
  parseTransitAspectKey,
  resolveTransitInterpretation,
} from '@/lib/transit-lookup';

describe('transit lookup keys', () => {
  it('normalizes lowercase detected keys to the hand-authored entries', () => {
    expect(lookupTransitInterpretation('moon opposition saturn')?.effect).toBe('heavy');
    expect(lookupTransitInterpretation('Moon opposition Saturn')?.effect).toBe('heavy');
    expect(lookupTransitInterpretation('MERCURY SQUARE MARS')?.effect).toBe('tense');
  });

  it('formats detected planet names into title-case keys', () => {
    expect(formatTransitAspectKey('moon', 'opposition', 'saturn')).toBe('Moon opposition Saturn');
    expect(formatTransitAspectKey('Sun', 'Trine', 'jupiter')).toBe('Sun trine Jupiter');
  });

  it('parses mixed-case aspect keys', () => {
    expect(parseTransitAspectKey('moon square mars')).toEqual({
      transiting: 'moon',
      aspect: 'square',
      natal: 'mars',
    });
  });
});

describe('resolveTransitInterpretation', () => {
  it('composes a specific do-list when the pair is not hand-authored', () => {
    const hit = resolveTransitInterpretation('mars square moon');
    expect(hit.do.length).toBeGreaterThanOrEqual(2);
    expect(hit.do.some((line) => /one reversible step only/i.test(line))).toBe(false);
    expect(hit.interpretation.toLowerCase()).toMatch(/mars/);
    expect(hit.effect).not.toBeUndefined();
  });

  it('returns different first moves for different planet pairs', () => {
    const marsMoon = resolveTransitInterpretation('mars square moon').do[0];
    const saturnSun = resolveTransitInterpretation('saturn square sun').do[0];
    const venusNeptune = resolveTransitInterpretation('venus conjunct neptune').do[0];
    expect(new Set([marsMoon, saturnSun, venusNeptune]).size).toBeGreaterThan(1);
  });
});

describe('isGenericTransitDo', () => {
  it('flags the stuck placeholder', () => {
    expect(
      isGenericTransitDo('One reversible step only — talk, draft, or scout before you commit.'),
    ).toBe(true);
    expect(isGenericTransitDo('Send the draft, skip the argument.')).toBe(false);
    expect(
      isGenericTransitDo('Change one variable, not the whole life. Keep an exit ramp.'),
    ).toBe(true);
  });
});

describe('getDayRating', () => {
  it('accepts already-resolved effect strings', () => {
    expect(getDayRating(['heavy', 'intense', 'frustrated'])).toBe('red');
    expect(getDayRating(['expansive', 'productive'])).toBe('green');
    expect(getDayRating(['neutral', 'serious'])).toBe('yellow');
  });

  it('accepts transit objects with aspect keys', () => {
    expect(getDayRating([{ transit_aspect: 'Moon opposition Saturn' }])).toBe('red');
    expect(getDayRating([{ transit_aspect: 'Sun trine Jupiter' }])).toBe('green');
  });
});
