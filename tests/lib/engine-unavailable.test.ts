jest.mock('@/lib/sweph-runtime', () => ({
  getSweph: () => null,
}));

import { calculateBirthChart } from '@/lib/engine';
import { EphemerisUnavailableError } from '@/lib/chart-provenance';

describe('engine without sweph', () => {
  it('refuses to return the demo chart as a Swiss result', () => {
    expect(() =>
      calculateBirthChart('1983-08-14', '16:21', 36.85, -76.29, {
        includePatterns: false,
        includeTransits: false,
      }),
    ).toThrow(EphemerisUnavailableError);
  });
});
