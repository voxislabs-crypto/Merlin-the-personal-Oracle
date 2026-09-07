import {
  buildDomainScores,
  domainToneFromScores,
} from '@/lib/astrology/pressure-engine/domains';
import {
  domainSurfaceLine,
  explainDriverInDomain,
  explainHitsInDomain,
  hasAstroJargon,
  rewriteLayReason,
} from '@/lib/astrology/pressure-engine/lay-reason';
import type { TransitDriver } from '@/types/astrology';

function driver(partial: Partial<TransitDriver> & Pick<TransitDriver, 'transitId' | 'label' | 'strength'>): TransitDriver {
  return {
    confidence: 70,
    reason: partial.reason || partial.label,
    ...partial,
  };
}

describe('pressure-engine domain scores', () => {
  it('does not copy one global pressure onto every domain', () => {
    const drivers: TransitDriver[] = [
      driver({
        transitId: 'hard-venus',
        label: 'Neptune square Venus',
        strength: 78,
        aspect: 'Square',
        transitingPlanet: 'Neptune',
        natalPlanet: 'Venus',
        valence: -0.4,
        reason: 'Neptune square Venus blurs closest ties and money calls.',
      }),
      driver({
        transitId: 'soft-sun',
        label: 'Jupiter trine Sun',
        strength: 72,
        aspect: 'Trine',
        transitingPlanet: 'Jupiter',
        natalPlanet: 'Sun',
        valence: 0.35,
        reason: 'Jupiter trine Sun opens a supportive work current.',
      }),
    ];

    const scores = buildDomainScores(88, 70, drivers);
    const byName = Object.fromEntries(scores.map((row) => [row.domain, row]));

    expect(new Set(scores.map((row) => row.pressure)).size).toBeGreaterThan(1);
    expect(scores.every((row) => row.pressure === 88)).toBe(false);

    expect(byName.finances.pressure).toBeGreaterThan(byName.finances.opportunity);
    expect(byName.finances.tone).toBe('pressure');
    expect(byName.finances.topDrivers.every((hit) => hit.domains?.includes('finances'))).toBe(true);

    expect(byName.career.tone).toBe('opportunity');
    expect(byName.career.opportunity).toBeGreaterThan(20);

    const quiet = scores.filter((row) => row.topDrivers.length === 0);
    expect(quiet.length).toBeGreaterThan(0);
    expect(quiet.some((row) => row.tone === 'neutral' || row.tone === 'opportunity')).toBe(true);
    expect(scores.some((row) => row.tone === 'opportunity' || row.tone === 'neutral')).toBe(true);
  });

  it('keeps finances drill-down on financial transits only', () => {
    const scores = buildDomainScores(70, 60, [
      driver({
        transitId: 'money',
        label: 'Saturn square Venus',
        strength: 80,
        natalPlanet: 'Venus',
        transitingPlanet: 'Saturn',
        aspect: 'Square',
        valence: -0.4,
      }),
      driver({
        transitId: 'work',
        label: 'Mars square Midheaven',
        strength: 74,
        natalPlanet: 'Midheaven',
        transitingPlanet: 'Mars',
        aspect: 'Square',
        valence: -0.4,
      }),
    ]);
    const finances = scores.find((row) => row.domain === 'finances');
    expect(finances?.topDrivers.map((hit) => hit.transitId)).toEqual(['money']);
    expect(
      finances?.topDrivers.map((hit) => explainDriverInDomain(hit, 'finances')).join(' '),
    ).toMatch(/tightening money|security|connect/i);
  });
});

describe('unique domain explanations', () => {
  it('gives each transit its own verb and time window — no template with a swapped day count', () => {
    const lines = explainHitsInDomain(
      [
        {
          label: 'Uranus Square Venus',
          reason: 'Reactive choices can create avoidable fallout in the next 3 days.',
          kind: 'friction',
          daysToPeak: 3,
        },
        {
          label: 'Venus Square Mars',
          reason: 'Reactive choices can create avoidable fallout in the next 1 days.',
          kind: 'friction',
          daysToPeak: 1,
        },
        {
          label: 'Venus Sextile Neptune',
          reason: 'Momentum is available—small disciplined actions compound quickly now.',
          kind: 'support',
          daysToPeak: 2,
        },
        {
          label: 'Venus Conjunction Saturn',
          reason: "This week's vibe: prepare now so the peak doesn't catch you ungrounded.",
          kind: 'mixed',
          daysToPeak: 5,
        },
        {
          label: 'Venus Conjunction Pluto',
          reason: 'Reactive choices can create avoidable fallout in the next 10 days.',
          kind: 'friction',
          daysToPeak: 10,
        },
        {
          label: 'Venus Square Ascendant',
          reason: 'Reactive choices can create avoidable fallout in the next 4 days.',
          kind: 'friction',
          daysToPeak: 4,
        },
      ],
      'love',
    );

    expect(lines.length).toBeLessThanOrEqual(4);
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines.join(' ')).not.toMatch(/next \d+ days/i);
    expect(lines.join(' ')).not.toMatch(/reactive choices can create avoidable fallout/i);
    expect(lines.join(' ')).not.toMatch(/how you connect and what you value/i);
    expect(lines.join(' ')).not.toMatch(/foggy, hard-to-pin-down feeling/i);
    expect(new Set(lines).size).toBe(lines.length);

    const verbs = lines.map((line) => line.match(/^This is (\w+)/)?.[1] || '');
    expect(new Set(verbs).size).toBe(lines.length);

    const windows = lines.map(
      (line) =>
        line.match(
          /(right now|today|over the next couple of days|this week|through this stretch|before the week turns)/,
        )?.[1] || '',
    );
    expect(new Set(windows).size).toBe(lines.length);

    for (const line of lines) {
      const verb = line.match(/^This is (\w+)/)?.[1] || '';
      const body = line.split('—')[1] || '';
      if (/opening|loosening|easing/.test(verb)) {
        expect(body).not.toMatch(/tightening|pressuring|straining|heavier/i);
      }
      if (/tightening|pressuring|straining/.test(verb)) {
        expect(body).not.toMatch(/\bopening\b|\bloosening\b|\beasing\b/i);
      }
    }
  });

  it('does not say conversations and plans is', () => {
    const [line] = explainHitsInDomain(
      [{ label: 'Mercury Square Venus', kind: 'friction', daysToPeak: 0 }],
      'love',
    );
    expect(line).not.toMatch(/conversations and plans is/i);
  });
});

describe('lay reason', () => {
  it('reads like a friend, not an ephemeris', () => {
    const out = rewriteLayReason('Saturn is pressing your mood');
    expect(hasAstroJargon(out)).toBe(false);
    expect(out.toLowerCase()).toMatch(/heavy|slow|mood|pressure/);
    expect(domainToneFromScores(20, 55)).toBe('opportunity');
    expect(domainToneFromScores(70, 10)).toBe('pressure');
    expect(domainToneFromScores(30, 28)).toBe('neutral');
    expect(domainSurfaceLine('finances', 'pressure')).toBe('Finances are tight');
    expect(domainSurfaceLine('finances', 'opportunity')).toBe('Finances are opening up');
    expect(domainSurfaceLine('career', 'neutral')).toBe('Career is mixed');
  });
});
