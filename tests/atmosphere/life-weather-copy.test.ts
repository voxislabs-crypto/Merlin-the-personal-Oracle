import {
  buildLifeWeatherBrief,
  buildTodayMove,
  buildWhyDriverPills,
  formatWhyLine,
  isFluffyLifeWeatherCopy,
  looksLikeTechnicalTransit,
  resolveWhyDomains,
} from '@/lib/atmosphere/life-weather-copy';
import type { AtmospherePacket, LifeRiskPacket } from '@/lib/atmosphere/types';

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

describe('isFluffyLifeWeatherCopy', () => {
  it('flags horoscope filler', () => {
    expect(isFluffyLifeWeatherCopy('Stay mindful of cosmic energies')).toBe(true);
    expect(
      isFluffyLifeWeatherCopy(
        'Mixed cosmic signals are in play today, Leo—pace yourself and stay flexible.',
      ),
    ).toBe(true);
  });

  it('allows concrete moves', () => {
    expect(isFluffyLifeWeatherCopy('Send the draft, skip the argument.')).toBe(false);
    expect(isFluffyLifeWeatherCopy('One work priority only.')).toBe(false);
  });
});

describe('looksLikeTechnicalTransit', () => {
  it('detects aspect-style labels', () => {
    expect(looksLikeTechnicalTransit('Mars square Moon')).toBe(true);
    expect(looksLikeTechnicalTransit('Saturn opposition Sun')).toBe(true);
  });

  it('rejects plain language', () => {
    expect(looksLikeTechnicalTransit('Emotional heat is rising')).toBe(false);
    expect(looksLikeTechnicalTransit('Even pressure')).toBe(false);
  });
});

describe('resolveWhyDomains', () => {
  it('prefers hot risk domains', () => {
    const risk = {
      domains: [
        { name: 'career', label: 'Work', friction: 72, support: 10, hitCount: 2 },
        { name: 'love', label: 'Bonds', friction: 60, support: 20, hitCount: 1 },
        { name: 'health', label: 'Body', friction: 20, support: 40, hitCount: 0 },
      ],
    } as LifeRiskPacket;

    expect(resolveWhyDomains(risk)).toMatch(/work/i);
    expect(resolveWhyDomains(risk)).toMatch(/relationships/i);
  });

  it('infers from technical label when risk is quiet', () => {
    expect(resolveWhyDomains(null, 'Mars square Moon')).toMatch(/mood|conflict/i);
    expect(resolveWhyDomains(null, 'Mercury square Saturn')).toMatch(/communication|commitments/i);
  });
});

describe('buildWhyDriverPills', () => {
  it('builds short pills from top drivers', () => {
    const pills = buildWhyDriverPills({
      topDrivers: [
        {
          label: 'Uranus Opposition Uranus',
          friction: 70,
          kind: 'friction',
          domains: ['self'],
          source: 'transit',
        },
        {
          label: 'Mars Opposition Neptune',
          friction: 60,
          kind: 'friction',
          domains: ['career'],
          source: 'transit',
        },
      ],
    } as LifeRiskPacket);

    expect(pills).toHaveLength(2);
    expect(pills[0].label).toMatch(/Uranus Opp Uranus/i);
    expect(pills[0].hint.length).toBeGreaterThan(4);
    expect(pills[1].label).toMatch(/Mars Opp Neptune/i);
  });

  it('falls back to dominant technical label', () => {
    const pills = buildWhyDriverPills(null, 'Mars square Moon');
    expect(pills).toHaveLength(1);
    expect(pills[0].label).toMatch(/Mars/i);
    expect(pills[0].hint.toLowerCase()).toMatch(/heat|mood|conflict|drive|active/);
  });
});

describe('formatWhyLine', () => {
  it('leads with domain friction when pill sources exist', () => {
    const why = formatWhyLine({
      intensity: 62,
      driverLabel: 'Mars square Moon',
      driverWhy: 'Emotional heat is rising faster than usual.',
      risk: null,
    });

    expect(why.toLowerCase()).toMatch(/elevated friction/);
    expect(why.toLowerCase()).toMatch(/mood|conflict/);
  });

  it('uses risk domains when present and keeps technical in pills not the wall', () => {
    const why = formatWhyLine({
      intensity: 80,
      driverLabel: 'Saturn square Sun',
      risk: {
        domains: [
          { name: 'career', label: 'Work', friction: 80, support: 5, hitCount: 3 },
        ],
        topDrivers: [
          {
            label: 'Saturn square Sun',
            friction: 80,
            kind: 'friction',
            domains: ['career'],
            source: 'transit',
          },
        ],
      } as LifeRiskPacket,
    });

    expect(why).toMatch(/High friction in work/i);
    expect(why).not.toMatch(/due to Saturn square Sun/i);
  });
});

describe('buildTodayMove', () => {
  it('rejects fluffy transit do and uses domain-aware fallback', () => {
    const move = buildTodayMove({
      intensity: 62,
      transitDo: 'Stay mindful of cosmic energies',
      risk: {
        domains: [{ name: 'career', label: 'Work', friction: 70, support: 10, hitCount: 2 }],
      } as LifeRiskPacket,
    });
    expect(move).not.toMatch(/cosmic/i);
    expect(move.toLowerCase()).toMatch(/work|priority|focus|draft|deliverable|meeting/);
  });

  it('rejects the stuck generic placeholder', () => {
    const move = buildTodayMove({
      intensity: 48,
      date: '2026-08-12',
      transitDo: 'One reversible step only — talk, draft, or scout before you commit.',
    });
    expect(move).not.toMatch(/talk, draft, or scout/i);
    expect(move).not.toMatch(/one reversible step only/i);
    expect(move.length).toBeGreaterThan(12);
  });

  it('rotates fallback copy by calendar date', () => {
    const a = buildTodayMove({ intensity: 48, date: '2026-08-12' });
    const b = buildTodayMove({ intensity: 48, date: '2026-08-13' });
    const c = buildTodayMove({ intensity: 48, date: '2026-08-14' });
    const unique = new Set([a, b, c]);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('prefers a moon transit do over a generic first lookup row', () => {
    const move = buildTodayMove({
      intensity: 48,
      date: '2026-08-12',
      transitLookup: [
        {
          transit_aspect: 'Saturn square Sun',
          do: ['One reversible step only — talk, draft, or scout before you commit.'],
        },
        {
          transit_aspect: 'Moon square Mars',
          do: [
            'Name the feeling in one sentence before you reply or decide.',
            'Keep the hardest conversation under ten minutes; leave the rest.',
            'Protect a quiet hour — mood is louder than the facts today.',
          ],
        },
      ],
    });
    expect(move).toMatch(/feeling|conversation|quiet hour/i);
  });
});

describe('buildLifeWeatherBrief', () => {
  it('builds a three-beat life weather brief from the packet', () => {
    const brief = buildLifeWeatherBrief({
      packet: mockPacket(),
      forecastSummary: 'A tense emotional day that rewards honest pacing.',
    });

    expect(brief.eyebrow).toMatch(/life weather/i);
    expect(brief.story.toLowerCase()).toMatch(/sky|weather|bandwidth|doors|pressure|mixed|cooperative|elevated/);
    expect(brief.story).not.toMatch(/cosmic signals/i);
    expect(brief.why.toLowerCase()).toMatch(/friction|pressure/);
    expect(brief.why.toLowerCase()).toMatch(/mood|conflict/);
    expect(brief.move.length).toBeGreaterThan(8);
    expect(brief.move).not.toMatch(/cosmic energies/i);
  });

  it('uses concrete transit do as the move when no parseable facts exist', () => {
    const brief = buildLifeWeatherBrief({
      packet: mockPacket({
        intensity: 40,
        dominantDriver: {
          label: 'Even pressure',
          rationale: 'Nothing loud.',
          source: 'fallback',
        },
        risk: undefined as never,
      }),
      transitDo: 'Send the draft, skip the argument.',
    });
    expect(brief.move).toBe('Send the draft, skip the argument.');
    expect(brief.whyToday).toBeUndefined();
  });

  it('synthesizes a fact-backed move when transits are present', () => {
    const brief = buildLifeWeatherBrief({
      packet: mockPacket(),
      date: '2026-08-13',
    });
    expect(brief.themeLabel).toBeTruthy();
    expect(brief.whyToday?.toLowerCase()).toMatch(/heat|pressure|weather|lane|restraint/);
    expect(brief.whyToday).not.toMatch(/square|opposition/i);
    expect(brief.watchFor).toBeTruthy();
    expect(brief.moveConfidence).toBeGreaterThan(20);
    expect(brief.move).not.toMatch(/one reversible step only/i);
  });

  it('rejects horoscope fluff for story and move', () => {
    const brief = buildLifeWeatherBrief({
      packet: mockPacket({ intensity: 35 }),
      forecastSummary:
        'Mixed cosmic signals are in play today, Leo—pace yourself and stay flexible.',
      transitDo: 'Stay mindful of cosmic energies',
    });

    expect(brief.story).not.toMatch(/cosmic|Leo/i);
    expect(brief.story.toLowerCase()).toMatch(/cooperative|doors|sky|resistance|send/);
    expect(brief.move).not.toMatch(/cosmic energies/i);
    expect(brief.move.length).toBeGreaterThan(12);
  });

  it('handles loading state', () => {
    const brief = buildLifeWeatherBrief({ loading: true });
    expect(brief.story).toMatch(/Reading life weather/i);
    expect(brief.why).toMatch(/locking signals/i);
  });

  it('does not lead story with multi-day risk headline fluff', () => {
    const brief = buildLifeWeatherBrief({
      packet: mockPacket({
        risk: {
          headline: 'High life-friction window — Saturn square Moon is loud.',
          move: 'Shrink the whole week.',
          elevatedDisruption: true,
          nextFrictionPeak: { label: 'Saturn square Moon', daysToPeak: 4, friction: 80 },
          topDrivers: [{ label: 'Saturn square Moon' }],
          domains: [{ name: 'career', label: 'Work', friction: 70, support: 5, hitCount: 1 }],
        } as any,
      }),
      forecastSummary: 'A tense emotional day that rewards honest pacing.',
      transitDo: 'Walk before you reply.',
    });

    expect(brief.story).not.toMatch(/High life-friction window/i);
    expect(brief.story.toLowerCase()).toMatch(/elevated|bandwidth|work|sky|pressure|emotional/);
    expect(brief.move.length).toBeGreaterThan(8);
    expect(brief.whyToday?.toLowerCase()).toMatch(/restraint|duty|heat|pressure|weather|lane/);
    expect(brief.why.toLowerCase()).toMatch(/friction|pressure|work|mood|conflict/);
  });
});
