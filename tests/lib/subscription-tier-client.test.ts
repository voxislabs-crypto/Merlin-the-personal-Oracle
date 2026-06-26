/** @jest-environment node */

import {
  clearSubscriptionTierClientCache,
  fetchSubscriptionTier,
  readCachedSubscriptionTier,
} from '@/lib/subscription-tier-client';

describe('subscription-tier-client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearSubscriptionTierClientCache();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('deduplicates concurrent tier requests for the same user', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                text: async () =>
                  JSON.stringify({
                    success: true,
                    tier: 'lifetime',
                    premiumInsights: true,
                  }),
              }),
            20
          );
        })
    );

    const [first, second] = await Promise.all([
      fetchSubscriptionTier('user_123'),
      fetchSubscriptionTier('user_123'),
    ]);

    expect(first).toEqual({ tier: 'lifetime', premiumInsights: true });
    expect(second).toEqual(first);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('serves cached tier without refetching', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          success: true,
          tier: 'trial',
          premiumInsights: true,
        }),
    });

    await fetchSubscriptionTier('user_cached');
    await fetchSubscriptionTier('user_cached');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(readCachedSubscriptionTier('user_cached')).toEqual({
      tier: 'trial',
      premiumInsights: true,
    });
  });
});