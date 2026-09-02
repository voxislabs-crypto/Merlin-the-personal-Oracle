import {
  buildLifeRiskHorizon,
  computeLifeRisk,
  formatHorizonTooltip,
  isHorizonFlowWindow,
  lifeRiskLevelPresentation,
} from '@/lib/atmosphere/life-risk';

describe('computeLifeRisk', () => {
  it('flags bullshit when hard outer-planet pressure is loud', () => {
    const risk = computeLifeRisk({
      date: '2026-08-05',
      intensity: 72,
      confidence: 80,
      forecast: { day_rating: 'challenging' },
      predictive: {
        events: [
          {
            eventId: 'sat-sq-moon',
            scores: { intensity: 82, confidence: 0.85, volatility: 40 },
            transit: {
              transitingPlanet: 'Saturn',
              aspect: 'Square',
              natalPlanet: 'Moon',
            },
            timing: {
              phase: 'peaking',
              peakAt: '2026-08-07T12:00:00.000Z',
              daysToPeak: 2,
            },
            domains: [
              { name: 'family', impact: 80, valence: -0.8 },
              { name: 'self', impact: 65, valence: -0.5 },
            ],
          },
          {
            eventId: 'mars-opp-sun',
            scores: { intensity: 70, confidence: 0.7, volatility: 55 },
            transit: {
              transitingPlanet: 'Mars',
              aspect: 'Opposition',
              natalPlanet: 'Sun',
            },
            timing: { phase: 'building', daysToPeak: 4 },
            domains: [{ name: 'self', impact: 70, valence: -0.6 }],
          },
        ],
      },
      storms: {
        storms: [
          {
            title: 'Saturn Square Moon',
            intensity: 'severe',
            intensityScore: 8.5,
            transitingPlanet: 'Saturn',
            natalPlanet: 'Moon',
            aspect: 'Square',
            date: '2026-08-07',
            lifeArea: 'Emotional Wellbeing',
            phase: 'peak',
          },
        ],
      },
    });

    expect(risk.level === 'friction' || risk.level === 'storm').toBe(true);
    expect(risk.elevatedDisruption).toBe(true);
    expect(risk.overallFriction).toBeGreaterThanOrEqual(50);
    // Soft scale: even loud stacks should not pin absolute 100
    expect(risk.overallFriction).toBeLessThan(96);
    expect(risk.topDrivers[0]?.label).toMatch(/Saturn/i);
    expect(risk.frictionWindows.length).toBeGreaterThan(0);
    expect(risk.nextFrictionPeak?.label).toBeTruthy();
    expect(risk.domains.find((d) => d.name === 'family')?.friction).toBeGreaterThan(0);
    expect(risk.headline.length).toBeGreaterThan(10);
    expect(risk.move.length).toBeGreaterThan(10);
    expect(risk.provenance).toContain('life-risk-v1');
  });

  it('stays calm when only soft support aspects are present', () => {
    const risk = computeLifeRisk({
      date: '2026-08-05',
      intensity: 35,
      confidence: 70,
      forecast: { day_rating: 'positive' },
      predictive: {
        events: [
          {
            eventId: 'jup-trine-sun',
            scores: { intensity: 60, confidence: 0.75, volatility: 10 },
            transit: {
              transitingPlanet: 'Jupiter',
              aspect: 'Trine',
              natalPlanet: 'Sun',
            },
            timing: { phase: 'peaking', daysToPeak: 0 },
            domains: [{ name: 'self', impact: 55, valence: 0.7 }],
          },
          {
            eventId: 'venus-sextile-moon',
            scores: { intensity: 48, confidence: 0.6, volatility: 5 },
            transit: {
              transitingPlanet: 'Venus',
              aspect: 'Sextile',
              natalPlanet: 'Moon',
            },
            timing: { phase: 'building', daysToPeak: 1 },
            domains: [{ name: 'love', impact: 45, valence: 0.6 }],
          },
        ],
      },
      storms: { storms: [] },
    });

    expect(risk.level === 'calm' || risk.level === 'watch').toBe(true);
    expect(risk.elevatedDisruption).toBe(false);
    expect(risk.supportWindows.length).toBeGreaterThan(0);
    expect(risk.overallFriction).toBeLessThan(62);
  });

  it('exposes presentation tokens for each level', () => {
    for (const level of ['calm', 'watch', 'friction', 'storm'] as const) {
      const p = lifeRiskLevelPresentation(level);
      expect(p.label.length).toBeGreaterThan(3);
      expect(p.badgeClass).toContain('border-');
      expect(p.textClass).toMatch(/^text-/);
      expect(p.hex).toMatch(/^#/);
    }
  });

  it('keeps friction graduated — avoids pinning every domain/day at 100', () => {
    const risk = computeLifeRisk({
      date: '2026-08-05',
      intensity: 80,
      forecast: { day_rating: 'challenging' },
      predictive: {
        events: [
          {
            eventId: 'a',
            scores: { intensity: 95, confidence: 0.9, volatility: 80 },
            transit: { transitingPlanet: 'Saturn', aspect: 'Square', natalPlanet: 'Sun' },
            timing: { phase: 'peaking', daysToPeak: 0, peakAt: '2026-08-05T12:00:00' },
            domains: [
              { name: 'career', impact: 100, valence: -0.9 },
              { name: 'self', impact: 95, valence: -0.8 },
            ],
          },
          {
            eventId: 'b',
            scores: { intensity: 70, confidence: 0.7, volatility: 40 },
            transit: { transitingPlanet: 'Mars', aspect: 'Square', natalPlanet: 'Moon' },
            timing: { phase: 'building', daysToPeak: 3, peakAt: '2026-08-08T12:00:00' },
            domains: [
              { name: 'family', impact: 75, valence: -0.6 },
              { name: 'health', impact: 65, valence: -0.5 },
            ],
          },
        ],
      },
      storms: {
        storms: [
          {
            title: 'Saturn Square Sun',
            intensity: 'severe',
            intensityScore: 10,
            transitingPlanet: 'Saturn',
            natalPlanet: 'Sun',
            aspect: 'Square',
            date: '2026-08-05',
            lifeArea: 'Identity & Confidence',
            phase: 'peak',
          },
          {
            title: 'Mars Square Moon',
            intensity: 'moderate',
            intensityScore: 6,
            transitingPlanet: 'Mars',
            natalPlanet: 'Moon',
            aspect: 'Square',
            date: '2026-08-08',
            lifeArea: 'Emotional Wellbeing',
            phase: 'brewing',
          },
        ],
      },
    });

    // No domain should slam the absolute ceiling from a single max stack
    for (const d of risk.domains) {
      if (d.friction > 0) {
        expect(d.friction).toBeLessThan(96);
      }
    }
    // Storm windows of different intensity should not all equal 100
    const frictions = risk.frictionWindows.map((w) => w.friction);
    expect(Math.max(...frictions)).toBeLessThan(96);
    expect(new Set(frictions).size).toBeGreaterThan(1);
    // Milder storm day should score below peak severe day
    const peak = risk.frictionWindows.find((w) => w.label.includes('Saturn'));
    const milder = risk.frictionWindows.find((w) => w.label.includes('Mars'));
    if (peak && milder) {
      expect(peak.friction).toBeGreaterThan(milder.friction);
    }
  });

  it('defaults to a 30-day horizon', () => {
    const risk = computeLifeRisk({ date: '2026-08-05' });
    expect(risk.windowDays).toBe(30);
    expect(risk.horizon).toHaveLength(30);
  });

  it('scores sampled quiet days and greys days that were never calculated', () => {
    const horizon = buildLifeRiskHorizon({
      asOfDate: '2026-09-02',
      windowDays: 30,
      windows: [
        {
          id: 'hard',
          kind: 'friction',
          label: 'Uranus square Venus',
          friction: 68,
          confidence: 80,
          domains: ['love'],
          source: 'storm',
          peakAt: '2026-09-03T12:00:00',
          daysToPeak: 1,
        },
        {
          id: 'soft',
          kind: 'support',
          label: 'Jupiter trine Sun',
          friction: 22,
          ease: 44,
          confidence: 70,
          domains: ['self'],
          source: 'transit',
          peakAt: '2026-09-05T12:00:00',
          daysToPeak: 3,
        },
      ],
      sampledDays: [
        {
          date: '2026-09-02',
          scored: true,
          friction: 0,
          ease: 0,
        },
        {
          date: '2026-09-03',
          scored: true,
          friction: 60,
          ease: 0,
          frictionDriver: 'Uranus square Venus',
        },
      ],
    });
    expect(horizon).toHaveLength(30);
    expect(horizon[0]).toMatchObject({ date: '2026-09-02', scored: true, friction: 0, ease: 0 });
    expect(horizon[1].friction).toBeGreaterThanOrEqual(60);
    expect(horizon[1].frictionDriver).toMatch(/Uranus square Venus/);
    expect(horizon[3].ease).toBe(44);
    expect(horizon[3].easeDriver).toMatch(/Jupiter trine Sun/);
    expect(horizon[10].scored).toBe(false);
    expect(horizon[10].friction).toBe(0);
    expect(horizon[10].ease).toBe(0);
    expect(formatHorizonTooltip(horizon[1])).toMatch(/friction 6/);
    expect(formatHorizonTooltip(horizon[1])).toMatch(/Uranus square Venus/);
    expect(formatHorizonTooltip(horizon[3])).toMatch(/ease 44/);
    expect(formatHorizonTooltip(horizon[0])).toMatch(/No major hard or supportive hits scored this day/);
    expect(formatHorizonTooltip(horizon[10])).toMatch(/Not calculated past the current window/);
    expect(isHorizonFlowWindow(horizon[3])).toBe(true);
    expect(isHorizonFlowWindow(horizon[1])).toBe(false);
  });

  it('plots trines as ease without lifting Storm Watch friction', () => {
    const risk = computeLifeRisk({
      date: '2026-09-02',
      intensity: 35,
      forecast: { day_rating: 'positive' },
      predictive: {
        events: [
          {
            eventId: 'jup-trine-sun',
            scores: { intensity: 60, confidence: 0.75, volatility: 10 },
            transit: {
              transitingPlanet: 'Jupiter',
              aspect: 'Trine',
              natalPlanet: 'Sun',
            },
            timing: { phase: 'peaking', daysToPeak: 0, peakAt: '2026-09-02T12:00:00' },
            domains: [{ name: 'self', impact: 55, valence: 0.7 }],
          },
        ],
      },
      storms: {
        storms: [],
        dayHorizon: Array.from({ length: 30 }, (_, i) => {
          const date = `2026-09-${String(2 + i).padStart(2, '0')}`;
          // keep dates valid through month end by clamping via ISO-less pad — test only needs first days
          return {
            date: i < 29 ? date : '2026-10-01',
            scored: true,
            friction: 0,
            ease: 0,
          };
        }),
      },
    });
    expect(risk.horizon[0].scored).toBe(true);
    expect(risk.horizon[0].ease).toBeGreaterThan(20);
    expect(risk.horizon[0].friction).toBeLessThan(30);
    expect(risk.overallFriction).toBeLessThan(62);
    expect(risk.supportWindows[0]?.ease).toBeGreaterThan(20);
  });

  it('boosts friction and bullshit when confluence triple-hit is active', () => {
    const base = computeLifeRisk({
      date: '2026-08-05',
      intensity: 52,
      forecast: { day_rating: 'yellow' },
      predictive: {
        events: [
          {
            eventId: 'mars-sq-moon',
            scores: { intensity: 58, confidence: 0.7 },
            transit: {
              transitingPlanet: 'Mars',
              aspect: 'Square',
              natalPlanet: 'Moon',
            },
            timing: { phase: 'building', daysToPeak: 3 },
            domains: [{ name: 'family', impact: 55, valence: -0.5 }],
          },
        ],
      },
    });

    const boosted = computeLifeRisk({
      date: '2026-08-05',
      intensity: 52,
      forecast: { day_rating: 'yellow' },
      predictive: {
        events: [
          {
            eventId: 'mars-sq-moon',
            scores: { intensity: 58, confidence: 0.7 },
            transit: {
              transitingPlanet: 'Mars',
              aspect: 'Square',
              natalPlanet: 'Moon',
            },
            timing: { phase: 'building', daysToPeak: 3 },
            domains: [{ name: 'family', impact: 55, valence: -0.5 }],
          },
        ],
      },
      confluence: {
        aligned: true,
        tripleHit: true,
        signalCount: 3,
        themes: ['inner work', 'career'],
      },
    });

    expect(boosted.overallFriction).toBeGreaterThan(base.overallFriction);
    expect(boosted.confidence).toBeGreaterThanOrEqual(base.confidence);
    expect(boosted.provenance).toContain('confluence-triple-hit');
    expect(boosted.elevatedDisruption).toBe(true);
  });
});
