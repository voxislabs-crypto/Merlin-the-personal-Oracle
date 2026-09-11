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
    expect(slots.move.toLowerCase()).toMatch(/useful sentence|say the useful|send the update/);
    expect(isHomeworkHeadline(slots.move)).toBe(false);
    expect(slots.move).not.toMatch(/6pm|honest sentence, then silence/);
    expect(typedSupportMove('INFP', 'INTP')).not.toMatch(/6pm/);
    expect(slots.avoid.toLowerCase()).toMatch(/useful sentence|green hour|research/);
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

function fact(overrides: Partial<TransitFact>): TransitFact {
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
    ...overrides,
  };
}

function theme(
  id: RankedTheme['id'],
  polarity: RankedTheme['polarity'],
  lead: TransitFact,
  extras: Partial<RankedTheme> = {},
): RankedTheme {
  return {
    id,
    label: id,
    polarity,
    score: lead.score,
    facts: [lead],
    domains: lead.domains,
    ...extras,
  };
}

describe('theme authority and scaled composition', () => {
  it('does not retitle emotional-restraint as a work opening when work support is louder', () => {
    const lead = fact({
      key: 'Moon square Saturn',
      transiting: 'moon',
      natal: 'saturn',
      display: 'Moon square Saturn',
      aspect: 'square',
      score: 95,
      orbDeg: 0.4,
      domains: ['family', 'self'],
    });
    const restraint = theme('emotional-restraint', 'friction', lead);
    const risk = {
      domains: [
        { name: 'family', friction: 70, support: 12, hitCount: 1 },
        { name: 'career', friction: 22, support: 74, hitCount: 1 },
      ],
    } as LifeRiskPacket;
    expect(isSupportWeather(restraint, lead, risk)).toBe(false);
    const slots = composeTodayHeadline({
      theme: restraint,
      lead,
      domains: ['family'],
      risk,
      coreType: 'INFP',
      maskType: 'INTP',
      phase: 'peaking',
    });
    expect(slots.polarity).toBe('storm');
    expect(slots.what.toLowerCase()).toMatch(/mood is running heavier/);
    expect(slots.what.toLowerCase()).not.toMatch(/opening/);
    expect(slots.whyMe.toLowerCase()).toMatch(/home/);
    expect(slots.whyMe.toLowerCase()).not.toMatch(/permission/);
    expect(slots.move.toLowerCase()).toMatch(/weight|duty/);
    expect(slots.move.toLowerCase()).not.toMatch(/honest sentence|go outside|useful sentence/);
  });

  it('does not convert soft fog into support', () => {
    const lead = fact({
      key: 'Mercury trine Neptune',
      transiting: 'mercury',
      natal: 'neptune',
      display: 'Mercury trine Neptune',
      aspect: 'trine',
      band: 'soft',
      score: 86,
      orbDeg: 0.7,
      domains: ['career', 'self'],
    });
    const fog = theme('fog-clarity', 'friction', lead);
    expect(isSupportWeather(fog, lead)).toBe(false);
    const slots = composeTodayHeadline({
      theme: fog,
      lead,
      domains: ['career'],
      risk: { domains: [{ name: 'career', friction: 24, support: 60, hitCount: 1 }] } as LifeRiskPacket,
      coreType: 'INFP',
      maskType: 'INTP',
    });
    expect(slots.polarity).toBe('storm');
    expect(slots.what.toLowerCase()).toMatch(/clarity is thinner/);
    expect(slots.what.toLowerCase()).not.toMatch(/opening/);
    expect(slots.move).toBe('One honest sentence, then silence.');
  });

  it('action-block move follows blocked drive, not the INFP fog kit', () => {
    const lead = fact({
      key: 'Mars square Saturn',
      transiting: 'mars',
      natal: 'saturn',
      display: 'Mars square Saturn',
      aspect: 'square',
      score: 90,
      orbDeg: 0.5,
      domains: ['career', 'self'],
    });
    const infp = composeTodayHeadline({
      theme: theme('action-block', 'friction', lead),
      lead,
      domains: ['career'],
      risk: { domains: [{ name: 'career', friction: 82, support: 10, hitCount: 1 }] } as LifeRiskPacket,
      coreType: 'INFP',
      maskType: 'INTP',
      phase: 'peaking',
    });
    const infj = composeTodayHeadline({
      theme: theme('action-block', 'friction', lead),
      lead,
      domains: ['career'],
      risk: { domains: [{ name: 'career', friction: 82, support: 10, hitCount: 1 }] } as LifeRiskPacket,
      coreType: 'INFJ',
      maskType: 'INTP',
      phase: 'peaking',
    });
    expect(infp.what.toLowerCase()).toMatch(/drive is meeting a wall/);
    expect(infp.whyMe.toLowerCase()).toMatch(/resistance/);
    expect(infp.ride.toLowerCase()).toMatch(/brick|breakthrough/);
    expect(infp.move.toLowerCase()).toMatch(/brick/);
    expect(infp.move.toLowerCase()).not.toMatch(/honest sentence/);
    expect(infj.move).not.toBe(infp.move);
    expect(infj.move.toLowerCase()).toMatch(/bounded push|brick/);
  });

  it('mild releasing weather can conclude nothing new needs to happen', () => {
    const lead = fact({
      key: 'Moon square Saturn',
      transiting: 'moon',
      natal: 'saturn',
      display: 'Moon square Saturn',
      aspect: 'square',
      score: 44,
      orbDeg: 3.8,
      domains: ['family', 'self'],
    });
    const slots = composeTodayHeadline({
      theme: theme('emotional-restraint', 'friction', lead),
      lead,
      domains: ['family'],
      risk: { domains: [{ name: 'family', friction: 42, support: 22, hitCount: 1 }] } as LifeRiskPacket,
      coreType: 'INFP',
      maskType: 'INTP',
      phase: 'releasing',
    });
    expect(slots.what.toLowerCase()).toMatch(/already passed/);
    expect(slots.ride.toLowerCase()).toMatch(/leftover|second task/);
    expect(slots.move).toBe('Nothing new needs to happen.');
  });

  it('carryover strips an article so the sky reads as a noun', () => {
    const lead = fact({
      key: 'Uranus square Venus',
      transiting: 'uranus',
      natal: 'venus',
      display: 'Uranus square Venus',
      aspect: 'square',
      score: 96,
      orbDeg: 0.3,
      domains: ['love', 'self'],
    });
    const day1 = composeTodayHeadline({
      theme: theme('sudden-shift', 'mixed', lead),
      lead,
      domains: ['love'],
      coreType: 'INFP',
      maskType: 'INTP',
    });
    const day2 = composeTodayHeadline({
      theme: theme('sudden-shift', 'mixed', lead),
      lead,
      domains: ['love'],
      coreType: 'INFP',
      maskType: 'INTP',
      held: true,
      heldMove: day1.headline,
      memoryFactKey: 'Uranus square Venus',
      today: '2026-09-10',
      memoryDate: '2026-09-09',
    });
    expect(day2.polarity).toBe('carryover');
    expect(day2.what.toLowerCase()).toMatch(/same jolt in the bond as yesterday/);
    expect(day2.what.toLowerCase()).not.toMatch(/same a jolt/);
    expect(day2.move).toBe("No new assignment. Keep yesterday's inch.");
  });

  it('hard expansion stays a too-big yes, not a green opening', () => {
    const lead = fact({
      key: 'Jupiter square Moon',
      transiting: 'jupiter',
      natal: 'moon',
      display: 'Jupiter square Moon',
      aspect: 'square',
      score: 80,
      orbDeg: 1.2,
      domains: ['family', 'career'],
    });
    const expansion = theme('expansion-opening', 'opening', lead);
    expect(isSupportWeather(expansion, lead)).toBe(false);
    const slots = composeTodayHeadline({
      theme: expansion,
      lead,
      domains: ['family'],
      risk: { domains: [{ name: 'family', friction: 64, support: 18, hitCount: 1 }] } as LifeRiskPacket,
      coreType: 'INFP',
      maskType: 'INTP',
    });
    expect(slots.polarity).toBe('storm');
    expect(slots.what.toLowerCase()).toMatch(/too-big yes/);
    expect(slots.move.toLowerCase()).toMatch(/upside|overcommit/);
    expect(slots.move.toLowerCase()).not.toMatch(/honest sentence/);
  });

  it('building communication-friction is smaller than a peak storm', () => {
    const lead = fact({
      key: 'Mercury square Mars',
      transiting: 'mercury',
      natal: 'mars',
      display: 'Mercury square Mars',
      aspect: 'square',
      score: 52,
      orbDeg: 3.2,
      domains: ['career', 'self'],
    });
    const slots = composeTodayHeadline({
      theme: theme('communication-friction', 'friction', lead),
      lead,
      domains: ['career'],
      risk: { domains: [{ name: 'career', friction: 50, support: 20, hitCount: 1 }] } as LifeRiskPacket,
      coreType: 'INFP',
      maskType: 'INTP',
      phase: 'building',
      daysToPeak: 2,
    });
    expect(slots.what.toLowerCase()).toMatch(/words are landing harder/);
    expect(slots.move.toLowerCase()).not.toMatch(/honest sentence/);
    expect(slots.move.toLowerCase()).toMatch(/watch|shorten|small|don't start/);
  });
});

