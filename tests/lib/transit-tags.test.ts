import { buildTransitTags } from '@/lib/astrology/transits';

describe('buildTransitTags', () => {
  it('tags Saturn hits with structure / discipline / lesson', () => {
    const tags = buildTransitTags({
      transitingPlanet: 'Saturn',
      natalPlanet: 'Moon',
      aspect: 'Square',
      orb: 1.2,
    });
    expect(tags).toEqual(expect.arrayContaining(['structure', 'discipline', 'lesson']));
  });

  it('tags Moon conjunct Sun as a new-moon lunar cycle', () => {
    const tags = buildTransitTags({
      transitingPlanet: 'Moon',
      natalPlanet: 'Sun',
      aspect: 'Conjunction',
      orb: 0.4,
    });
    expect(tags).toEqual(
      expect.arrayContaining(['lunar cycle', 'new beginnings', 'planting seeds', 'exact', 'tight moon']),
    );
  });

  it('does not invent lunar-cycle tags for unrelated pairs', () => {
    const tags = buildTransitTags({
      transitingPlanet: 'Mars',
      natalPlanet: 'Jupiter',
      aspect: 'Trine',
      orb: 3,
    });
    expect(tags).not.toContain('lunar cycle');
    expect(tags.length).toBeGreaterThan(0);
  });
});
