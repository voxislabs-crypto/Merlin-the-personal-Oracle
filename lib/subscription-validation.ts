import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

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
  const user = await currentUser();
  
  if (!user) {
    // Development: Allow access to test all features
    // In production with payment, this would be 'free'
    const isDev = process.env.NODE_ENV === 'development';
    return isDev ? 'trial' : 'free';
  }

  const tier = user.publicMetadata?.tier as SubscriptionTier | undefined;
  const subscriptionStatus = user.publicMetadata?.subscriptionStatus as string | undefined;

  // Map subscription status to tier if tier not explicitly set
  if (!tier && subscriptionStatus) {
    switch (subscriptionStatus) {
      case 'trialing':
        return 'trial';
      case 'active':
        return 'monthly'; // Default paid tier
      case 'lifetime':
        return 'lifetime';
      default:
        return 'free';
    }
  }

  return tier || 'free';
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
