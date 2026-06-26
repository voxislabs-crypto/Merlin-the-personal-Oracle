import { computeAtmosphere, computeAtmosphereConfluence } from '@/lib/atmosphere';

describe('computeAtmosphere', () => {
  it('produces a complete packet from pressure + predictive inputs', () => {
    const packet = computeAtmosphere({
      date: '2026-06-24',
      explainability: {
        globalPressure: 63,
        confidence: 78,
        topDrivers: [
          {
            transitId: 'mars-square-moon',
            label: 'Mars square natal Moon',
            strength: 70,
            confidence: 75,
            reason: 'You might notice emotional reactivity rise under this transit.',
          },
        ],
        windowStartIso: '2026-06-24T00:00:00.000Z',
        windowEndIso: '2026-06-25T00:00:00.000Z',
        weightingBreakdown: {},
        personalizationBreakdown: {},
        domainScores: [],
        archetypes: [],
        safety: {
          grounding: ['Slow down before reacting.'],
          caution: ['Avoid forcing conclusions under pressure.'],
          agency: ['Choose one reversible step.'],
        },
      },
      predictive: {
        events: [
          {
            eventId: 'evt-1',
            scores: { intensity: 63, confidence: 0.78 },
            transit: {
              transitingPlanet: 'Mars',
              aspect: 'Square',
              natalPlanet: 'Moon',
            },
            narrative: {
              whisper: 'You might notice emotional heat spike before it settles.',
            },
          },
        ],
        lunarTiming: {
          phase: 'Last Quarter',
          illumination: 0.42,
          actionBias: 'review',
          isVoidOfCourse: false,
          guidance: 'Review what is complete before pushing forward.',
        },
        progressedMoon: {
          sign: 'Scorpio',
          degree: 14,
          emphasis: ['health', 'self'],
        },
      },
      forecast: {
        day_rating: 'yellow',
        planetaryHighlights: ['Mars square natal Moon'],
      },
      moonPhase: 'Last Quarter',
      moonSign: 'Virgo',
    });

    expect(packet.date).toBe('2026-06-24');
    expect(packet.intensity).toBeGreaterThanOrEqual(63);
    expect(packet.dayRating).toBe('yellow');
    expect(packet.tone.label).toBe('Caution');
    expect(packet.dominantDriver.label).toContain('Mars');
    expect(packet.dominantDriver.rationale.length).toBeGreaterThan(10);
    expect(packet.temporal.baselineTemperature).toBe('hot');
    expect(packet.temporal.progressedMoonSign).toBe('Scorpio');
    expect(packet.provenance).toContain('pressure-engine');
    expect(packet.provenance).toContain('progressed-moon');
    expect(packet.confidence).toBe(78);
    expect(packet.feltIntensity).toBe(packet.intensity);
    expect(packet.realityCheck.source).toBe('none');
    expect(packet.patterns.modifier).toBe(1);
    expect(packet.patterns.active).toEqual([]);
  });

  it('applies calibration modifier after enough feedback samples', () => {
    const packet = computeAtmosphere({
      explainability: {
        globalPressure: 50,
        confidence: 70,
        topDrivers: [],
        windowStartIso: '',
        windowEndIso: '',
        weightingBreakdown: {},
        personalizationBreakdown: {},
        domainScores: [],
        archetypes: [],
        safety: { grounding: [], caution: [], agency: [] },
      },
      calibration: {
        feedbackCount: 5,
        strongestPlanet: 'Mars',
        strongestMultiplier: 1.2,
      },
    });

    expect(packet.intensity).toBe(60);
    expect(packet.calibration?.active).toBe(true);
    expect(packet.provenance).toContain('calibration-Mars');
  });

  it('marks triple confluence when transit, lunar, and progressed moon align', () => {
    const confluence = computeAtmosphereConfluence({
      events: [
        {
          eventId: 'evt-1',
          scores: { intensity: 70 },
          transit: {
            transitingPlanet: 'Mars',
            aspect: 'Square',
            natalPlanet: 'Moon',
          },
          narrative: { whisper: 'Emotional heat may rise.' },
        },
        {
          eventId: 'evt-2',
          scores: { intensity: 66 },
          transit: {
            transitingPlanet: 'Saturn',
            aspect: 'Square',
            natalPlanet: 'Moon',
          },
          narrative: { whisper: 'Pressure may build around limits.' },
        },
        {
          eventId: 'evt-3',
          scores: { intensity: 64 },
          transit: {
            transitingPlanet: 'Pluto',
            aspect: 'Opposition',
            natalPlanet: 'Moon',
          },
          narrative: { whisper: 'Deep feelings may surface for integration.' },
        },
      ],
      lunarTiming: {
        phase: 'Last Quarter',
        illumination: 0.4,
        actionBias: 'review',
        isVoidOfCourse: false,
        guidance: 'Release what is complete.',
      },
      progressedMoon: {
        sign: 'Scorpio',
        emphasis: ['health', 'self'],
      },
    });

    expect(confluence.aligned).toBe(true);
    expect(confluence.themes.length).toBeGreaterThan(0);
  });

  it('keeps rationale copy safe', () => {
    const packet = computeAtmosphere({
      storms: {
        storms: [
          {
            title: 'Saturn opposition Sun',
            description: 'This will happen soon and you cannot avoid the outcome.',
          },
        ],
      },
    });

    expect(packet.dominantDriver.rationale).not.toMatch(/this will happen/i);
    expect(packet.dominantDriver.rationale).not.toMatch(/you cannot avoid/i);
  });
});