import { normalizePredictiveIntensity, predictiveIntensityScore } from '@/lib/atmosphere/normalize';

describe('normalizePredictiveIntensity', () => {
  it('treats fractional values as 0-1 scale', () => {
    expect(normalizePredictiveIntensity(0.68)).toBe(68);
  });

  it('treats values above 1 as 0-100 scale', () => {
    expect(normalizePredictiveIntensity(68)).toBe(68);
  });

  it('returns null for invalid values', () => {
    expect(normalizePredictiveIntensity(undefined)).toBeNull();
  });

  it('scores missing intensity as zero', () => {
    expect(predictiveIntensityScore(undefined)).toBe(0);
  });
});