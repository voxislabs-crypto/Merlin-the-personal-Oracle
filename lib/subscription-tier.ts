export type SubscriptionTier = 'free' | 'trial' | 'monthly' | 'lifetime';

type MetadataLike = Record<string, unknown> | null | undefined;

const VALID_TIERS: SubscriptionTier[] = ['free', 'trial', 'monthly', 'lifetime'];

function asTier(value: unknown): SubscriptionTier | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  if (['premium', 'pro', 'paid', 'annual', 'yearly'].includes(normalized)) {
    return 'monthly';
  }
  return (VALID_TIERS as string[]).includes(normalized) ? (normalized as SubscriptionTier) : null;
}

function normalizeStatus(value: unknown): string | null {
  return typeof value === 'string' ? value.toLowerCase() : null;
}

function tierFromStatus(status: string | null): SubscriptionTier | null {
  if (!status) return null;
  if (status === 'lifetime') return 'lifetime';
  if (status === 'trialing') return 'trial';
  if (status === 'active') return 'monthly';
  if (['past_due', 'unpaid', 'paused'].includes(status)) return 'monthly';
  return null;
}

function inferFromMetadata(meta: MetadataLike): SubscriptionTier | null {
  if (!meta) return null;

  const directTier =
    asTier(meta.tier) ||
    asTier(meta.subscriptionTier) ||
    asTier(meta.plan) ||
    asTier(meta.subscriptionPlan);
  if (directTier) return directTier;

  const fromStatus = tierFromStatus(normalizeStatus(meta.subscriptionStatus));
  if (fromStatus) return fromStatus;

  const isPremium =
    meta.isPremium === true ||
    meta.premium === true ||
    meta.isPaid === true ||
    meta.paid === true;
  if (isPremium) return 'monthly';

  const subscriptionId = typeof meta.subscriptionId === 'string' ? meta.subscriptionId : null;
  const status = normalizeStatus(meta.subscriptionStatus);
  if (subscriptionId && status && !['canceled', 'cancelled', 'incomplete_expired'].includes(status)) {
    return status === 'lifetime' ? 'lifetime' : 'monthly';
  }

  return null;
}

export function resolveTierFromMetadata(
  metadataCandidates: MetadataLike[],
  fallback: SubscriptionTier = 'free'
): SubscriptionTier {
  for (const candidate of metadataCandidates) {
    const tier = inferFromMetadata(candidate);
    if (tier) return tier;
  }
  return fallback;
}
