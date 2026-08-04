import { buildLifeWeatherBrief } from '@/lib/atmosphere/life-weather-copy';
import type { AtmospherePacket } from '@/lib/atmosphere/types';

function mockPacket(overrides: Partial<AtmospherePacket> = {}): AtmospherePacket {
  return {
    date: '2026-08-03',
    intensity: 62,
    feltIntensity: 55,
    readinessModifier: 0,
    dayRating: 'yellow',
    tone: {
      label: 'Caution',
      icon: 'rain',
      gradient: '',
      shellBg: '',
      border: '',
      text: '',
      glow: '',
    },
    dominantDriver: {
      label: 'Mars square Moon',
      rationale: 'Emotional heat is rising faster than usual.',
      source: 'transit',
    },
    temporal: { baselineTemperature: 'warm' },
    confluence: {
      aligned: false,
      tripleHit: false,
      themes: [],
      signalCount: 0,
      sources: [],
    },
    realityCheck: {
      sentimentScore: null,
      readinessModifier: 0,
      feltIntensity: 55,
      gap: 0,
      guidanceBranch: 'neutral',
      guidanceNote: '',
      source: 'none',
    },
    patterns: {
      active: false,
      profiles: [],
      matches: [],
      modifier: 1,
      feedbackCount: 0,
    },
    provenance: ['test'],
    ...overrides,
  } as AtmospherePacket;
}

describe('buildLifeWeatherBrief', () => {
  it('builds a three-beat life weather brief from the packet', () => {
    const brief = buildLifeWeatherBrief({
      packet: mockPacket(),
      forecastSummary: 'A tense emotional day that rewards honest pacing.',
    });

    expect(brief.eyebrow).toMatch(/life weather/i);
    expect(brief.story).toMatch(/life weather/i);
    expect(brief.why).toMatch(/Mars square Moon/i);
    expect(brief.move.length).toBeGreaterThan(8);
  });

  it('uses transit do as the move when present', () => {
    const brief = buildLifeWeatherBrief({
      packet: mockPacket({ intensity: 40 }),
      transitDo: 'Send the draft, skip the argument.',
    });
    expect(brief.move).toBe('Send the draft, skip the argument.');
  });

  it('handles loading state', () => {
    const brief = buildLifeWeatherBrief({ loading: true });
    expect(brief.story).toMatch(/Reading life weather/i);
  });
});
