import { resolvePlanetResonanceMultiplier } from '@/lib/astrology/resonance-weight-math';

describe('planet resonance multiplier', () => {
  it('stays neutral until twelve samples', () => {
    expect(resolvePlanetResonanceMultiplier(1, 0.85)).toBe(1);
    expect(resolvePlanetResonanceMultiplier(5, 0.85)).toBe(1);
    expect(resolvePlanetResonanceMultiplier(11, -0.85)).toBe(1);
  });

  it('shrinks a full sample toward neutral', () => {
    const boosted = resolvePlanetResonanceMultiplier(12, 0.85);
    expect(boosted).toBeGreaterThan(1);
    expect(boosted).toBeLessThan(1.1);
  });
});
