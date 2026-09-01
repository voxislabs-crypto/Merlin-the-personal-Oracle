import 'server-only';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { getUserTier, type SubscriptionTier } from '@/lib/subscription-validation';

/**
 * Cap on *distinct natal fingerprints* per account — not on engine reruns.
 * Rebuilding the same birth date/time/place is free (fresh browser, typo-fix rerun).
 * A new person on the same login consumes a slot.
 */
export const MAX_CHARTS_PER_ACCOUNT = 3;

export type ChartQuotaCode = 'CHART_QUOTA_EXCEEDED' | 'CHART_AUTH_REQUIRED';

export type ChartQuotaStatus = {
  allowed: boolean;
  /** True when this request is the same natal already on the account (no slot used). */
  rebuildOwn?: boolean;
  /** True when a legacy count-lock is being converted into a fingerprint claim. */
  claimedLegacy?: boolean;
  tier: SubscriptionTier;
  limit: number;
  used: number;
  remaining: number;
  code?: ChartQuotaCode;
  error?: string;
};

export type StoredQuota = {
  count: number;
  fingerprints: string[];
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

export function natalFingerprintFromInput(input: {
  birthDate?: string | null;
  birthTime?: string | null;
  lat?: number | null;
  lon?: number | null;
}): string {
  const date = (input.birthDate || '').trim().slice(0, 10);
  const time = (input.birthTime || '').trim().slice(0, 5);
  const lat = typeof input.lat === 'number' && Number.isFinite(input.lat) ? input.lat.toFixed(3) : '';
  const lon = typeof input.lon === 'number' && Number.isFinite(input.lon) ? input.lon.toFixed(3) : '';
  if (!date) return '';
  return `${date}|${time}|${lat}|${lon}`;
}

export function normalizeQuota(stored: StoredQuota | null | undefined): StoredQuota {
  if (!stored) return { count: 0, fingerprints: [] };
  const fingerprints = Array.isArray(stored.fingerprints)
    ? stored.fingerprints.map((value) => String(value).trim()).filter(Boolean)
    : [];
  const unique = Array.from(new Set(fingerprints));
  const count = Math.max(unique.length, Math.max(0, Math.floor(stored.count) || 0));
  return { count, fingerprints: unique };
}

export type ChartQuotaDecision = {
  allowed: boolean;
  consume: boolean;
  rebuildOwn: boolean;
  claimedLegacy: boolean;
  next: StoredQuota;
  code?: ChartQuotaCode;
  error?: string;
};

/**
 * Pure quota decision — unique natals consume a slot; same natal is free.
 * Legacy accounts that hit the old "every calculate counts" cap with no
 * fingerprints can claim the next natal as theirs without staying locked.
 */
export function decideChartQuotaAction(
  stored: StoredQuota,
  fingerprint: string,
  limit = MAX_CHARTS_PER_ACCOUNT,
): ChartQuotaDecision {
  const current = normalizeQuota(stored);
  const fp = (fingerprint || '').trim();

  if (!fp) {
    return {
      allowed: false,
      consume: false,
      rebuildOwn: false,
      claimedLegacy: false,
      next: current,
      code: 'CHART_QUOTA_EXCEEDED',
      error: 'Birth date is required to build a chart.',
    };
  }

  if (current.fingerprints.includes(fp)) {
    return {
      allowed: true,
      consume: false,
      rebuildOwn: true,
      claimedLegacy: false,
      next: current,
    };
  }

  if (current.fingerprints.length === 0 && current.count >= limit) {
    return {
      allowed: true,
      consume: false,
      rebuildOwn: true,
      claimedLegacy: true,
      next: { count: 1, fingerprints: [fp] },
    };
  }

  if (current.fingerprints.length >= limit || current.count >= limit) {
    return {
      allowed: false,
      consume: false,
      rebuildOwn: false,
      claimedLegacy: false,
      next: current,
      code: 'CHART_QUOTA_EXCEEDED',
      error: `This account already has ${limit} unique natal charts. Rebuilding your own chart is free — a different birth date uses a new slot. Contact support for a legitimate correction.`,
    };
  }

  const fingerprints = [...current.fingerprints, fp];
  return {
    allowed: true,
    consume: true,
    rebuildOwn: false,
    claimedLegacy: false,
    next: { count: fingerprints.length, fingerprints },
  };
}

async function readClerkQuota(userId: string): Promise<StoredQuota | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = (user.privateMetadata || {}) as Record<string, unknown>;
    const raw = meta.chartQuota;
    if (!raw || typeof raw !== 'object') return null;

    const record = raw as Record<string, unknown>;
    const count = typeof record.count === 'number' ? record.count : 0;
    const fingerprints = Array.isArray(record.fingerprints)
      ? record.fingerprints.map((value) => String(value))
      : [];
    return { count, fingerprints };
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
        fingerprints: quota.fingerprints,
        limit: MAX_CHARTS_PER_ACCOUNT,
        updatedAt: new Date().toISOString(),
      },
    };
    await client.users.updateUser(userId, { privateMetadata });
  } catch (error) {
    console.warn('[ChartQuota] Clerk write failed:', error);
  }
}

async function resolveStoredQuota(userId: string): Promise<StoredQuota> {
  const mem = normalizeQuota(memoryStore().get(userId));
  const clerk = normalizeQuota(await readClerkQuota(userId));
  const fingerprints = Array.from(new Set([...mem.fingerprints, ...clerk.fingerprints]));
  const count = Math.max(mem.count, clerk.count, fingerprints.length);
  const merged = { count, fingerprints };
  memoryStore().set(userId, merged);
  return merged;
}

function statusFromStored(
  stored: StoredQuota,
  tier: SubscriptionTier,
  extras?: Partial<ChartQuotaStatus>,
): ChartQuotaStatus {
  const limit = MAX_CHARTS_PER_ACCOUNT;
  const unique = stored.fingerprints.length;
  const used = unique || stored.count;
  const remaining = Math.max(0, limit - unique);
  const rebuildOwn = unique > 0 || stored.count > 0;
  return {
    allowed: true,
    rebuildOwn,
    tier,
    limit,
    used,
    remaining,
    ...extras,
  };
}

/**
 * Read-only snapshot (does not consume a calculation).
 * remaining = new unique natal slots. Rebuild of an existing natal is always allowed.
 */
export async function getChartQuotaStatus(): Promise<ChartQuotaStatus> {
  const tier = await getUserTier();
  const { userId } = await auth();
  const limit = MAX_CHARTS_PER_ACCOUNT;

  if (!userId) {
    return {
      allowed: false,
      rebuildOwn: false,
      tier,
      limit,
      used: 0,
      remaining: 0,
      code: 'CHART_AUTH_REQUIRED',
      error: 'Sign in to calculate a birth chart.',
    };
  }

  const stored = await resolveStoredQuota(userId);
  return statusFromStored(stored, tier);
}

/**
 * Check + maybe consume a unique-natal slot.
 * Same fingerprint is free. Synastry callers should skip this and use getChartQuotaStatus.
 */
export async function consumeChartQuota(fingerprint: string): Promise<ChartQuotaStatus> {
  const tier = await getUserTier();
  const { userId } = await auth();
  const limit = MAX_CHARTS_PER_ACCOUNT;

  if (!userId) {
    return {
      allowed: false,
      rebuildOwn: false,
      tier,
      limit,
      used: 0,
      remaining: 0,
      code: 'CHART_AUTH_REQUIRED',
      error: 'Sign in to calculate a birth chart.',
    };
  }

  const stored = await resolveStoredQuota(userId);
  const decision = decideChartQuotaAction(stored, fingerprint, limit);
  if (!decision.allowed) {
    return {
      allowed: false,
      rebuildOwn: false,
      claimedLegacy: false,
      tier,
      limit,
      used: stored.fingerprints.length || stored.count,
      remaining: 0,
      code: decision.code,
      error: decision.error,
    };
  }

  memoryStore().set(userId, decision.next);
  await writeClerkQuota(userId, decision.next);

  return statusFromStored(decision.next, tier, {
    rebuildOwn: decision.rebuildOwn,
    claimedLegacy: decision.claimedLegacy,
  });
}

export async function resetChartQuota(userId: string): Promise<StoredQuota> {
  const empty = { count: 0, fingerprints: [] as string[] };
  memoryStore().set(userId, empty);
  await writeClerkQuota(userId, empty);
  return empty;
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
        rebuildOwn: status.rebuildOwn === true,
      },
    },
    status: httpStatus,
  };
}
