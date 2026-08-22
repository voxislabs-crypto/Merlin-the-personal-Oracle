import { computeAtmosphere } from '@/lib/atmosphere/compute';
import { computeDaySkyPressure, isSkyEventActiveOnDate } from '@/lib/atmosphere/global-pressure';
import { resolveBaseIntensity } from '@/lib/atmosphere/intensity';
import type { AtmospherePredictiveEventInput } from '@/lib/atmosphere/types';

const TODAY = '2026-08-22';

function event(partial: {
  intensity: number;
  startsAt?: string;
  daysToPeak?: number;
  phase?: AtmospherePredictiveEventInput['timing'] extends infer T
    ? T extends { phase?: infer P }
      ? P
      : never
    : never;
  transitingPlanet?: string;
}): AtmospherePredictiveEventInput {
  return {
    scores: { intensity: partial.intensity, confidence: 0.8 },
    transit: {
      transitingPlanet: partial.transitingPlanet || 'Saturn',
      aspect: 'Square',
      natalPlanet: 'Moon',
    },
    timing: {
      phase: partial.phase,
      startsAt: partial.startsAt,
      daysToPeak: partial.daysToPeak,
    },
  };
}

describe('day sky pressure', () => {
  it('ignores future-horizon transits so the 30-day mean cannot pin Clear Flow at ~15%', () => {
    const todayHit = event({
      intensity: 68,
      startsAt: `${TODAY}T12:00:00`,
      daysToPeak: 1,
      phase: 'building',
      transitingPlanet: 'Mars',
    });
    const futureNoise: AtmospherePredictiveEventInput[] = Array.from({ length: 20 }, (_, index) =>
      event({
        intensity: 6 + (index % 5),
        startsAt: `2026-09-${String(2 + (index % 20)).padStart(2, '0')}T12:00:00`,
        daysToPeak: 10 + index,
        phase: 'building',
        transitingPlanet: 'Pluto',
      })
    );

    const windowMean = Math.round(
      [todayHit, ...futureNoise].reduce((sum, row) => sum + (row.scores?.intensity || 0), 0) /
        (futureNoise.length + 1)
    );
    expect(windowMean).toBeLessThan(20);
    expect(windowMean).toBeGreaterThanOrEqual(10);

    const day = computeDaySkyPressure([todayHit, ...futureNoise], TODAY);
    expect(day.activeCount).toBe(1);
    expect(day.pressure).toBe(68);
    expect(day.provenance).toContain('day-active-transits');
  });

  it('weights today\'s top hits instead of averaging every in-orb transit', () => {
    const day = computeDaySkyPressure(
      [
        event({ intensity: 70, startsAt: `${TODAY}T12:00:00`, transitingPlanet: 'Saturn' }),
        event({ intensity: 50, startsAt: `${TODAY}T12:00:00`, transitingPlanet: 'Mars' }),
        event({ intensity: 30, startsAt: `${TODAY}T12:00:00`, transitingPlanet: 'Moon' }),
      ],
      TODAY
    );

    // 0.7*70 + 0.2*50 + 0.1*30 = 62
    expect(day.pressure).toBe(62);
    expect(day.activeCount).toBe(3);
  });

  it('treats untimed events as current so legacy fixtures still score', () => {
    const day = computeDaySkyPressure([{ scores: { intensity: 68 } }], TODAY);
    expect(day.pressure).toBe(68);
  });

  it('returns null when every timed event starts after today', () => {
    const day = computeDaySkyPressure(
      [
        event({
          intensity: 90,
          startsAt: '2026-09-01T12:00:00',
          daysToPeak: 10,
          phase: 'building',
        }),
      ],
      TODAY
    );
    expect(day.pressure).toBeNull();
    expect(day.activeCount).toBe(0);
  });

  it('counts peaking / releasing events as active even if start is missing', () => {
    expect(
      isSkyEventActiveOnDate(event({ intensity: 55, daysToPeak: 0, phase: 'peaking' }), TODAY)
    ).toBe(true);
    expect(
      isSkyEventActiveOnDate(event({ intensity: 40, phase: 'releasing' }), TODAY)
    ).toBe(true);
  });
});

describe('resolveBaseIntensity vs washed-out window pressure', () => {
  it('prefers today-active transits over a 15 globalPressure mean', () => {
    const result = resolveBaseIntensity({
      date: TODAY,
      explainability: {
        globalPressure: 15,
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
      predictive: {
        events: [
          event({
            intensity: 68,
            startsAt: `${TODAY}T12:00:00`,
            daysToPeak: 0,
            phase: 'peaking',
            transitingPlanet: 'Mars',
          }),
          event({
            intensity: 8,
            startsAt: '2026-09-08T12:00:00',
            daysToPeak: 17,
            phase: 'building',
          }),
        ],
      },
    });

    expect(result.intensity).toBe(68);
    expect(result.source).toBe('pressure');
    expect(result.provenance).toContain('day-active-transits');
  });

  it('does not keep a 15% Clear Flow packet when the window mean is stale', () => {
    const packet = computeAtmosphere({
      date: TODAY,
      explainability: {
        globalPressure: 15,
        confidence: 40,
        topDrivers: [],
        windowStartIso: '',
        windowEndIso: '',
        weightingBreakdown: {},
        personalizationBreakdown: {},
        domainScores: [],
        archetypes: [],
        safety: { grounding: [], caution: [], agency: [] },
      },
      predictive: {
        events: [
          event({
            intensity: 72,
            startsAt: `${TODAY}T12:00:00`,
            daysToPeak: 0,
            phase: 'peaking',
            transitingPlanet: 'Saturn',
          }),
        ],
      },
    });

    expect(packet.intensity).toBeGreaterThanOrEqual(72);
    expect(packet.tone.label).not.toBe('Clear Flow');
  });

  it('skips next-week storms when scoring today', () => {
    const result = resolveBaseIntensity({
      date: TODAY,
      storms: {
        storms: [
          { intensity: 'severe', title: 'Mars square Saturn', date: '2026-09-04' },
        ],
      },
      forecast: { day_rating: 'green' },
    });

    expect(result.source).toBe('forecast');
    expect(result.intensity).toBe(28);
  });
});
