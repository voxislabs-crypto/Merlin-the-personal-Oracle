/** @jest-environment node */

import {
  MAX_CHARTS_PER_ACCOUNT,
  decideChartQuotaAction,
  natalFingerprintFromInput,
} from '@/lib/chart-quota';

describe('chart-quota helpers', () => {
  it('exports a lifetime 3 unique-natal cap per account', () => {
    expect(MAX_CHARTS_PER_ACCOUNT).toBe(3);
  });

  it('fingerprints date, time, and rounded coordinates', () => {
    expect(
      natalFingerprintFromInput({
        birthDate: '1983-08-14',
        birthTime: '12:21',
        lat: 36.8509,
        lon: -76.2859,
      }),
    ).toBe('1983-08-14|12:21|36.851|-76.286');
  });

  it('lets the first natal consume a slot', () => {
    const decision = decideChartQuotaAction({ count: 0, fingerprints: [] }, '1983-08-14|12:21|36.851|-76.286');
    expect(decision.allowed).toBe(true);
    expect(decision.consume).toBe(true);
    expect(decision.next.fingerprints).toEqual(['1983-08-14|12:21|36.851|-76.286']);
  });

  it('rebuilds the same natal for free', () => {
    const fp = '1983-08-14|12:21|36.851|-76.286';
    const decision = decideChartQuotaAction({ count: 3, fingerprints: [fp] }, fp);
    expect(decision.allowed).toBe(true);
    expect(decision.consume).toBe(false);
    expect(decision.rebuildOwn).toBe(true);
  });

  it('unsticks a legacy count-lock with no fingerprints by claiming this natal', () => {
    const fp = '1983-08-14|12:21|36.851|-76.286';
    const decision = decideChartQuotaAction({ count: 3, fingerprints: [] }, fp);
    expect(decision.allowed).toBe(true);
    expect(decision.claimedLegacy).toBe(true);
    expect(decision.consume).toBe(false);
    expect(decision.next.fingerprints).toEqual([fp]);
    expect(decision.next.count).toBe(1);
  });

  it('still blocks a fourth distinct natal', () => {
    const stored = {
      count: 3,
      fingerprints: ['a|1', 'b|2', 'c|3'],
    };
    const decision = decideChartQuotaAction(stored, 'd|4');
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('CHART_QUOTA_EXCEEDED');
  });
});
