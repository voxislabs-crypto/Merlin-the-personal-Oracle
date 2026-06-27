import { clerkClient } from '@clerk/nextjs/server';
import type Stripe from 'stripe';
import type { SubscriptionTier } from '@/lib/subscription-tier';

const INACTIVE_SUBSCRIPTION_STATUSES = new Set([
  'canceled',
  'cancelled',
  'incomplete_expired',
]);

export function tierFromStripeSubscriptionStatus(
  status: Stripe.Subscription.Status | string | null | undefined
): SubscriptionTier {
  const normalized = typeof status === 'string' ? status.toLowerCase() : null;
  if (!normalized) return 'free';
  if (normalized === 'trialing') return 'trial';
  if (['active', 'past_due', 'unpaid', 'paused'].includes(normalized)) return 'monthly';
  if (INACTIVE_SUBSCRIPTION_STATUSES.has(normalized)) return 'free';
  return 'free';
}

export function isInactiveSubscriptionStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return INACTIVE_SUBSCRIPTION_STATUSES.has(status.toLowerCase());
}

type MetadataPatch = Record<string, unknown>;

export async function mergeClerkPublicMetadata(
  userId: string,
  patch: MetadataPatch
): Promise<void> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const existing = (user.publicMetadata || {}) as Record<string, unknown>;

  await client.users.updateUser(userId, {
    publicMetadata: {
      ...existing,
      ...patch,
    },
  });
}

export function buildCheckoutCompletedMetadata(
  session: Stripe.Checkout.Session
): MetadataPatch {
  const userId = session.metadata?.userId;
  if (!userId) return {};

  const tier = session.metadata?.tier;
  const isLifetime = tier === 'lifetime' || !session.subscription;

  if (isLifetime) {
    return {
      tier: 'lifetime',
      hasTrial: false,
      stripeCustomerId: session.customer,
      subscriptionId: null,
      subscriptionStatus: 'lifetime',
      checkoutSessionId: session.id,
      lifetimeAccessGrantedAt: Math.floor(Date.now() / 1000),
    };
  }

  return {
    tier: 'trial',
    hasTrial: true,
    stripeCustomerId: session.customer,
    subscriptionId: session.subscription,
    subscriptionStatus: 'trialing',
    checkoutSessionId: session.id,
  };
}

export function buildSubscriptionSyncMetadata(
  subscription: Stripe.Subscription
): MetadataPatch {
  const status = subscription.status;
  const tier = tierFromStripeSubscriptionStatus(status);

  const patch: MetadataPatch = {
    tier,
    subscriptionId: subscription.id,
    subscriptionStatus: status,
    trialEnd: subscription.trial_end || null,
    currentPeriodEnd: subscription.current_period_end || null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
  };

  if (status === 'trialing') {
    patch.hasTrial = true;
  } else if (tier === 'free') {
    patch.hasTrial = false;
  }

  return patch;
}

export function buildSubscriptionDeletedMetadata(): MetadataPatch {
  return {
    tier: 'free',
    subscriptionId: null,
    subscriptionStatus: 'canceled',
    canceledAt: Math.floor(Date.now() / 1000),
    hasTrial: false,
  };
}

export function buildPaymentSucceededMetadata(
  subscription: Stripe.Subscription
): MetadataPatch {
  const tier = tierFromStripeSubscriptionStatus(subscription.status);

  return {
    tier: tier === 'free' ? 'monthly' : tier,
    subscriptionStatus: subscription.status === 'trialing' ? 'trialing' : 'active',
    currentPeriodEnd: subscription.current_period_end || null,
    lastPaymentDate: Math.floor(Date.now() / 1000),
  };
}

export function buildPaymentFailedMetadata(invoice: Stripe.Invoice): MetadataPatch {
  return {
    subscriptionStatus: 'past_due',
    lastPaymentAttempt: Math.floor(Date.now() / 1000),
    paymentAttemptCount: invoice.attempt_count || 0,
  };
}