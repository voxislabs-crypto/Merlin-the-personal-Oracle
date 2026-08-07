/** @jest-environment node */

import { FREE_ORACLE_MESSAGES_PER_DAY, oracleQuotaDayKey } from '@/lib/oracle-quota';

// getOracleQuotaStatus / consumeOracleQuota need Clerk — unit-test pure helpers only.
describe('oracle-quota helpers', () => {
  it('exports a tight free daily cap', () => {
    expect(FREE_ORACLE_MESSAGES_PER_DAY).toBe(3);
  });

  it('uses UTC YYYY-MM-DD day keys', () => {
    const fixed = new Date('2026-08-06T23:30:00.000Z');
    expect(oracleQuotaDayKey(fixed)).toBe('2026-08-06');
  });
});
