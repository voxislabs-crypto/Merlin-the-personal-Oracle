/** @jest-environment node */

import { generateProphecy } from '@/lib/astrology/prophecy';
import type { BirthChartData } from '@/types/astrology';

const mockChart = {
  jd: 2451545,
  planets: [
    { name: 'Sun', sign: 'Leo', longitude: 120 },
    { name: 'Moon', sign: 'Cancer', longitude: 100 },
    { name: 'Jupiter', sign: 'Sagittarius', longitude: 250 },
    { name: 'Saturn', sign: 'Capricorn', longitude: 280 },
    { name: 'Mars', sign: 'Aries', longitude: 10 },
    { name: 'Venus', sign: 'Taurus', longitude: 40 },
  ],
} as unknown as BirthChartData;

describe('prophecy regenerate entropy', () => {
  it('returns the same omen without a seed salt', () => {
    const a = generateProphecy({ birthChart: mockChart, style: 'omen', era: 'babylonian' });
    const b = generateProphecy({ birthChart: mockChart, style: 'omen', era: 'babylonian' });
    expect(a.prophecy).toBe(b.prophecy);
  });

  it('returns a different omen when seedSalt changes', () => {
    const a = generateProphecy({
      birthChart: mockChart,
      style: 'omen',
      era: 'babylonian',
      seedSalt: 'v1',
    });
    const b = generateProphecy({
      birthChart: mockChart,
      style: 'omen',
      era: 'babylonian',
      seedSalt: 'v2',
    });
    expect(a.prophecy).not.toBe(b.prophecy);
  });

  it('does not collapse when char-sum of salts differs by a multiple of 3', () => {
    // Old sumCharCodes + length-3 arrays: salts differing by 3 char-code total
    // produced identical prophecies. Hash + lane mix must break that.
    const samples = ['aaa', 'bbb', 'ccc', 'ddd', 'eee', 'fff'].map((salt) =>
      generateProphecy({
        birthChart: mockChart,
        style: 'omen',
        era: 'babylonian',
        seedSalt: salt,
      }).prophecy
    );
    const unique = new Set(samples);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('varies sequential regenerate-style salts', () => {
    const texts = Array.from({ length: 8 }, (_, i) =>
      generateProphecy({
        birthChart: mockChart,
        style: 'omen',
        era: 'stoic',
        seedSalt: `regen-${1_700_000_000_000 + i}-${i}`,
      }).prophecy
    );
    expect(new Set(texts).size).toBeGreaterThan(3);
  });
});
