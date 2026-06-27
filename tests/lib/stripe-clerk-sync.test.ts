/** @jest-environment node */

import {
  buildCheckoutCompletedMetadata,
  buildSubscriptionDeletedMetadata,
  buildSubscriptionSyncMetadata,
  tierFromStripeSubscriptionStatus,
} from '@/lib/stripe-clerk-sync';

describe('tierFromStripeSubscriptionStatus', () => {
  it('maps trialing to trial', () => {
    expect(tierFromStripeSubscriptionStatus('trialing')).toBe('trial');
  });

  it('maps active and past_due to monthly', () => {
    expect(tierFromStripeSubscriptionStatus('active')).toBe('monthly');
    expect(tierFromStripeSubscriptionStatus('past_due')).toBe('monthly');
  });

  it('maps canceled to free', () => {
    expect(tierFromStripeSubscriptionStatus('canceled')).toBe('free');
  });
});

describe('buildCheckoutCompletedMetadata', () => {
  it('grants lifetime for one-time checkout', () => {
    const patch = buildCheckoutCompletedMetadata({
      id: 'cs_test',
      metadata: { userId: 'user_1', tier: 'lifetime' },
      customer: 'cus_1',
      subscription: null,
    } as any);

    expect(patch.tier).toBe('lifetime');
    expect(patch.subscriptionStatus).toBe('lifetime');
    expect(patch.hasTrial).toBe(false);
  });

  it('starts trial tier for subscription checkout', () => {
    const patch = buildCheckoutCompletedMetadata({
      id: 'cs_test',
      metadata: { userId: 'user_1', tier: 'monthly' },
      customer: 'cus_1',
      subscription: 'sub_1',
    } as any);

    expect(patch.tier).toBe('trial');
    expect(patch.subscriptionStatus).toBe('trialing');
    expect(patch.hasTrial).toBe(true);
  });
});

describe('buildSubscriptionSyncMetadata', () => {
  it('downgrades tier on cancellation', () => {
    const patch = buildSubscriptionSyncMetadata({
      id: 'sub_1',
      status: 'canceled',
      trial_end: null,
      current_period_end: 123,
      cancel_at_period_end: false,
    } as any);

    expect(patch.tier).toBe('free');
    expect(patch.hasTrial).toBe(false);
  });

  it('sets trial tier while trialing', () => {
    const patch = buildSubscriptionSyncMetadata({
      id: 'sub_1',
      status: 'trialing',
      trial_end: 999,
      current_period_end: 123,
      cancel_at_period_end: false,
    } as any);

    expect(patch.tier).toBe('trial');
    expect(patch.hasTrial).toBe(true);
  });
});

describe('buildSubscriptionDeletedMetadata', () => {
  it('revokes premium access', () => {
    expect(buildSubscriptionDeletedMetadata()).toEqual(
      expect.objectContaining({
        tier: 'free',
        subscriptionStatus: 'canceled',
        hasTrial: false,
        subscriptionId: null,
      })
    );
  });
});