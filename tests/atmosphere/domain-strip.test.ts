import {
  buildDomainStripItems,
  buildPersonalGreeting,
  domainTrendFromScores,
  resolveRiskPercent,
  timeOfDayGreeting,
} from '@/lib/atmosphere/domain-strip';
import {
  buildDomainDetailPayload,
  domainHitsFromRisk,
  uniqueExplanations,
  uniqueMechanics,
} from '@/lib/atmosphere/domain-detail';
import { computeLifeRisk } from '@/lib/atmosphere/life-risk';
import type { AtmospherePredictiveEventInput, LifeRiskPacket } from '@/lib/atmosphere/types';

describe('domain-strip', () => {
  it('maps friction/support to trends', () => {
    expect(domainTrendFromScores(20, 70)).toBe('up');
    expect(domainTrendFromScores(70, 20)).toBe('down');
    expect(domainTrendFromScores(45, 45)).toBe('flat');
    expect(domainTrendFromScores(28, 40)).toBe('up');
  });

  it('builds ordered strip items with user-facing labels', () => {
    const items = buildDomainStripItems({
      domains: [
        {
          name: 'career',
          label: 'Work',
          friction: 70,
          support: 20,
          hitCount: 2,
          hits: [{ label: 'Saturn Square Sun', kind: 'friction' }],
        },
        {
          name: 'love',
          label: 'Bonds',
          friction: 20,
          support: 65,
          hitCount: 1,
          hits: [{ label: 'Jupiter Trine Venus', kind: 'support' }],
        },
        { name: 'money', label: 'Money', friction: 40, support: 40, hitCount: 0 },
      ],
    } as LifeRiskPacket);

    expect(items[0].label).toBe('Relationships');
    expect(items[0].arrow).toBe('▲');
    expect(items.find((i) => i.id === 'career')?.arrow).toBe('▼');
    expect(items.find((i) => i.id === 'money')?.arrow).toBe('▬');
  });

  it('uses overallFriction for risk percent', () => {
    expect(resolveRiskPercent({ overallFriction: 12 } as LifeRiskPacket, 80)).toBe(12);
    expect(resolveRiskPercent(null, 33)).toBe(33);
  });

  it('does not treat weather intensity as the glance-strip friction', () => {
    expect(resolveRiskPercent({ overallFriction: 71 } as LifeRiskPacket, 85)).toBe(71);
  });

  it('keeps a support-led domain blue even when another area is tight', () => {
    const items = buildDomainStripItems({
      domains: [
        {
          name: 'love',
          label: 'Bonds',
          friction: 70,
          support: 18,
          hitCount: 3,
          hits: [{ label: 'Uranus Square Venus', kind: 'friction' }],
        },
        {
          name: 'career',
          label: 'Work',
          friction: 22,
          support: 48,
          hitCount: 1,
          hits: [{ label: 'Jupiter Trine Midheaven', kind: 'support' }],
        },
        { name: 'money', label: 'Money', friction: 12, support: 10, hitCount: 0 },
      ],
    } as LifeRiskPacket);
    expect(items.find((i) => i.id === 'love')?.trend).toBe('down');
    expect(items.find((i) => i.id === 'career')?.trend).toBe('up');
  });

  it('does not paint finances tight when no named transit can be shown', () => {
    const packet = {
      domains: [{ name: 'money', label: 'Money', friction: 70, support: 10, hitCount: 2 }],
    } as LifeRiskPacket;
    expect(buildDomainStripItems(packet, { includeQuiet: false })).toHaveLength(0);
    expect(buildDomainStripItems(packet, { includeQuiet: true }).find((i) => i.id === 'money')?.trend).toBe(
      'flat',
    );
  });

  it('lists the money transit that scored a tight finances chip, even when louder windows crowd it out', () => {
    const loudSelf: AtmospherePredictiveEventInput[] = Array.from({ length: 16 }, (_, i) => ({
      eventId: `loud-self-${i}`,
      scores: { intensity: 92, confidence: 0.85, volatility: 40 },
      transit: { transitingPlanet: 'Mars', aspect: 'Square', natalPlanet: 'Sun' },
      timing: { phase: 'peaking', daysToPeak: 0, peakAt: `2026-09-07T${String(i).padStart(2, '0')}:00:00` },
      domains: [{ name: 'self', impact: 90, valence: -0.85 }],
    }));
    const risk = computeLifeRisk({
      date: '2026-09-07',
      predictive: {
        events: [
          ...loudSelf,
          {
            eventId: 'sat-sq-venus-money',
            scores: { intensity: 68, confidence: 0.7, volatility: 18 },
            transit: { transitingPlanet: 'Saturn', aspect: 'Square', natalPlanet: 'Venus' },
            timing: { phase: 'peaking', daysToPeak: 0, peakAt: '2026-09-07T08:00:00' },
            domains: [{ name: 'money', impact: 74, valence: -0.7 }],
            narrative: { risk: 'A money conversation is asking for more than you want to give today.' },
          },
        ],
      },
    });

    const money = risk.domains.find((d) => d.name === 'money');
    expect(money?.friction).toBeGreaterThanOrEqual(48);
    expect(money?.hits?.some((hit) => /saturn/i.test(hit.label))).toBe(true);
    expect(risk.frictionWindows.some((window) => window.domains.includes('money'))).toBe(false);

    const items = buildDomainStripItems(risk, { includeQuiet: false });
    expect(items.find((i) => i.id === 'money')?.trend).toBe('down');

    const hits = domainHitsFromRisk(risk, 'money');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => /saturn/i.test(hit.label))).toBe(true);
    expect(hits.map((hit) => hit.explanation).join(' ')).toMatch(/money/i);

    const detail = buildDomainDetailPayload(risk, items.find((i) => i.id === 'money')!);
    expect(detail.pressure).toBeGreaterThanOrEqual(48);
    expect(detail.hits.length).toBeGreaterThan(0);
    expect(detail.hits.map((hit) => hit.explanation).join(' ')).toMatch(/money conversation|tightening money/i);
  });

  it('dedupes the same transit listed as window and driver', () => {
    const hits = domainHitsFromRisk(
      {
        frictionWindows: [
          {
            id: 'w1',
            kind: 'friction',
            label: 'Uranus Square Venus',
            friction: 70,
            confidence: 70,
            domains: ['love'],
            source: 'transit',
          },
          {
            id: 'w2',
            kind: 'friction',
            label: 'Uranus square natal Venus',
            friction: 68,
            confidence: 70,
            domains: ['love'],
            source: 'storm',
          },
        ],
        topDrivers: [
          {
            label: 'Uranus Square Venus',
            friction: 70,
            kind: 'friction',
            domains: ['love'],
            source: 'transit',
          },
        ],
      } as LifeRiskPacket,
      'love',
    );
    expect(hits).toHaveLength(1);
    expect(uniqueExplanations(hits)).toHaveLength(1);
    expect(uniqueMechanics(hits)).toHaveLength(1);
  });

  it('builds time-of-day greeting', () => {
    const morning = new Date('2026-08-05T09:00:00');
    expect(timeOfDayGreeting(morning)).toBe('morning');
    expect(buildPersonalGreeting('Kao', morning)).toBe('Good morning, Kao');
    expect(buildPersonalGreeting(null, morning)).toBe('Good morning');
  });
});
