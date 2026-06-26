import {
  computeAnnualProfection,
  computeProfectionFromBirth,
  getSignAtOffset,
  getTimeLordForSign,
} from '@/lib/astrology/profections';

describe('annual profections', () => {
  it('maps age 0 to the ascendant sign and Sun time lord for Leo rising', () => {
    const profection = computeAnnualProfection('Leo', 0);
    expect(profection.profectedSign).toBe('Leo');
    expect(profection.profectedHouse).toBe(1);
    expect(profection.timeLord).toBe('Sun');
    expect(profection.themeOfYear).toContain('Leo');
  });

  it('maps age 1 to the second house sign for Leo rising', () => {
    const profection = computeAnnualProfection('Leo', 1);
    expect(profection.profectedSign).toBe('Virgo');
    expect(profection.profectedHouse).toBe(2);
    expect(profection.timeLord).toBe('Mercury');
  });

  it('maps age 30 to Aquarius with Saturn for Leo rising', () => {
    const profection = computeAnnualProfection('Leo', 30);
    expect(profection.profectedSign).toBe('Aquarius');
    expect(profection.profectedHouse).toBe(7);
    expect(profection.timeLord).toBe('Saturn');
  });

  it('handles age 42 boundary with the same profected sign cycle as age 30', () => {
    const age30 = computeAnnualProfection('Leo', 30);
    const age42 = computeAnnualProfection('Leo', 42);
    expect(age42.profectedSign).toBe(age30.profectedSign);
    expect(age42.profectedHouse).toBe(age30.profectedHouse);
    expect(getTimeLordForSign(getSignAtOffset('Leo', 42 % 12))).toBe('Saturn');
  });

  it('computes profection from birth date', () => {
    const profection = computeProfectionFromBirth('Leo', '1983-08-14', new Date('2026-06-25T12:00:00'));
    expect(profection.age).toBeGreaterThan(40);
    expect(profection.themeOfYear).toMatch(/time lord/i);
  });
});