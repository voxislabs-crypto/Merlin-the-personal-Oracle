import {
  applyBaselineModifier,
  getBaselineTemperature,
  normalizeDayRating,
  resolveBaseIntensity,
} from '@/lib/atmosphere/intensity';

describe('atmosphere intensity', () => {
  it('prefers pressure-engine globalPressure when available', () => {
    const result = resolveBaseIntensity({
      explainability: {
        globalPressure: 72,
        confidence: 80,
        topDrivers: [],
        windowStartIso: '',
        windowEndIso: '',
        weightingBreakdown: {},
        personalizationBreakdown: {},
        domainScores: [],
        archetypes: [],
        safety: { grounding: [], caution: [], agency: [] },
      },
      forecast: { day_rating: 'green' },
    });

    expect(result.intensity).toBe(72);
    expect(result.source).toBe('pressure');
    expect(result.provenance).toContain('pressure-engine');
  });

  it('uses predictive event intensity when pressure packet is absent', () => {
    const result = resolveBaseIntensity({
      predictive: {
        events: [{ scores: { intensity: 68 } }],
      },
    });

    expect(result.intensity).toBe(68);
    expect(result.source).toBe('pressure');
  });

  it('overrides with storm severity when pressure is absent', () => {
    const result = resolveBaseIntensity({
      storms: {
        storms: [{ intensity: 'severe', title: 'Mars square Saturn' }],
      },
    });

    expect(result.intensity).toBe(86);
    expect(result.source).toBe('storm');
  });

  it('maps storm intensityScore to 0-100 scale', () => {
    const result = resolveBaseIntensity({
      storms: {
        storms: [{ intensityScore: 7.2 }],
      },
    });

    expect(result.intensity).toBe(72);
    expect(result.source).toBe('storm');
  });

  it('falls back to forecast day_rating', () => {
    const result = resolveBaseIntensity({
      forecast: { day_rating: 'yellow' },
    });

    expect(result.intensity).toBe(55);
    expect(result.source).toBe('forecast');
  });

  it('returns neutral fallback when no inputs exist', () => {
    const result = resolveBaseIntensity({});
    expect(result.intensity).toBe(55);
    expect(result.source).toBe('fallback');
  });

  it('amplifies intensity for hot progressed Moon baseline', () => {
    expect(applyBaselineModifier(60, 'hot')).toBe(66);
  });

  it('dampens intensity for cool progressed Moon baseline', () => {
    expect(applyBaselineModifier(60, 'cool')).toBe(57);
  });

  it('classifies Scorpio progressed Moon as hot baseline', () => {
    expect(
      getBaselineTemperature({
        sign: 'Scorpio',
        emphasis: ['self'],
      })
    ).toBe('hot');
  });

  it('normalizes legacy forecast ratings to green/yellow/red', () => {
    expect(normalizeDayRating({ day_rating: 'Challenging' }, 40)).toBe('red');
    expect(normalizeDayRating({ day_rating: 'Positive' }, 80)).toBe('green');
    expect(normalizeDayRating(null, 50)).toBe('yellow');
    expect(normalizeDayRating(null, 80)).toBe('red');
  });
});