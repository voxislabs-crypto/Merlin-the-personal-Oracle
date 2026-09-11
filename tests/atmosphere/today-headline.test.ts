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
  it('storm INFP reasons first; the move is the last sentence, not the 6pm homework', () => {
    const slots = composeTodayHeadline({
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
      phase: 'peaking',
      daysToPeak: 0,
    });
    expect(slots.polarity).toBe('storm');
    expect(slots.what.toLowerCase()).toMatch(/clarity is thinner/);
    expect(slots.whyMe.toLowerCase()).toMatch(/work|home|relationship/);
    expect(slots.whyMe.toLowerCase()).toMatch(/feel|uncertainty|name/);
    expect(slots.whyMe.toLowerCase()).toMatch(/justif/);
    expect(slots.whyMe.toLowerCase()).not.toMatch(/\binfp\b|\bintp\b/);
    expect(slots.whyMe.toLowerCase()).not.toMatch(/inner vote|fog and story|random mood|outward habit|defensible/);
    expect(slots.ride.toLowerCase()).toMatch(/force|certainty/);
    expect(slots.ride.toLowerCase()).not.toMatch(/sentence/);
    expect(slots.ride.toLowerCase()).not.toMatch(/\d(am|pm)/);
    expect(`${slots.what} ${slots.whyMe} ${slots.ride}`.toLowerCase()).not.toMatch(
      /outward habit|random mood|caution budget|inner vote/,
    );
    expect(slots.move).toBe('One honest sentence, then silence.');
    expect(slots.move).not.toMatch(/6pm|write the one-sentence/);
    expect(slots.headline).toBe(slots.move);
    expect(slots.avoid.toLowerCase()).toMatch(/brief/);
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
    expect(infp.move).not.toBe(infj.move);
    expect(infp.whyMe).not.toBe(infj.whyMe);
    expect(typedStormMove('INFP', 'INTP')).not.toBe(typedStormMove('INFJ', 'INTP'));
  });

  it('support day cannot fall back to the 6pm sentence', () => {
    const risk = {
      domains: [{ name: 'career', friction: 22, support: 74, hitCount: 1 }],
    } as LifeRiskPacket;
    expect(isSupportWeather(openingTheme(), openingTheme().facts[0], risk)).toBe(true);
    const slots = composeTodayHeadline({
      theme: openingTheme(),
      lead: openingTheme().facts[0],
      domains: ['career'],
      risk,
      coreType: 'INFP',
      maskType: 'INTP',
    });
    expect(slots.polarity).toBe('support');
    expect(slots.what.toLowerCase()).toMatch(/opening/);
    expect(slots.what.toLowerCase()).toMatch(/work/);
    expect(slots.move.toLowerCase()).toMatch(/outside|yes|joy/);
    expect(isHomeworkHeadline(slots.move)).toBe(false);
    expect(slots.move).not.toMatch(/6pm|honest sentence, then silence/);
    expect(typedSupportMove('INFP', 'INTP')).not.toMatch(/6pm/);
    expect(slots.avoid.toLowerCase()).toMatch(/green hour|research/);
    expect(slots.ride.toLowerCase()).toMatch(/opening|plan|project/);
    expect(slots.whyMe.toLowerCase()).toMatch(/permission|justif/);
    expect(slots.what.toLowerCase()).not.toMatch(/problem|tightening/);
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
    expect(day2.what.toLowerCase()).toMatch(/same weather as yesterday|thin clarity/);
    expect(day2.ride).toMatch(/Don't add a second task/);
    expect(day2.move).toBe("No new assignment. Keep yesterday's inch.");
    expect(day2.move).not.toBe(day1.move);
    expect(nextInchFromHeldMove('By 6pm, write the one-sentence test', 'INFP')).toBe(
      'Send the sentence.',
    );
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
    expect(again.move).toBe(first.move);
    expect(again.what).toBe(first.what);
    expect(again.what).not.toMatch(/as yesterday/);
  });
});
