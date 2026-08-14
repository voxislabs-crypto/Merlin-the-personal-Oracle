import { gatherTodayFacts } from '@/lib/atmosphere/today-oracle/facts';
import { mergeFactsIntoThemes, selectCloseThemes, themeIdForFact } from '@/lib/atmosphere/today-oracle/meaning';
import { NOVELTY_KEEP_RATIO, selectThemeWithNovelty } from '@/lib/atmosphere/today-oracle/novelty';
import { composeTodayOracle } from '@/lib/atmosphere/today-oracle';
import type { AtmospherePacket } from '@/lib/atmosphere/types';
import type { RankedTheme, TransitFact } from '@/lib/atmosphere/today-oracle/types';

function fact(overrides: Partial<TransitFact>): TransitFact {
  return {
    key: 'Moon square Saturn',
    transiting: 'moon',
    aspect: 'square',
    natal: 'saturn',
    display: 'Moon square Saturn',
    orbDeg: 0.8,
    band: 'hard',
    score: 80,
    domains: ['self', 'family'],
    source: 'transit-lookup',
    ...overrides,
  };
}

function theme(overrides: Partial<RankedTheme> & Pick<RankedTheme, 'id' | 'score'>): RankedTheme {
  return {
    label: overrides.id,
    polarity: 'friction',
    facts: [fact({})],
    domains: ['self'],
    ...overrides,
  };
}

describe('gatherTodayFacts', () => {
  it('collects structured rows and does not invent prose', () => {
    const facts = gatherTodayFacts({
      transitLookup: [
        { transit_aspect: 'moon square saturn', orb: '0.80°', score: 90 },
        { transit_aspect: 'not-a-transit', orb: '1°' },
      ],
    });
    expect(facts).toHaveLength(1);
    expect(facts[0].transiting).toBe('moon');
    expect(facts[0].natal).toBe('saturn');
    expect(facts[0].orbDeg).toBeCloseTo(0.8);
    expect(facts[0].display).toMatch(/Moon square Saturn/i);
  });

  it('merges packet drivers with lookup rows', () => {
    const facts = gatherTodayFacts({
      transitLookup: [{ transit_aspect: 'Mercury square Mars', orb: '2.1°' }],
      packet: {
        dominantDriver: { label: 'Venus conjunct Neptune', rationale: '', source: 'transit' },
        risk: {
          topDrivers: [
            {
              label: 'Saturn square Sun',
              friction: 70,
              kind: 'friction',
              domains: ['career'],
              source: 'transit',
            },
          ],
        },
      } as AtmospherePacket,
    });
    const keys = facts.map((f) => f.key.toLowerCase());
    expect(keys.some((k) => k.includes('mercury'))).toBe(true);
    expect(keys.some((k) => k.includes('venus'))).toBe(true);
    expect(keys.some((k) => k.includes('saturn'))).toBe(true);
  });
});

describe('meaning engine', () => {
  it('maps moon + saturn to emotional restraint', () => {
    expect(themeIdForFact(fact({}))).toBe('emotional-restraint');
  });

  it('maps mercury soft aspects to a communication opening', () => {
    expect(
      themeIdForFact(
        fact({
          key: 'Mercury trine Jupiter',
          transiting: 'mercury',
          aspect: 'trine',
          natal: 'jupiter',
          display: 'Mercury trine Jupiter',
          band: 'soft',
        }),
      ),
    ).toBe('communication-opening');
  });

  it('clusters two heat facts into one theme', () => {
    const ranked = mergeFactsIntoThemes([
      fact({
        key: 'Moon square Mars',
        transiting: 'moon',
        natal: 'mars',
        display: 'Moon square Mars',
      }),
      fact({
        key: 'Moon opposition Pluto',
        transiting: 'moon',
        natal: 'pluto',
        display: 'Moon opposition Pluto',
        aspect: 'opposition',
      }),
    ]);
    expect(ranked[0].id).toBe('emotional-heat');
    expect(ranked[0].facts.length).toBe(2);
  });
});

describe('novelty', () => {
  const restraint = theme({ id: 'emotional-restraint', score: 80, label: 'Emotional restraint' });
  const opening = theme({
    id: 'communication-opening',
    score: 100,
    label: 'Communication opening',
    polarity: 'opening',
  });

  it('keeps yesterday when that theme is still close to the winner', () => {
    const picked = selectThemeWithNovelty(
      [opening, restraint],
      {
        date: '2026-08-12',
        themeId: 'emotional-restraint',
        move: 'Protect a quiet hour.',
        factKey: 'Moon square Saturn',
      },
      '2026-08-13',
    );
    expect(restraint.score).toBeGreaterThanOrEqual(opening.score * NOVELTY_KEEP_RATIO);
    expect(picked?.held).toBe(true);
    expect(picked?.theme.id).toBe('emotional-restraint');
  });

  it('rotates when yesterday no longer applies', () => {
    const picked = selectThemeWithNovelty(
      [opening, { ...restraint, score: 10 }],
      {
        date: '2026-08-12',
        themeId: 'emotional-restraint',
        move: 'Protect a quiet hour.',
        factKey: 'Moon square Saturn',
      },
      '2026-08-13',
    );
    expect(picked?.held).toBe(false);
    expect(picked?.theme.id).toBe('communication-opening');
  });

  it('does not rotate mid-day', () => {
    const picked = selectThemeWithNovelty(
      [opening, restraint],
      {
        date: '2026-08-13',
        themeId: 'emotional-restraint',
        move: 'Protect a quiet hour.',
        factKey: 'Moon square Saturn',
      },
      '2026-08-13',
    );
    expect(picked?.held).toBe(true);
    expect(picked?.theme.id).toBe('emotional-restraint');
  });
});

describe('close themes', () => {
  it('keeps companions when scores are close', () => {
    const close = selectCloseThemes([
      theme({ id: 'emotional-heat', score: 100, label: 'Emotional heat' }),
      theme({
        id: 'communication-opening',
        score: 88,
        label: 'Communication opening',
        polarity: 'opening',
      }),
      theme({ id: 'fog-clarity', score: 40, label: 'Clarity is thin' }),
    ]);
    expect(close.map((t) => t.id)).toEqual(['emotional-heat', 'communication-opening']);
  });
});

describe('composeTodayOracle', () => {
  it('describes weather and navigation instead of aspect soup', () => {
    const brief = composeTodayOracle({
      date: '2026-08-13',
      transitLookup: [{ transit_aspect: 'Moon square Saturn', orb: '0.40°', score: 95 }],
    });
    expect(brief).not.toBeNull();
    expect(brief!.whyToday).not.toMatch(/square|opposition|trine|sextile|conjunct/i);
    expect(brief!.whyToday.toLowerCase()).toMatch(/pressure|restraint|weather|lane/);
    expect(brief!.usuallyBrings.toLowerCase()).toMatch(/mood|dut|isolat/);
    expect(brief!.watchFor.length).toBeGreaterThan(8);
    expect(brief!.chartConfidence).toBeGreaterThan(50);
    expect(brief!.readConfidence).toBeGreaterThan(40);
    expect(brief!.move).not.toMatch(/one reversible step only/i);
    expect(brief!.principle.toLowerCase()).toMatch(/weather/);
  });

  it('splits chart confidence from interpretive confidence when signals mix', () => {
    const brief = composeTodayOracle({
      date: '2026-08-13',
      transitLookup: [
        { transit_aspect: 'Moon square Saturn', orb: '0.40°', score: 95 },
        { transit_aspect: 'Mercury trine Jupiter', orb: '0.45°', score: 94 },
      ],
    });
    expect(brief?.supportingSignals.length).toBeGreaterThan(1);
    expect(brief?.mixedSignals).toBe(true);
    expect(brief?.chartConfidence).not.toEqual(brief?.readConfidence);
    expect(brief?.readConfidence).toBeLessThan(brief!.chartConfidence);
  });

  it('changes navigation by life domain, not just the transit name', () => {
    const career = composeTodayOracle({
      date: '2026-08-13',
      transitLookup: [{ transit_aspect: 'Mars square Saturn', orb: '0.50°', score: 90 }],
      packet: {
        risk: {
          topDrivers: [
            {
              label: 'Mars square Saturn',
              friction: 80,
              kind: 'friction',
              domains: ['career'],
              source: 'transit',
            },
          ],
        },
      } as AtmospherePacket,
    });
    const love = composeTodayOracle({
      date: '2026-08-13',
      transitLookup: [{ transit_aspect: 'Mars square Saturn', orb: '0.50°', score: 90 }],
      packet: {
        risk: {
          topDrivers: [
            {
              label: 'Mars square Saturn',
              friction: 80,
              kind: 'friction',
              domains: ['love'],
              source: 'transit',
            },
          ],
        },
      } as AtmospherePacket,
    });
    expect(career?.move.toLowerCase()).toMatch(/work|career|meeting|brick/);
    expect(love?.move.toLowerCase()).toMatch(/relationship|fight|home|ask/);
    expect(career?.move).not.toBe(love?.move);
  });

  it('keeps the weather the same when personality changes the framing', () => {
    const base = composeTodayOracle({
      date: '2026-08-13',
      transitLookup: [{ transit_aspect: 'Moon square Saturn', orb: '0.40°', score: 95 }],
    });
    const framed = composeTodayOracle({
      date: '2026-08-13',
      mbtiType: 'INTJ',
      transitLookup: [{ transit_aspect: 'Moon square Saturn', orb: '0.40°', score: 95 }],
    });
    expect(framed?.themeId).toBe(base?.themeId);
    expect(framed?.navigate.toLowerCase()).toMatch(/criterion|inch|calendar|structure|write/);
  });

  it('reuses yesterday’s move when the theme still applies', () => {
    const brief = composeTodayOracle({
      date: '2026-08-13',
      transitLookup: [{ transit_aspect: 'Moon square Saturn', orb: '0.40°', score: 95 }],
      memory: {
        date: '2026-08-12',
        themeId: 'emotional-restraint',
        move: 'Ask for the concrete need. Skip the self-trial.',
        factKey: 'Moon square Saturn',
      },
    });
    expect(brief?.heldFromYesterday).toBe(true);
    expect(brief?.move).toBe('Ask for the concrete need. Skip the self-trial.');
  });
});
