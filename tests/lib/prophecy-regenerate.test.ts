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
});
