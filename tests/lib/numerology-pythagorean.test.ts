/** @jest-environment node */

import {
  buildNumerologyBlueprint,
  calculateDestiny,
  calculateLifePath,
  calculatePersonalYear,
  calculatePersonality,
  calculateSoulUrge,
  reduceNumber,
} from '@/lib/numerology';

describe('pythagorean numerology', () => {
  it('reduces numbers and preserves master numbers', () => {
    expect(reduceNumber(29)).toBe(11);
    expect(reduceNumber(11)).toBe(11);
    expect(reduceNumber(38)).toBe(11);
  });

  it('calculates life path from birth date', () => {
    expect(calculateLifePath('1990-07-14')).toBe(4);
  });

  it('calculates name-based numbers', () => {
    expect(calculateDestiny('Alexander Ray')).toBeTruthy();
    expect(calculateSoulUrge('Alexander Ray')).toBeTruthy();
    expect(calculatePersonality('Alexander Ray')).toBeTruthy();
  });

  it('builds a full blueprint', () => {
    const blueprint = buildNumerologyBlueprint('1990-07-14', 'Alexander Ray', new Date('2026-06-27'));

    expect(blueprint.lifePath).toBe(4);
    expect(blueprint.destiny).not.toBeNull();
    expect(blueprint.personalYear).not.toBeNull();
    expect(blueprint.referenceDate).toBe('2026-06-27');
  });

  it('calculates personal year from birth month/day and current year', () => {
    expect(calculatePersonalYear('1990-07-14', new Date('2026-01-01'))).toBeTruthy();
  });
});