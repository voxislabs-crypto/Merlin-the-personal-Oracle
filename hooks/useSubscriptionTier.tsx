'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchSubscriptionTier,
  readCachedSubscriptionTier,
  type SubscriptionTierSnapshot,
} from '@/lib/subscription-tier-client';
import { resolveTierFromMetadata, type SubscriptionTier } from '@/lib/subscription-tier';

type ClerkUser = {
  id: string;
  reload?: () => Promise<void>;
  publicMetadata?: Record<string, unknown>;
  unsafeMetadata?: Record<string, unknown>;
};

type ClientFeatureFlags = {
  premiumInsights: boolean;
  persistenceEnabled: boolean;
};

function resolveClientTier(user: ClerkUser | null | undefined): SubscriptionTier {
  if (!user) {
    return process.env.NODE_ENV === 'development' ? 'trial' : 'free';
  }

  const clientUser = user as unknown as {
    publicMetadata?: Record<string, unknown>;
    unsafeMetadata?: Record<string, unknown>;
  };

  return resolveTierFromMetadata([clientUser.publicMetadata, clientUser.unsafeMetadata], 'free');
}

function getClientFeatureFlags(tier: SubscriptionTier): ClientFeatureFlags {
  if (tier === 'free') {
    return {
      premiumInsights: false,
      persistenceEnabled: false,
    };
  }

  return {
    premiumInsights: true,
    persistenceEnabled: true,
  };
}

function pickHigherTier(a: SubscriptionTier, b: SubscriptionTier): SubscriptionTier {
  const rank: Record<SubscriptionTier, number> = {
    free: 0,
    trial: 1,
    monthly: 2,
    lifetime: 3,
  };
  return rank[a] >= rank[b] ? a : b;
}

function snapshotToFlags(snapshot: SubscriptionTierSnapshot): ClientFeatureFlags {
  return {
    premiumInsights: snapshot.premiumInsights,
    persistenceEnabled: snapshot.premiumInsights,
  };
}

export function useSubscriptionTier(user: ClerkUser | null | undefined, isLoaded: boolean) {
  const userId = user?.id;
  const cachedSnapshot = userId ? readCachedSubscriptionTier(userId) : null;

  const [serverTier, setServerTier] = useState<SubscriptionTier | null>(cachedSnapshot?.tier ?? null);
  const [serverPremiumInsights, setServerPremiumInsights] = useState<boolean | null>(
    cachedSnapshot?.premiumInsights ?? null
  );
  const [tierResolved, setTierResolved] = useState(Boolean(cachedSnapshot));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const applySnapshot = useCallback((snapshot: SubscriptionTierSnapshot) => {
    setServerTier(snapshot.tier);
    setServerPremiumInsights(snapshot.premiumInsights);
    setTierResolved(true);
    setError(null);
  }, []);

  const refreshTier = useCallback(
    async (options?: { reloadUser?: boolean; force?: boolean }) => {
      const currentUser = userRef.current;
      const activeUserId = currentUser?.id;

      if (!activeUserId) {
        return null;
      }

      if (!options?.force) {
        const cached = readCachedSubscriptionTier(activeUserId);
        if (cached) {
          applySnapshot(cached);
          return cached.tier;
        }
      }

      setLoading(true);
      setError(null);

      try {
        if (options?.reloadUser && typeof currentUser.reload === 'function') {
          try {
            await currentUser.reload();
          } catch (reloadError) {
            console.warn('[Subscription] Clerk user reload failed:', reloadError);
          }
        }

        const snapshot = await fetchSubscriptionTier(activeUserId, { force: options?.force });
        applySnapshot(snapshot);

        if (options?.reloadUser && snapshot.tier !== 'free' && typeof currentUser.reload === 'function') {
          try {
            await currentUser.reload();
          } catch (reloadError) {
            console.warn('[Subscription] Clerk session reload failed:', reloadError);
          }
        }

        return snapshot.tier;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load subscription tier';
        setError(message);
        setTierResolved(true);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [applySnapshot]
  );

  useEffect(() => {
    if (!isLoaded || !userId) return;

    const cached = readCachedSubscriptionTier(userId);
    if (cached) {
      applySnapshot(cached);
      return;
    }

    void refreshTier();
  }, [applySnapshot, isLoaded, refreshTier, userId]);

  const clientTier = useMemo(() => resolveClientTier(user), [user]);
  const tier = useMemo(() => {
    if (serverTier) {
      return pickHigherTier(serverTier, clientTier);
    }
    return clientTier;
  }, [clientTier, serverTier]);

  const featureFlags = useMemo(() => {
    if (serverPremiumInsights !== null && serverTier) {
      return snapshotToFlags({
        tier: serverTier,
        premiumInsights: serverPremiumInsights || tier !== 'free',
      });
    }
    return getClientFeatureFlags(tier);
  }, [serverPremiumInsights, serverTier, tier]);

  const premiumLocked = tierResolved ? !featureFlags.premiumInsights : !featureFlags.premiumInsights && tier === 'free';

  const manualRefreshTier = useCallback(() => refreshTier({ reloadUser: true, force: true }), [refreshTier]);

  return {
    tier,
    clientTier,
    serverTier,
    featureFlags,
    premiumLocked,
    loading,
    error,
    tierResolved,
    refreshTier: manualRefreshTier,
  };
}