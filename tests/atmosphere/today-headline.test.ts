import {
  composeTodayHeadline,
  isHomeworkHeadline,
  isSupportWeather,
  nextInchFromHeldMove,
  typedStormMove,
  typedSupportMove,
} from '@/lib/atmosphere/today-oracle/headline';
import type { RankedTheme, TransitFact } from '@/lib/atmosphere/today-oracle/types';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';

function mercuryNeptune(): TransitFact {
  return {
    key: 'Mercury square Neptune',
    transiting: 'mercury',
    aspect: 'square',
    natal: 'neptune',
    display: 'Mercury square Neptune',
    orbDeg: 0.8,
    band: 'hard',
    score: 90,
    domains: ['career', 'self'],
    source: 'transit-lookup',
  };
}

function fogTheme(): RankedTheme {
  return {
    id: 'fog-clarity',
    label: 'Clarity is thin',
    polarity: 'friction',
    score: 90,
    facts: [mercuryNeptune()],
    domains: ['career', 'self'],
  };
}

function openingTheme(): RankedTheme {
  return {
    id: 'communication-opening',
    label: 'Communication opening',
    polarity: 'opening',
    score: 80,
    facts: [
      {
        key: 'Mercury trine Jupiter',
        transiting: 'mercury',
        aspect: 'trine',
        natal: 'jupiter',
        display: 'Mercury trine Jupiter',
        orbDeg: 0.9,
        band: 'soft',
        score: 88,
        domains: ['career'],
        source: 'transit-lookup',
      },
    ],
    domains: ['career'],
  };
}

describe('today headline compose', () => {
  it('storm INFP leads with thin clarity, not the 6pm sentence', () => {
    const { headline, polarity, avoid } = composeTodayHeadline({
      theme: fogTheme(),
      lead: mercuryNeptune(),
      domains: ['career', 'family', 'love'],
      risk: {
        domains: [
          { name: 'love', friction: 70, support: 12, hitCount: 2 },
          { name: 'career', friction: 68, support: 14, hitCount: 2 },
          { name: 'family', friction: 62, support: 8, hitCount: 1 },
        ],
      } as LifeRiskPacket,
      window: '10am–1pm',
      coreType: 'INFP',
      maskType: 'INTP',
    });
    expect(polarity).toBe('storm');
    expect(headline).toMatch(/^Through 10am–1pm: thin clarity on a wide plate\./);
    expect(headline).toMatch(/One honest sentence, then silence/);
    expect(headline).not.toMatch(/6pm|write the one-sentence/);
    expect(avoid.toLowerCase()).toMatch(/brief/);
  });

  it('INFJ storm move is not interchangeable with INFP on the same sky', () => {
    const base = {
      theme: fogTheme(),
      lead: mercuryNeptune(),
      domains: ['career'] as const,
      window: '10am–1pm',
      maskType: 'INTP',
    };
    const infp = composeTodayHeadline({ ...base, domains: ['career'], coreType: 'INFP' });
    const infj = composeTodayHeadline({ ...base, domains: ['career'], coreType: 'INFJ' });
    expect(infp.headline).not.toBe(infj.headline);
    expect(typedStormMove('INFP', 'INTP')).not.toBe(typedStormMove('INFJ', 'INTP'));
  });

  it('support day cannot fall back to the 6pm sentence', () => {
    const risk = {
      domains: [{ name: 'career', friction: 22, support: 74, hitCount: 1 }],
    } as LifeRiskPacket;
    expect(isSupportWeather(openingTheme(), openingTheme().facts[0], risk)).toBe(true);
    const { headline, polarity, avoid } = composeTodayHeadline({
      theme: openingTheme(),
      lead: openingTheme().facts[0],
      domains: ['career'],
      risk,
      coreType: 'INFP',
      maskType: 'INTP',
    });
    expect(polarity).toBe('support');
    expect(headline).toMatch(/^Window open on work\./);
    expect(headline.toLowerCase()).toMatch(/outside|yes|joy/);
    expect(isHomeworkHeadline(headline)).toBe(false);
    expect(typedSupportMove('INFP', 'INTP')).not.toMatch(/6pm/);
    expect(avoid.toLowerCase()).toMatch(/green hour/);
  });

  it('carryover labels the same sky and changes the next inch', () => {
    const day1 = composeTodayHeadline({
      theme: fogTheme(),
      lead: mercuryNeptune(),
      domains: ['career'],
      coreType: 'INFP',
      maskType: 'INTP',
      window: '10am–1pm',
    });
    const day2 = composeTodayHeadline({
      theme: fogTheme(),
      lead: mercuryNeptune(),
      domains: ['career'],
      coreType: 'INFP',
      maskType: 'INTP',
      held: true,
      heldMove: day1.headline,
      memoryFactKey: 'Mercury square Neptune',
      today: '2026-09-09',
      memoryDate: '2026-09-08',
    });
    expect(day2.polarity).toBe('carryover');
    expect(day2.headline).not.toBe(day1.headline);
    expect(day2.headline).toMatch(/Same thin clarity as yesterday/);
    expect(day2.headline).toMatch(/Don't add a second task/);
    expect(day2.headline).toMatch(/Send the sentence/);
    expect(nextInchFromHeldMove(day1.headline, 'INFP')).toBe('Send the sentence.');
  });

  it('does not rewrite today\'s own snapshot as carryover (prevents a setState loop)', () => {
    const first = composeTodayHeadline({
      theme: fogTheme(),
      lead: mercuryNeptune(),
      domains: ['career'],
      coreType: 'INFP',
      maskType: 'INTP',
      window: '10am–1pm',
      today: '2026-09-08',
    });
    const again = composeTodayHeadline({
      theme: fogTheme(),
      lead: mercuryNeptune(),
      domains: ['career'],
      coreType: 'INFP',
      maskType: 'INTP',
      window: '10am–1pm',
      today: '2026-09-08',
      memoryDate: '2026-09-08',
      held: true,
      heldMove: first.headline,
      memoryFactKey: 'Mercury square Neptune',
    });
    expect(again.polarity).toBe('storm');
    expect(again.headline).toBe(first.headline);
    expect(again.headline).not.toMatch(/as yesterday/);
  });
});
