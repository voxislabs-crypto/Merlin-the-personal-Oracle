import 'server-only';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { getUserTier, type SubscriptionTier } from '@/lib/subscription-validation';

/** Free plan hard cap — enough to try Merlin, not enough to burn LLM spend. */
export const FREE_ORACLE_MESSAGES_PER_DAY = 3;

export type OracleQuotaCode = 'ORACLE_QUOTA_EXCEEDED' | 'ORACLE_AUTH_REQUIRED';

export type OracleQuotaStatus = {
  allowed: boolean;
  tier: SubscriptionTier;
  /** null = unlimited (paid) */
  limit: number | null;
  used: number;
  remaining: number | null;
  day: string;
  code?: OracleQuotaCode;
  error?: string;
};

type StoredQuota = {
  day: string;
  count: number;
};

type GlobalQuotaStore = {
  __merlinOracleQuota?: Map<string, StoredQuota>;
};

function memoryStore(): Map<string, StoredQuota> {
  const g = globalThis as typeof globalThis & GlobalQuotaStore;
  if (!g.__merlinOracleQuota) {
    g.__merlinOracleQuota = new Map();
  }
  return g.__merlinOracleQuota;
}

/** UTC calendar day key for consistent daily reset across regions. */
export function oracleQuotaDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function normalizeQuota(stored: StoredQuota | null | undefined, day: string): StoredQuota {
  if (!stored || stored.day !== day) {
    return { day, count: 0 };
  }
  return {
    day: stored.day,
    count: Math.max(0, Math.floor(stored.count) || 0),
  };
}

async function readClerkQuota(userId: string): Promise<StoredQuota | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = (user.privateMetadata || {}) as Record<string, unknown>;
    const raw = meta.oracleQuota;
    if (!raw || typeof raw !== 'object') return null;

    const record = raw as Record<string, unknown>;
    const day = typeof record.day === 'string' ? record.day : null;
    const count = typeof record.count === 'number' ? record.count : null;
    if (!day || count === null || Number.isNaN(count)) return null;

    return { day, count };
  } catch (error) {
    console.warn('[OracleQuota] Clerk read failed:', error);
    return null;
  }
}

async function writeClerkQuota(userId: string, quota: StoredQuota): Promise<void> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const privateMetadata = {
      ...((user.privateMetadata as Record<string, unknown> | undefined) || {}),
      oracleQuota: {
        day: quota.day,
        count: quota.count,
        updatedAt: new Date().toISOString(),
      },
    };
    await client.users.updateUser(userId, { privateMetadata });
  } catch (error) {
    console.warn('[OracleQuota] Clerk write failed:', error);
  }
}

async function resolveUsedCount(userId: string, day: string): Promise<number> {
  const mem = normalizeQuota(memoryStore().get(userId), day);
  const clerk = normalizeQuota(await readClerkQuota(userId), day);
  // Prefer the higher count so multi-instance races can't undercount usage.
  const used = Math.max(mem.count, clerk.count);
  memoryStore().set(userId, { day, count: used });
  return used;
}

function unlimitedStatus(tier: SubscriptionTier, day: string): OracleQuotaStatus {
  return {
    allowed: true,
    tier,
    limit: null,
    used: 0,
    remaining: null,
    day,
  };
}

/**
 * Read-only quota snapshot (does not consume a message).
 */
export async function getOracleQuotaStatus(): Promise<OracleQuotaStatus> {
  const tier = await getUserTier();
  const { userId } = await auth();
  const day = oracleQuotaDayKey();

  if (tier !== 'free') {
    return unlimitedStatus(tier, day);
  }

  if (!userId) {
    return {
      allowed: false,
      tier,
      limit: FREE_ORACLE_MESSAGES_PER_DAY,
      used: 0,
      remaining: 0,
      day,
      code: 'ORACLE_AUTH_REQUIRED',
      error: 'Sign in to use Oracle chat on the free plan.',
    };
  }

  const used = await resolveUsedCount(userId, day);
  const limit = FREE_ORACLE_MESSAGES_PER_DAY;
  const remaining = Math.max(0, limit - used);

  if (remaining <= 0) {
    return {
      allowed: false,
      tier,
      limit,
      used,
      remaining: 0,
      day,
      code: 'ORACLE_QUOTA_EXCEEDED',
      error: `Free plan includes ${limit} Oracle messages per day. Upgrade for unlimited chat.`,
    };
  }

  return {
    allowed: true,
    tier,
    limit,
    used,
    remaining,
    day,
  };
}

/**
 * Atomically check + consume one free Oracle message.
 * Paid tiers always allow without counting.
 */
export async function consumeOracleQuota(): Promise<OracleQuotaStatus> {
  const status = await getOracleQuotaStatus();
  if (!status.allowed) {
    return status;
  }

  // Paid / unlimited
  if (status.limit === null) {
    return status;
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      ...status,
      allowed: false,
      remaining: 0,
      code: 'ORACLE_AUTH_REQUIRED',
      error: 'Sign in to use Oracle chat on the free plan.',
    };
  }

  const day = status.day;
  // Re-resolve right before write to reduce double-spend races.
  const usedNow = await resolveUsedCount(userId, day);
  if (usedNow >= status.limit) {
    return {
      allowed: false,
      tier: status.tier,
      limit: status.limit,
      used: usedNow,
      remaining: 0,
      day,
      code: 'ORACLE_QUOTA_EXCEEDED',
      error: `Free plan includes ${status.limit} Oracle messages per day. Upgrade for unlimited chat.`,
    };
  }

  const nextCount = usedNow + 1;
  const next: StoredQuota = { day, count: nextCount };
  memoryStore().set(userId, next);
  await writeClerkQuota(userId, next);

  return {
    allowed: true,
    tier: status.tier,
    limit: status.limit,
    used: nextCount,
    remaining: Math.max(0, status.limit - nextCount),
    day,
  };
}

export function oracleQuotaDeniedResponse(status: OracleQuotaStatus) {
  const httpStatus = status.code === 'ORACLE_AUTH_REQUIRED' ? 401 : 429;
  return {
    body: {
      success: false,
      error: status.error || 'Oracle message limit reached',
      code: status.code || 'ORACLE_QUOTA_EXCEEDED',
      quota: {
        tier: status.tier,
        limit: status.limit,
        used: status.used,
        remaining: status.remaining,
        day: status.day,
      },
    },
    status: httpStatus,
  };
}
