import { buildAtmosphereRenderedDetail, resolveAtmosphereSourceEvent } from '@/lib/atmosphere/analytics';
import type { AtmospherePacket } from '@/lib/atmosphere/types';

function makePacket(provenance: string[]): AtmospherePacket {
  return {
    date: '2026-06-25',
    intensity: 72,
    feltIntensity: 72,
    readinessModifier: 1,
    dayRating: 'red',
    tone: {
      label: 'Caution',
      icon: 'rain',
      gradient: 'from-rose-500 to-orange-500',
      shellBg: 'from-rose-950/80 to-slate-950/90',
      border: 'border-rose-400/30',
      text: 'text-rose-200',
      glow: 'shadow-rose-900/20',
    },
    dominantDriver: {
      label: 'Mars square natal Moon',
      rationale: 'Emotional friction may spike under this pressure window.',
      source: 'pressure',
    },
    temporal: {
      baselineTemperature: 'neutral',
      lunarPhase: 'Waxing Gibbous',
      lunarSign: 'Scorpio',
    },
    confluence: {
      aligned: false,
      tripleHit: false,
      themes: [],
      signalCount: 0,
      sources: [],
    },
    realityCheck: {
      sentimentScore: null,
      readinessModifier: 1,
      feltIntensity: 72,
      gap: 0,
      guidanceBranch: 'neutral',
      guidanceNote: '',
      source: 'none',
    },
    patterns: {
      active: [],
      modifier: 1,
      tags: [],
      provenance: [],
    },
    confidence: 78,
    provenance,
    generatedAt: '2026-06-25T12:00:00.000Z',
  };
}

describe('atmosphere analytics', () => {
  it('maps pressure provenance to atmosphere_source_pressure', () => {
    expect(resolveAtmosphereSourceEvent(makePacket(['pressure-engine']))).toBe('atmosphere_source_pressure');
  });

  it('maps storm provenance to atmosphere_source_storm', () => {
    expect(resolveAtmosphereSourceEvent(makePacket(['storms']))).toBe('atmosphere_source_storm');
  });

  it('maps forecast provenance to atmosphere_source_rating', () => {
    expect(resolveAtmosphereSourceEvent(makePacket(['forecast-day-rating']))).toBe('atmosphere_source_rating');
  });

  it('builds atmosphere_rendered detail payload', () => {
    const detail = buildAtmosphereRenderedDetail(makePacket(['pressure-engine', 'progressed-moon']), {
      surface: 'home-hero',
    });
    expect(detail.provenance).toEqual(['pressure-engine', 'progressed-moon']);
    expect(detail.intensitySource).toBe('atmosphere_source_pressure');
    expect(detail.surface).toBe('home-hero');
  });
});