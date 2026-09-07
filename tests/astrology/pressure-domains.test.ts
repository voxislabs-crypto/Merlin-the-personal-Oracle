import {
  buildDomainScores,
  domainToneFromScores,
} from '@/lib/astrology/pressure-engine/domains';
import {
  domainSurfaceLine,
  explainDriverInDomain,
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
