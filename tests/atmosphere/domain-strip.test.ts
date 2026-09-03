import {
  buildDomainStripItems,
  buildPersonalGreeting,
  domainTrendFromScores,
  resolveRiskPercent,
  timeOfDayGreeting,
} from '@/lib/atmosphere/domain-strip';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';

describe('domain-strip', () => {
  it('maps friction/support to trends', () => {
    expect(domainTrendFromScores(20, 70)).toBe('up');
    expect(domainTrendFromScores(70, 20)).toBe('down');
    expect(domainTrendFromScores(45, 45)).toBe('flat');
  });

  it('builds ordered strip items with user-facing labels', () => {
    const items = buildDomainStripItems({
      domains: [
        { name: 'career', label: 'Work', friction: 70, support: 20, hitCount: 2 },
        { name: 'love', label: 'Bonds', friction: 20, support: 65, hitCount: 1 },
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

  it('builds time-of-day greeting', () => {
    const morning = new Date('2026-08-05T09:00:00');
    expect(timeOfDayGreeting(morning)).toBe('morning');
    expect(buildPersonalGreeting('Kao', morning)).toBe('Good morning, Kao');
    expect(buildPersonalGreeting(null, morning)).toBe('Good morning');
  });
});
