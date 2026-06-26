import { NextResponse } from 'next/server';
import { getTierFeatures, getUserTier } from '@/lib/subscription-validation';
import type { SubscriptionTier } from '@/lib/subscription-tier';

export async function GET() {
  try {
    const tier: SubscriptionTier = await getUserTier();
    const features = getTierFeatures(tier);
    const premiumInsights = tier !== 'free';

    return NextResponse.json({
      success: true,
      tier,
      premiumInsights,
      features: {
        canAccessForecast: features.canAccessForecast,
        canAccessTransits: features.canAccessTransits,
        canAccessInterpretations: features.canAccessInterpretations,
        canAccessWeeklyForecast: features.canAccessWeeklyForecast,
        canAccessLifeArc: features.canAccessLifeArc,
        canAccessPersonality: features.canAccessPersonality,
        canAccessGrokNarrative: features.canAccessGrokNarrative,
        canAccessSoulReading: features.canAccessSoulReading,
        canAccessSynastry: features.canAccessSynastry,
      },
    });
  } catch (error) {
    console.error('[Subscription] Failed to resolve tier:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve subscription tier',
      },
      { status: 500 }
    );
  }
}