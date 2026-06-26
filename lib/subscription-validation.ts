import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { isLifetimeGrantedUser } from '@/lib/premium-grants';
import { resolveTierFromMetadata } from '@/lib/subscription-tier';

/**
 * Subscription tier definitions with feature access
 * This is the source of truth for tier capabilities
 */
export interface TierFeatures {
  canCalculateChart: boolean;
  canAccessForecast: boolean;
  canAccessTransits: boolean;
  canAccessInterpretations: boolean;
  canAccessWeeklyForecast: boolean;
  canAccessLifeArc: boolean;
  canAccessPersonality: boolean;
  canAccessGrokNarrative: boolean;
  canAccessSoulReading: boolean;
  canAccessSynastry: boolean;
  maxChartsPerDay: number;
  maxChartsTotal: number;
}

export type SubscriptionTier = 'free' | 'trial' | 'monthly' | 'lifetime';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const ACTIVE_STRIPE_STATUSES = new Set(['trialing', 'active', 'past_due', 'unpaid', 'paused']);
const TIER_CACHE_TTL_MS = 5 * 60 * 1000;
const tierCache = new Map<string, { tier: SubscriptionTier; expiresAt: number }>();

function getCachedTier(userId: string): SubscriptionTier | null {
  const cached = tierCache.get(userId);
  if (!cached || cached.expiresAt <= Date.now()) {
    return null;
  }
  return cached.tier;
}

function setCachedTier(userId: string, tier: SubscriptionTier): void {
  tierCache.set(userId, { tier, expiresAt: Date.now() + TIER_CACHE_TTL_MS });
}

function getPrimaryEmail(user: {
  emailAddresses?: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId?: string | null;
}): string | null {
  if (!user.emailAddresses || user.emailAddresses.length === 0) return null;
  const primary = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId);
  return primary?.emailAddress || user.emailAddresses[0]?.emailAddress || null;
}

async function inferTierFromStripeByEmail(email: string): Promise<SubscriptionTier | null> {
  if (!stripe) return null;

  const customerList = await stripe.customers.list({ email, limit: 3 });
  if (customerList.data.length === 0) return null;

  for (const customer of customerList.data) {
    const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 20 });
    const hasActiveSubscription = subscriptions.data.some((sub) => ACTIVE_STRIPE_STATUSES.has(sub.status));
    if (hasActiveSubscription) {
      return 'monthly';
    }

    const sessions = await stripe.checkout.sessions.list({ customer: customer.id, limit: 20 });
    const paidLifetimeSession = sessions.data.some(
      (session) => session.mode === 'payment' && session.payment_status === 'paid' && session.metadata?.tier === 'lifetime'
    );

    if (paidLifetimeSession) {
      return 'lifetime';
    }
  }

  return null;
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    canCalculateChart: true,
    canAccessForecast: false,
    canAccessTransits: false,
    canAccessInterpretations: false,
    canAccessWeeklyForecast: false,
    canAccessLifeArc: false,
    canAccessPersonality: false,
    canAccessGrokNarrative: false,
    canAccessSoulReading: false,
    canAccessSynastry: false,
    maxChartsPerDay: 1,
    maxChartsTotal: 3,
  },
  trial: {
    canCalculateChart: true,
    canAccessForecast: true,
    canAccessTransits: true,
    canAccessInterpretations: true,
    canAccessWeeklyForecast: true,
    canAccessLifeArc: true,
    canAccessPersonality: true,
    canAccessGrokNarrative: true,
    canAccessSoulReading: true,
    canAccessSynastry: true,
    maxChartsPerDay: 20,
    maxChartsTotal: 100,
  },
  monthly: {
    canCalculateChart: true,
    canAccessForecast: true,
    canAccessTransits: true,
    canAccessInterpretations: true,
    canAccessWeeklyForecast: true,
    canAccessLifeArc: true,
    canAccessPersonality: true,
    canAccessGrokNarrative: true,
    canAccessSoulReading: true,
    canAccessSynastry: true,
    maxChartsPerDay: 50,
    maxChartsTotal: 9999,
  },
  lifetime: {
    canCalculateChart: true,
    canAccessForecast: true,
    canAccessTransits: true,
    canAccessInterpretations: true,
    canAccessWeeklyForecast: true,
    canAccessLifeArc: true,
    canAccessPersonality: true,
    canAccessGrokNarrative: true,
    canAccessSoulReading: true,
    canAccessSynastry: true,
    maxChartsPerDay: 50,
    maxChartsTotal: 9999,
  },
};

/**
 * Get user's subscription tier from Clerk metadata.
 * Signed-out users: trial in development, free in production.
 * Signed-in users without explicit metadata: free.
 */
export async function getUserTier(): Promise<SubscriptionTier> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    // Development: Allow access to test all features
    // In production with payment, this would be 'free'
    const isDev = process.env.NODE_ENV === 'development';
    return isDev ? 'trial' : 'free';
  }

  const cachedTier = getCachedTier(userId);
  if (cachedTier) {
    return cachedTier;
  }

  const claimsTier = resolveTierFromMetadata(
    [
      (sessionClaims?.publicMetadata as Record<string, unknown> | undefined) ?? undefined,
      (sessionClaims?.metadata as Record<string, unknown> | undefined) ?? undefined,
      sessionClaims as Record<string, unknown> | undefined,
    ],
    'free'
  );

  if (claimsTier !== 'free') {
    setCachedTier(userId, claimsTier);
    return claimsTier;
  }

  const emailFromClaims =
    typeof sessionClaims?.email === 'string'
      ? sessionClaims.email
      : typeof sessionClaims?.primary_email_address === 'string'
        ? sessionClaims.primary_email_address
        : null;

  if (isLifetimeGrantedUser(userId, emailFromClaims)) {
    setCachedTier(userId, 'lifetime');
    return 'lifetime';
  }

  if (process.env.NODE_ENV === 'development') {
    setCachedTier(userId, 'trial');
    return 'trial';
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const serverUser = user as unknown as {
      publicMetadata?: Record<string, unknown>;
      privateMetadata?: Record<string, unknown>;
      unsafeMetadata?: Record<string, unknown>;
      emailAddresses?: Array<{ id: string; emailAddress: string }>;
      primaryEmailAddressId?: string | null;
    };

    const email = getPrimaryEmail(serverUser);

    if (isLifetimeGrantedUser(userId, email)) {
      setCachedTier(userId, 'lifetime');
      return 'lifetime';
    }

    const metadataTier = resolveTierFromMetadata(
      [serverUser.publicMetadata, serverUser.privateMetadata, serverUser.unsafeMetadata],
      'free'
    );

    if (metadataTier !== 'free') {
      setCachedTier(userId, metadataTier);
      return metadataTier;
    }

    if (!email) {
      setCachedTier(userId, metadataTier);
      return metadataTier;
    }

    try {
      const stripeTier = await inferTierFromStripeByEmail(email);
      if (!stripeTier) {
        setCachedTier(userId, metadataTier);
        return metadataTier;
      }

      // Backfill Clerk metadata to avoid repeated Stripe lookups on every request.
      const mergedPublicMetadata = {
        ...(serverUser.publicMetadata || {}),
        tier: stripeTier,
        subscriptionStatus: stripeTier === 'lifetime' ? 'lifetime' : 'active',
        tierSyncedFromStripeAt: Math.floor(Date.now() / 1000),
      };

      await client.users.updateUser(userId, {
        publicMetadata: mergedPublicMetadata,
      });

      setCachedTier(userId, stripeTier);
      return stripeTier;
    } catch (error) {
      console.warn('[Subscription] Stripe fallback tier check failed:', error);
      setCachedTier(userId, metadataTier);
      return metadataTier;
    }
  } catch (error) {
    console.warn('[Subscription] Clerk tier lookup failed:', error);
    if (isLifetimeGrantedUser(userId, emailFromClaims)) {
      setCachedTier(userId, 'lifetime');
      return 'lifetime';
    }
    setCachedTier(userId, 'free');
    return 'free';
  }
}

/**
 * Get feature flags for a specific tier
 */
export function getTierFeatures(tier: SubscriptionTier): TierFeatures {
  return TIER_FEATURES[tier];
}

/**
 * Check if user can access a specific feature
 */
export async function validateFeatureAccess(
  feature: keyof Omit<TierFeatures, 'maxChartsPerDay' | 'maxChartsTotal'>
): Promise<boolean> {
  const tier = await getUserTier();
  const features = getTierFeatures(tier);
  return (features[feature] as boolean) ?? false;
}

/**
 * Check if a specific tier can access a feature
 */
export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof Omit<TierFeatures, 'maxChartsPerDay' | 'maxChartsTotal'>
): boolean {
  const features = getTierFeatures(tier);
  return (features[feature] as boolean) ?? false;
}

/**
 * Create a standard feature not available response
 */
export function createFeatureNotAvailableResponse(
  featureName: string,
  tier: SubscriptionTier
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: `${featureName} is not available on the ${tier} tier`,
      code: 'FEATURE_NOT_AVAILABLE',
      tier,
    },
    { status: 403 }
  );
}
