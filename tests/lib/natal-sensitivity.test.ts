import {
  countNatalAspects,
  isChartRuler,
  natalImportance,
  traditionalRuler,
} from '@/lib/astrology/natal-sensitivity';
import type { PlanetPosition } from '@/types/astrology';

function planet(name: string, longitude: number, house?: number): PlanetPosition {
  return {
    name,
    longitude,
    latitude: 0,
    distance: 0,
    sign: 'Leo',
    degree: 0,
    minute: 0,
    house,
  };
}

describe('natal sensitivity', () => {
  it('treats the ASC ruler as chart ruler', () => {
    expect(traditionalRuler('Leo')).toBe('Sun');
    expect(isChartRuler('Sun', 'Leo')).toBe(true);
    expect(isChartRuler('Moon', 'Leo')).toBe(false);
  });

  it('scores an angular, well-aspected chart ruler higher than a cadent isolated point', () => {
    const aspects = [
      { type: 'Square', planet1: { name: 'Sun' }, planet2: { name: 'Saturn' } },
      { type: 'Trine', planet1: { name: 'Sun' }, planet2: { name: 'Moon' } },
      { type: 'Sextile', planet1: { name: 'Sun' }, planet2: { name: 'Mars' } },
    ];
    const loud = natalImportance('Sun', {
      planets: [planet('Sun', 120, 10)],
      aspects,
      ascendantSign: 'Leo',
    });
    const quiet = natalImportance('Uranus', {
      planets: [planet('Uranus', 200, 3)],
      aspects,
      ascendantSign: 'Leo',
    });
    expect(loud).toBeGreaterThan(quiet);
    expect(loud).toBeGreaterThan(70);
    expect(countNatalAspects('Sun', aspects)).toBe(3);
  });
});
