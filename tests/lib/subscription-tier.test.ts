/** @jest-environment node */

import { resolveTierFromMetadata } from '@/lib/subscription-tier';

describe('resolveTierFromMetadata', () => {
  it('returns lifetime for lifetime metadata', () => {
    expect(resolveTierFromMetadata([{ tier: 'lifetime', subscriptionStatus: 'lifetime' }])).toBe(
      'lifetime'
    );
  });

  it('returns trial for trialing status', () => {
    expect(resolveTierFromMetadata([{ subscriptionStatus: 'trialing' }])).toBe('trial');
  });

  it('returns monthly for active subscription status', () => {
    expect(resolveTierFromMetadata([{ subscriptionStatus: 'active' }])).toBe('monthly');
  });

  it('returns free when subscription is canceled even if tier is stale monthly', () => {
    expect(
      resolveTierFromMetadata([
        {
          tier: 'monthly',
          subscriptionStatus: 'canceled',
          subscriptionId: null,
        },
      ])
    ).toBe('free');
  });

  it('returns free when subscription is cancelled (UK spelling)', () => {
    expect(
      resolveTierFromMetadata([
        {
          tier: 'monthly',
          subscriptionStatus: 'cancelled',
        },
      ])
    ).toBe('free');
  });

  it('keeps lifetime when canceled status is not set but tier is lifetime', () => {
    expect(resolveTierFromMetadata([{ tier: 'lifetime' }])).toBe('lifetime');
  });

  it('maps premium alias to monthly when subscription is active', () => {
    expect(
      resolveTierFromMetadata([
        {
          tier: 'premium',
          subscriptionStatus: 'active',
          subscriptionId: 'sub_123',
        },
      ])
    ).toBe('monthly');
  });

  it('falls back to free when metadata is empty', () => {
    expect(resolveTierFromMetadata([{}])).toBe('free');
  });
});