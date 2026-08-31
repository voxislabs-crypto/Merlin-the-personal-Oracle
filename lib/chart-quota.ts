import 'server-only';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { getUserTier, type SubscriptionTier } from '@/lib/subscription-validation';

/**
 * Hard lifetime cap on birth-chart calculations per account.
 * Stops one login from becoming a household chart factory.
 * Free and paid share this cap: 1 first natal + remaining rerolls.
 */
export const MAX_CHARTS_PER_ACCOUNT = 3;

export type ChartQuotaCode = 'CHART_QUOTA_EXCEEDED' | 'CHART_AUTH_REQUIRED';

export type ChartQuotaStatus = {
  allowed: boolean;
  tier: SubscriptionTier;
  limit: number;
  used: number;
  remaining: number;
  code?: ChartQuotaCode;
  error?: string;
};

type StoredQuota = {
  count: number;
};

type GlobalQuotaStore = {
  __merlinChartQuota?: Map<string, StoredQuota>;
};

function memoryStore(): Map<string, StoredQuota> {
  const g = globalThis as typeof globalThis & GlobalQuotaStore;
  if (!g.__merlinChartQuota) {
    g.__merlinChartQuota = new Map();
  }
  return g.__merlinChartQuota;
}

function normalizeQuota(stored: StoredQuota | null | undefined): StoredQuota {
  if (!stored) return { count: 0 };
  return { count: Math.max(0, Math.floor(stored.count) || 0) };
}

async function readClerkQuota(userId: string): Promise<StoredQuota | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = (user.privateMetadata || {}) as Record<string, unknown>;
    const raw = meta.chartQuota;
    if (!raw || typeof raw !== 'object') return null;

    const record = raw as Record<string, unknown>;
    const count = typeof record.count === 'number' ? record.count : null;
    if (count === null || Number.isNaN(count)) return null;

    return { count };
  } catch (error) {
    console.warn('[ChartQuota] Clerk read failed:', error);
    return null;
  }
}

async function writeClerkQuota(userId: string, quota: StoredQuota): Promise<void> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const privateMetadata = {
      ...((user.privateMetadata as Record<string, unknown> | undefined) || {}),
      chartQuota: {
        count: quota.count,
        limit: MAX_CHARTS_PER_ACCOUNT,
        updatedAt: new Date().toISOString(),
      },
    };
    await client.users.updateUser(userId, { privateMetadata });
  } catch (error) {
    console.warn('[ChartQuota] Clerk write failed:', error);
  }
}

async function resolveUsedCount(userId: string): Promise<number> {
  const mem = normalizeQuota(memoryStore().get(userId));
  const clerk = normalizeQuota(await readClerkQuota(userId));
  const used = Math.max(mem.count, clerk.count);
  memoryStore().set(userId, { count: used });
  return used;
}

/**
 * Read-only snapshot (does not consume a calculation).
 */
export async function getChartQuotaStatus(): Promise<ChartQuotaStatus> {
  const tier = await getUserTier();
  const { userId } = await auth();
  const limit = MAX_CHARTS_PER_ACCOUNT;

  if (!userId) {
    return {
      allowed: false,
      tier,
      limit,
      used: 0,
      remaining: 0,
      code: 'CHART_AUTH_REQUIRED',
      error: 'Sign in to calculate a birth chart.',
    };
  }

  const used = await resolveUsedCount(userId);
  const remaining = Math.max(0, limit - used);

  if (remaining <= 0) {
    return {
      allowed: false,
      tier,
      limit,
      used,
      remaining: 0,
      code: 'CHART_QUOTA_EXCEEDED',
      error: `This account has used all ${limit} chart builds. Contact support if you need a legitimate birth-data correction.`,
    };
  }

  return {
    allowed: true,
    tier,
    limit,
    used,
    remaining,
  };
}

/**
 * Check + consume one chart calculation slot before running the engine.
 */
export async function consumeChartQuota(): Promise<ChartQuotaStatus> {
  const status = await getChartQuotaStatus();
  if (!status.allowed) {
    return status;
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      ...status,
      allowed: false,
      remaining: 0,
      code: 'CHART_AUTH_REQUIRED',
      error: 'Sign in to calculate a birth chart.',
    };
  }

  const usedNow = await resolveUsedCount(userId);
  if (usedNow >= status.limit) {
    return {
      allowed: false,
      tier: status.tier,
      limit: status.limit,
      used: usedNow,
      remaining: 0,
      code: 'CHART_QUOTA_EXCEEDED',
      error: `This account has used all ${status.limit} chart builds. Contact support if you need a legitimate birth-data correction.`,
    };
  }

  const nextCount = usedNow + 1;
  memoryStore().set(userId, { count: nextCount });
  await writeClerkQuota(userId, { count: nextCount });

  return {
    allowed: true,
    tier: status.tier,
    limit: status.limit,
    used: nextCount,
    remaining: Math.max(0, status.limit - nextCount),
  };
}

export function chartQuotaDeniedResponse(status: ChartQuotaStatus) {
  const httpStatus = status.code === 'CHART_AUTH_REQUIRED' ? 401 : 429;
  return {
    body: {
      success: false,
      error: status.error || 'Chart calculation limit reached',
      code: status.code || 'CHART_QUOTA_EXCEEDED',
      quota: {
        tier: status.tier,
        limit: status.limit,
        used: status.used,
        remaining: status.remaining,
      },
    },
    status: httpStatus,
  };
}
