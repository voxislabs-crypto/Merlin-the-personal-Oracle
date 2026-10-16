import { DOMAIN_LABELS } from '@/lib/atmosphere/life-risk';
import {
  asksForNearTermWatch,
  buildFutureSight,
  formatFutureSightForOracle,
  futureSightFromRisk,
  todayFutureSightWatch,
  type FutureSightSignal,
} from '@/lib/atmosphere/future-sight';
import type { LifeRiskDomain, LifeRiskWindowKind } from '@/lib/atmosphere/types';

function signal(
  partial: Partial<FutureSightSignal> & Pick<FutureSightSignal, 'label' | 'domains'>,
): FutureSightSignal {
  return {
    kind: 'friction',
    pressure: 60,
    ...partial,
  };
}

const FATE_LANGUAGE = /\blikely\b|\bwill\b|%/;

describe('buildFutureSight', () => {
  it('returns the same object for the same signals, in any order', () => {
    const input = [
      signal({ label: 'Uranus square Venus', domains: ['love'], daysToPeak: 0, pressure: 72 }),
      signal({ label: 'Mars square Moon', domains: ['love'], daysToPeak: 0, pressure: 61 }),
      signal({ label: 'Saturn square Mercury', domains: ['career'], daysToPeak: 2, pressure: 58 }),
    ];
    const first = buildFutureSight(input);
    const second = buildFutureSight([...input].reverse());
    expect(second).toEqual(first);
    expect(buildFutureSight(input)).toEqual(first);
  });

  it('breaks an equal-pressure domain tie toward Bonds before Work', () => {
    const forward = buildFutureSight([
      signal({ label: 'Saturn square Mercury', domains: ['career'], daysToPeak: 0, pressure: 70 }),
      signal({ label: 'Mars square Moon', domains: ['love'], daysToPeak: 0, pressure: 70 }),
    ]);
    const reversed = buildFutureSight([
      signal({ label: 'Mars square Moon', domains: ['love'], daysToPeak: 0, pressure: 70 }),
      signal({ label: 'Saturn square Mercury', domains: ['career'], daysToPeak: 0, pressure: 70 }),
    ]);
    expect(reversed).toEqual(forward);
    expect(forward[0].domain).toBe('Bonds');
    expect(forward[0].evidence).toEqual(['Mars square Moon']);
  });

  it('keeps day 7 in this week and drops day 8', () => {
    const items = buildFutureSight([
      signal({ label: 'Saturn square Sun', domains: ['career'], daysToPeak: 7, pressure: 60 }),
      signal({ label: 'Pluto square Moon', domains: ['self'], daysToPeak: 8, pressure: 90 }),
    ]);
    expect(items.map((item) => item.horizon)).toEqual(['this-week']);
    expect(items[0].evidence).toEqual(['Saturn square Sun']);
  });

  it('places peaks on today, the next few days, and this week, and drops later ones', () => {
    const items = buildFutureSight([
      signal({ label: 'Mars square Moon', domains: ['love'], daysToPeak: 0, pressure: 70 }),
      signal({ label: 'Saturn square Mercury', domains: ['career'], daysToPeak: 2, pressure: 64 }),
      signal({ label: 'Jupiter trine Sun', domains: ['career'], kind: 'support', daysToPeak: 5, pressure: 50 }),
      signal({ label: 'Pluto square Venus', domains: ['love'], daysToPeak: 10, pressure: 90 }),
    ]);

    expect(items.map((item) => item.horizon)).toEqual(['today', 'next-3-days', 'this-week']);
    expect(items.map((item) => item.evidence)).toEqual([
      ['Mars square Moon'],
      ['Saturn square Mercury'],
      ['Jupiter trine Sun'],
    ]);
    expect(JSON.stringify(items)).not.toMatch(/Pluto square Venus/);
  });

  it('uses phase when days to peak are missing', () => {
    const items = buildFutureSight([
      signal({ label: 'Venus square Mars', domains: ['love'], phase: 'building', pressure: 44 }),
      signal({ label: 'Moon square Saturn', domains: ['self'], phase: 'peaking', pressure: 44 }),
    ]);
    expect(items.find((item) => item.evidence.includes('Venus square Mars'))?.horizon).toBe(
      'next-3-days',
    );
    expect(items.find((item) => item.evidence.includes('Moon square Saturn'))?.horizon).toBe('today');
  });

  it('keeps evidence as the transit labels and uses life-risk domain names', () => {
    const items = buildFutureSight([
      signal({ label: 'Uranus square Venus', domains: ['love'], daysToPeak: 1, pressure: 70 }),
      signal({ label: 'Mars square Moon', domains: ['love'], daysToPeak: 1, pressure: 66 }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].domain).toBe(DOMAIN_LABELS.love);
    expect(items[0].domain).toBe('Bonds');
    expect(items[0].evidence).toEqual(['Uranus square Venus', 'Mars square Moon']);
    expect(JSON.stringify(items[0])).not.toMatch(/INFP|Core|Mask|personality/);
    expect(items[0]).not.toHaveProperty('pressure');
    expect(items[0].uncertainty).toBe('low');
  });

  it('marks a thin or split cluster as high uncertainty and a mixed theme', () => {
    const split = buildFutureSight([
      signal({ label: 'Mars square Moon', domains: ['love'], daysToPeak: 0, pressure: 60 }),
      signal({
        label: 'Jupiter trine Venus',
        domains: ['love'],
        kind: 'support',
        daysToPeak: 0,
        pressure: 52,
      }),
    ]);
    expect(split[0].uncertainty).toBe('high');
    expect(split[0].theme).toBe('Warmth and friction in the same bond');

    const thin = buildFutureSight([
      signal({ label: 'Mars square Moon', domains: ['love'], daysToPeak: 0, pressure: 80 }),
    ]);
    expect(thin[0].uncertainty).toBe('high');
  });

  it('keeps a clear cluster this week at medium uncertainty', () => {
    const items = buildFutureSight([
      signal({ label: 'Saturn square Sun', domains: ['career'], daysToPeak: 5, pressure: 70 }),
      signal({ label: 'Saturn square Mercury', domains: ['career'], daysToPeak: 6, pressure: 61 }),
    ]);
    expect(items[0].horizon).toBe('this-week');
    expect(items[0].uncertainty).toBe('medium');
    expect(['low', 'medium', 'high']).toContain(items[0].uncertainty);
  });

  it('ranks a support window by ease and does not emit a probability', () => {
    const items = futureSightFromRisk({
      frictionWindows: [
        {
          id: 'f',
          kind: 'friction',
          label: 'Saturn square Moon',
          domains: ['love'],
          daysToPeak: 0,
          friction: 40,
          confidence: 50,
          source: 'transit',
        },
      ],
      supportWindows: [
        {
          id: 's',
          kind: 'support',
          label: 'Jupiter trine Venus',
          domains: ['love'],
          daysToPeak: 0,
          friction: 10,
          ease: 80,
          confidence: 50,
          source: 'transit',
        },
      ],
      topDrivers: [],
    });
    expect(items[0].theme).toBe('An easier opening between people');
    expect(items[0].evidence[0]).toBe('Jupiter trine Venus');
    expect(items[0].uncertainty).toBe('low');
    expect(JSON.stringify(items)).not.toMatch(/probability/);
  });

  it('includes a mixed driver that the window lists leave out', () => {
    const items = futureSightFromRisk({
      frictionWindows: [],
      supportWindows: [],
      topDrivers: [
        {
          label: 'Venus square Mars',
          friction: 48,
          kind: 'mixed',
          phase: 'building',
          domains: ['love'],
          source: 'transit',
        },
      ],
    });
    expect(items).toEqual([
      expect.objectContaining({
        horizon: 'next-3-days',
        domain: 'Bonds',
        evidence: ['Venus square Mars'],
        uncertainty: 'high',
      }),
    ]);
  });

  it('returns nothing when there is no near-term signal', () => {
    expect(buildFutureSight([])).toEqual([]);
    expect(futureSightFromRisk(null)).toEqual([]);
    expect(futureSightFromRisk({ frictionWindows: [], supportWindows: [] })).toEqual([]);
    expect(todayFutureSightWatch([])).toBeUndefined();
  });

  it('stores only the today observable for a later accuracy check', () => {
    const items = buildFutureSight([
      signal({ label: 'Mars square Moon', domains: ['love'], daysToPeak: 0, pressure: 40 }),
      signal({ label: 'Saturn square Mercury', domains: ['career'], daysToPeak: 4, pressure: 70 }),
    ]);
    expect(todayFutureSightWatch(items)).toBe('Notice if a talk gets sharper than the topic.');
    const laterOnly = buildFutureSight([
      signal({ label: 'Saturn square Mercury', domains: ['career'], daysToPeak: 4, pressure: 70 }),
    ]);
    expect(todayFutureSightWatch(laterOnly)).toBeUndefined();
  });

  it('keeps theme, watch, prepare, and alternative free of fate language', () => {
    const domains: LifeRiskDomain[] = ['love', 'career', 'money', 'family', 'health', 'self'];
    const kinds: LifeRiskWindowKind[] = ['friction', 'support', 'mixed'];
    for (const domain of domains) {
      for (const kind of kinds) {
        const items = buildFutureSight([
          signal({
            label: `${domain} ${kind}`,
            domains: [domain],
            kind,
            daysToPeak: 0,
            pressure: 50,
          }),
        ]);
        const item = items[0];
        const spoken = [item.theme, item.watchFor, item.prepare, item.alternative].join(' ');
        expect(spoken).not.toMatch(FATE_LANGUAGE);
        expect(item.evidence).toEqual([`${domain} ${kind}`]);
      }
    }
  });
});

describe('future sight oracle wording', () => {
  const items = buildFutureSight([
    signal({ label: 'Uranus square Venus', domains: ['love'], daysToPeak: 2, pressure: 70 }),
    signal({ label: 'Mars square Moon', domains: ['love'], daysToPeak: 2, pressure: 62 }),
  ]);

  it('stays quiet until someone asks, then explains the loaded object', () => {
    expect(formatFutureSightForOracle([], false)).toBe('');
    expect(formatFutureSightForOracle([], true)).toMatch(/read is empty/);
    expect(formatFutureSightForOracle(items, false)).toMatch(/leave this block unsaid/);
    const asked = formatFutureSightForOracle(items, true);
    expect(asked).toMatch(/asked about the near term/);
    expect(asked).toContain('evidence: Uranus square Venus; Mars square Moon');
    expect(asked).toContain('uncertainty: low');
    expect(asked).not.toMatch(/%/);
    expect(asked).not.toMatch(/\blikely\b|\bwill\b/);
  });

  it('recognizes a near-term ask and leaves an ordinary question alone', () => {
    expect(asksForNearTermWatch('What should I watch over the next few days?')).toBe(true);
    expect(asksForNearTermWatch('Anything coming up this week?')).toBe(true);
    expect(asksForNearTermWatch('How heavy is today?')).toBe(false);
    expect(asksForNearTermWatch('Show me the prophecy')).toBe(false);
  });
});
