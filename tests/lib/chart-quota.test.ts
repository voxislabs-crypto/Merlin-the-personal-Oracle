/** @jest-environment node */

import { MAX_CHARTS_PER_ACCOUNT } from '@/lib/chart-quota';

describe('chart-quota helpers', () => {
  it('exports a lifetime 3-build cap per account', () => {
    expect(MAX_CHARTS_PER_ACCOUNT).toBe(3);
  });
});
