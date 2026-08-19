import {
  collectHorizonHits,
  groupHorizonHits,
  scoreMentionCandidate,
  scoreValence,
  selectMentionWorthy,
  type TransitHitInput,
} from '@/lib/astrology/mention-worthy';

const TODAY = '2026-08-19';

function hit(
  transitingPlanet: string,
  aspect: string,
  natalPlanet: string,
  orb: number,
  date = TODAY,
): TransitHitInput {
  return { transitingPlanet, natalPlanet, aspect, orb, date };
}

describe('mention-worthy transits', () => {
  it('ranks Saturn square natal Sun far above a Moon trine', () => {
    const set = selectMentionWorthy(
      [
        hit('Moon', 'Trine', 'Neptune', 0.4),
        hit('Saturn', 'Square', 'Sun', 1.4),
        hit('Venus', 'Sextile', 'Jupiter', 0.8),
      ],
      TODAY,
    );

    expect(set.headline?.label).toBe('Saturn Square natal Sun');
    expect(set.mentioned.some((item) => item.transitingPlanet === 'Moon')).toBe(false);
    expect(set.mentioned.some((item) => item.transitingPlanet === 'Venus')).toBe(false);
  });

  it('allows an exact Moon-to-Sun hit today, but not a wide Moon square', () => {
    const exact = selectMentionWorthy([hit('Moon', 'Conjunction', 'Sun', 0.3)], TODAY);
    const wide = selectMentionWorthy([hit('Moon', 'Square', 'Sun', 2.1)], TODAY);

    expect(exact.headline?.transitingPlanet).toBe('Moon');
    expect(wide.headline).toBeNull();
    expect(wide.mentioned).toHaveLength(0);
  });

  it('does not mention upcoming Moon hits — they will have moved', () => {
    const set = selectMentionWorthy(
      [hit('Moon', 'Conjunction', 'Sun', 0.2, '2026-08-22')],
      TODAY,
    );
    expect(set.mentioned).toHaveLength(0);
  });

  it('surfaces a slow planet peaking later this week as upcoming', () => {
    const samples: TransitHitInput[] = [
      hit('Mercury', 'Sextile', 'Uranus', 0.6, TODAY),
      hit('Pluto', 'Square', 'Moon', 2.1, TODAY),
      hit('Pluto', 'Square', 'Moon', 0.7, '2026-08-22'),
    ];
    const set = selectMentionWorthy(samples, TODAY);

    expect(set.headline?.label).toBe('Pluto Square natal Moon');
    expect(set.headline?.daysToPeak).toBe(3);
    expect(set.upcoming.some((item) => item.eventId.includes('Pluto')) || set.headline?.daysToPeak === 3).toBe(
      true,
    );
  });

  it('drops soft outer-to-outer background contacts', () => {
    const scored = scoreMentionCandidate(
      groupHorizonHits([hit('Neptune', 'Trine', 'Pluto', 0.5)], TODAY)[0],
    );
    expect(scored.mentionable).toBe(false);
    expect(scored.suppressReason).toMatch(/outer-to-outer/i);
  });

  it('prefers a hard Mars-on-Sun over a tight Jupiter trine to natal Pluto', () => {
    const set = selectMentionWorthy(
      [hit('Mars', 'Opposition', 'Sun', 1.1), hit('Jupiter', 'Trine', 'Pluto', 0.4)],
      TODAY,
    );
    expect(set.headline?.label).toBe('Mars Opposition natal Sun');
  });

  it('caps mentions and spreads natal targets', () => {
    const samples: TransitHitInput[] = [
      hit('Saturn', 'Square', 'Sun', 0.8),
      hit('Pluto', 'Opposition', 'Sun', 1.1),
      hit('Uranus', 'Square', 'Sun', 1.2),
      hit('Mars', 'Square', 'Moon', 0.9),
      hit('Jupiter', 'Conjunction', 'Venus', 1.0),
    ];
    const set = selectMentionWorthy(samples, TODAY);
    const sunHits = set.mentioned.filter((item) => item.natalPlanet === 'Sun');
    expect(set.mentioned.length).toBeLessThanOrEqual(5);
    expect(sunHits.length).toBeLessThanOrEqual(3);
  });

  it('puts an upcoming-only headline in the upcoming lane too', () => {
    const set = selectMentionWorthy(
      [hit('Saturn', 'Square', 'Sun', 1.1, '2026-08-23')],
      TODAY,
    );
    expect(set.headline?.label).toBe('Saturn Square natal Sun');
    expect(set.now).toHaveLength(0);
    expect(set.upcoming[0]?.label).toBe('Saturn Square natal Sun');
  });

  it('separates impact from valence', () => {
    const saturn = scoreMentionCandidate(
      groupHorizonHits([hit('Saturn', 'Square', 'Sun', 1.0)], TODAY)[0],
    );
    const jupiter = scoreMentionCandidate(
      groupHorizonHits([hit('Jupiter', 'Conjunction', 'Sun', 0.8)], TODAY)[0],
    );
    const plutoAsc = scoreMentionCandidate(
      groupHorizonHits([hit('Pluto', 'Conjunction', 'Ascendant', 0.6)], TODAY)[0],
    );

    expect(saturn.impact).toBeGreaterThan(50);
    expect(saturn.valence).toBeLessThan(-20);
    expect(jupiter.impact).toBeGreaterThanOrEqual(40);
    expect(jupiter.valence).toBeGreaterThan(20);
    expect(plutoAsc.impact).toBeGreaterThan(saturn.impact);
    expect(Math.abs(plutoAsc.valence)).toBeLessThan(15);
    expect(scoreValence('Pluto', 'Conjunction')).toBe(0);
  });

  it('ranks an outer planet on an angle above a personal Venus hit', () => {
    const set = selectMentionWorthy(
      [hit('Venus', 'Square', 'Moon', 0.5), hit('Uranus', 'Conjunction', 'Ascendant', 1.1)],
      TODAY,
    );
    expect(set.headline?.label).toBe('Uranus Conjunction natal Ascendant');
  });

  it('clusters multiple hits on the same natal point as one theme', () => {
    const set = selectMentionWorthy(
      [hit('Saturn', 'Square', 'Sun', 0.9), hit('Pluto', 'Opposition', 'Sun', 1.2)],
      TODAY,
    );
    expect(set.clusters[0]?.target).toBe('Sun');
    expect(set.clusters[0]?.theme).toMatch(/identity/i);
    expect(set.clusters[0]?.members.length).toBe(2);
    expect(set.headlineCluster?.target).toBe('Sun');
    expect(set.domains.identity).toBeGreaterThan(0);
  });

  it('gives long transits more impact than short ones at the same orb', () => {
    const pluto = scoreMentionCandidate(
      groupHorizonHits([hit('Pluto', 'Square', 'Moon', 1.0)], TODAY)[0],
    );
    const mars = scoreMentionCandidate(
      groupHorizonHits([hit('Mars', 'Square', 'Moon', 1.0)], TODAY)[0],
    );
    expect(pluto.durationDays).toBeGreaterThan(mars.durationDays);
    expect(pluto.impact).toBeGreaterThan(mars.impact);
  });

  it('marks a retrograde slow planet as the review pass', () => {
    const set = selectMentionWorthy(
      [{ ...hit('Saturn', 'Square', 'Sun', 0.8), retrograde: true }],
      TODAY,
    );
    expect(set.headline?.pass.kind).toBe('retrograde');
    expect(set.headline?.pass.meaning).toMatch(/review/i);
  });

  it('collects a horizon from a daily lookup', () => {
    const hits = collectHorizonHits(
      (date) =>
        date === TODAY
          ? [{ transitingPlanet: 'Saturn', natalPlanet: 'Sun', aspect: 'Square', orb: 2.4 }]
          : date === '2026-08-21'
            ? [{ transitingPlanet: 'Saturn', natalPlanet: 'Sun', aspect: 'Square', orb: 1.1 }]
            : [],
      TODAY,
      3,
    );
    expect(hits).toHaveLength(2);
    const set = selectMentionWorthy(hits, TODAY);
    expect(set.headline?.label).toBe('Saturn Square natal Sun');
    expect(set.headline?.daysToPeak).toBe(2);
  });
});
