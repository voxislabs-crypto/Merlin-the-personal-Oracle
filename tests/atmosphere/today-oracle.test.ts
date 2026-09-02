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
  it('uses the dual test-by-deadline as the headline, not the exit-ramp proverb', () => {
    const brief = composeTodayOracle({
      date: '2026-09-02',
      transitLookup: [{ transit_aspect: 'Uranus square Venus', orb: '0.30°', score: 96 }],
      mbtiType: 'INFP',
      maskType: 'INTP',
    });
    expect(brief).not.toBeNull();
    expect(brief!.move.toLowerCase()).toMatch(/6pm|test|value|sentence/);
    expect(brief!.move.toLowerCase()).not.toMatch(/change one variable/);
    expect(brief!.move.toLowerCase()).not.toMatch(/keep an exit ramp/);
    expect(brief!.resolution.toLowerCase()).toMatch(/test by 6pm/);
  });

  it("does not keep yesterday's proverb as the headline when dual copy exists", () => {
    const brief = composeTodayOracle({
      date: '2026-09-02',
      transitLookup: [{ transit_aspect: 'Uranus square Venus', orb: '0.30°', score: 96 }],
      mbtiType: 'INFP',
      maskType: 'INTP',
      memory: {
        date: '2026-09-01',
        themeId: 'sudden-shift',
        move: 'Change one variable, not the whole life. Keep an exit ramp.',
        factKey: 'Uranus square Venus',
      },
    });
    expect(brief!.move.toLowerCase()).not.toMatch(/keep an exit ramp/);
    expect(brief!.move.toLowerCase()).not.toMatch(/change one variable/);
    expect(brief!.move.toLowerCase()).toMatch(/6pm|test|value|sentence/);
  });

  it('leads with the actual chart hit and a human translation', () => {
    const brief = composeTodayOracle({
      date: '2026-08-13',
      transitLookup: [{ transit_aspect: 'Moon square Saturn', orb: '0.40°', score: 95 }],
    });
    expect(brief).not.toBeNull();
    expect(brief!.leadFact).toMatch(/Moon is squaring your Saturn/i);
    expect(brief!.leadFact.toLowerCase()).toMatch(/duty|limits|verdict|character/);
    expect(brief!.whyToday).toMatch(/Moon square Saturn/i);
    expect(brief!.move).toMatch(/by (noon|3pm|6pm)/i);
    expect(brief!.watchFor).toMatch(/\d(am|pm)/i);
    expect(brief!.doNot.length).toBeGreaterThan(8);
    expect(brief!.chartConfidence).toBeGreaterThan(50);
    expect(brief!.readConfidence).toBeGreaterThan(40);
    expect(brief!.move).not.toMatch(/one reversible step only/i);
    expect(brief!.confidenceWhy).toMatch(/%/);
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
    expect(framed?.leadFactDisplay).toBe(base?.leadFactDisplay);
    expect(framed?.chartWhy.toLowerCase()).toMatch(/competence|experiment|system|criterion/);
    expect(framed?.chartWhy).not.toMatch(/\bINTJ\b/);
  });

  it('soothes Core and coaches Mask on the card without printing type labels', () => {
    const base = composeTodayOracle({
      date: '2026-08-13',
      transitLookup: [{ transit_aspect: 'Moon square Saturn', orb: '0.40°', score: 95 }],
    });
    const dual = composeTodayOracle({
      date: '2026-08-13',
      mbtiType: 'INFJ',
      maskType: 'INTP',
      transitLookup: [{ transit_aspect: 'Moon square Saturn', orb: '0.40°', score: 95 }],
    });
    expect(dual?.themeId).toBe(base?.themeId);
    expect(dual?.leadFactDisplay).toBe(base?.leadFactDisplay);
    expect(dual?.move.toLowerCase()).toMatch(/pattern|sentence|analysis|vision|feeling/);
    expect(dual?.chartWhy.toLowerCase()).toMatch(/coherence|vision|duty|meaning/);
    expect(dual?.watchFor.toLowerCase()).toMatch(/briefing|feeling|withdrawal|over-responsibility/);
    expect(`${dual?.move} ${dual?.chartWhy} ${dual?.watchFor} ${dual?.doNot}`).not.toMatch(
      /\b(INFJ|INTP)\b/,
    );
  });

  it('names the Venus hit and a 6pm constraint for Uranus square Venus', () => {
    const brief = composeTodayOracle({
      date: '2026-09-01',
      sunSign: 'Leo',
      mbtiType: 'INFP',
      maskType: 'INTP',
      moonSign: 'Taurus',
      moonPhase: 'Waning Gibbous',
      streak: 1,
      transitLookup: [
        { transit_aspect: 'Uranus square Venus', orb: '0.30°', score: 96 },
        { transit_aspect: 'Jupiter square Moon', orb: '1.20°', score: 80 },
      ],
      packet: {
        risk: {
          domains: [
            { name: 'love', label: 'Relationships', friction: 72, support: 20, hitCount: 2 },
            { name: 'family', label: 'Home', friction: 64, support: 18, hitCount: 1 },
            { name: 'career', label: 'Career', friction: 22, support: 40, hitCount: 0 },
          ],
          topDrivers: [
            {
              label: 'Uranus square Venus',
              friction: 80,
              kind: 'friction',
              domains: ['love'],
              source: 'transit',
            },
          ],
        },
      } as AtmospherePacket,
    });
    expect(brief?.leadFact).toMatch(/Uranus is squaring your Venus/i);
    expect(brief?.leadFact.toLowerCase()).toMatch(/relationship|self-worth/);
    expect(brief?.chartWhy).toMatch(/Leo/);
    expect(brief?.chartWhy).not.toMatch(/\b(INFP|INTP)\b/);
    expect(brief?.chartWhy.toLowerCase()).toMatch(/authenticit|feel|self-worth/);
    expect(brief?.move).toMatch(/6pm/i);
    expect(brief?.move.toLowerCase()).toMatch(/value/);
    expect(brief?.move.toLowerCase()).toMatch(/sentence|test/);
    expect(brief?.watchFor).toMatch(/4–7pm|4-7pm/i);
    expect(brief?.watchFor.toLowerCase()).toMatch(/briefing|feeling/);
    expect(brief?.doNot.toLowerCase()).toMatch(/explaining|proving you are fine|variable/);
    expect(brief?.personalHook?.toLowerCase()).toMatch(/first return|constraint/);
    expect(brief?.domainJob).toMatch(/Relationships/i);
    expect(brief?.whyToday).toMatch(/Jupiter square Moon/i);
    expect(`${brief?.move} ${brief?.chartWhy} ${brief?.watchFor} ${brief?.doNot}`).not.toMatch(
      /\b(INFP|INTP)\b/,
    );
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
