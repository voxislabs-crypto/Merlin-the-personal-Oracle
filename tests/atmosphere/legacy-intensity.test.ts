import {
  intensityFromLegacyStorm,
  resolveLegacyCosmicWeatherIntensity,
} from '@/lib/atmosphere/legacy-intensity';

describe('legacy-intensity', () => {
  it('prefers storm score over day rating', () => {
    const intensity = resolveLegacyCosmicWeatherIntensity({
      storms: [{ intensity: 'severe' }],
      dayRating: 'green',
    });
    expect(intensity).toBe(86);
  });

  it('uses shared ratingToIntensity mapping for forecast fallback', () => {
    const intensity = resolveLegacyCosmicWeatherIntensity({
      dayRating: 'yellow',
    });
    expect(intensity).toBe(55);
  });

  it('maps intensityScore to 0-100 scale', () => {
    expect(intensityFromLegacyStorm({ intensityScore: 7.2 })).toBe(72);
  });
});