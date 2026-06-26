'use client';

import type { SubscriptionTier } from '@/lib/subscription-tier';

export type SubscriptionTierSnapshot = {
  tier: SubscriptionTier;
  premiumInsights: boolean;
};

type TierApiResponse = {
  success?: boolean;
  tier?: SubscriptionTier;
  premiumInsights?: boolean;
  error?: string;
};

const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000;

const tierCache = new Map<string, { snapshot: SubscriptionTierSnapshot; expiresAt: number }>();
const inflightByUser = new Map<string, Promise<SubscriptionTierSnapshot>>();

async function parseTierResponse(response: Response): Promise<TierApiResponse> {
  const raw = await response.text();

  try {
    return JSON.parse(raw) as TierApiResponse;
  } catch {
    throw new Error(
      response.ok
        ? 'Subscription service returned an invalid response.'
        : 'Subscription service is unavailable. Restart the app server or deploy the latest build.'
    );
  }
}

export function readCachedSubscriptionTier(userId: string): SubscriptionTierSnapshot | null {
  const cached = tierCache.get(userId);
  if (!cached || cached.expiresAt <= Date.now()) {
    return null;
  }
  return cached.snapshot;
}

export function clearSubscriptionTierClientCache(userId?: string): void {
  if (userId) {
    tierCache.delete(userId);
    inflightByUser.delete(userId);
    return;
  }

  tierCache.clear();
  inflightByUser.clear();
}

export async function fetchSubscriptionTier(
  userId: string,
  options?: { force?: boolean }
): Promise<SubscriptionTierSnapshot> {
  if (!options?.force) {
    const cached = readCachedSubscriptionTier(userId);
    if (cached) {
      return cached;
    }

    const inflight = inflightByUser.get(userId);
    if (inflight) {
      return inflight;
    }
  } else {
    tierCache.delete(userId);
    inflightByUser.delete(userId);
  }

  const request = (async () => {
    const response = await fetch('/api/subscription/tier', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    const result = await parseTierResponse(response);

    if (!response.ok || !result?.success || !result.tier) {
      throw new Error(result?.error || 'Failed to load subscription tier');
    }

    const snapshot: SubscriptionTierSnapshot = {
      tier: result.tier,
      premiumInsights: result.premiumInsights ?? result.tier !== 'free',
    };

    tierCache.set(userId, {
      snapshot,
      expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
    });

    return snapshot;
  })();

  inflightByUser.set(userId, request);

  try {
    return await request;
  } finally {
    inflightByUser.delete(userId);
  }
}