import 'server-only';

import { clerkClient } from '@clerk/nextjs/server';

type CachedClerkUser = {
  publicMetadata: Record<string, unknown>;
  expiresAt: number;
};

const CACHE_TTL_MS = 2 * 60 * 1000;
const userCache = new Map<string, CachedClerkUser>();

export async function getClerkPublicMetadata(userId: string): Promise<Record<string, unknown>> {
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.publicMetadata;
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const publicMetadata = (user.publicMetadata as Record<string, unknown> | undefined) || {};

    userCache.set(userId, {
      publicMetadata,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return publicMetadata;
  } catch (error) {
    if (cached) {
      return cached.publicMetadata;
    }
    throw error;
  }
}

export async function updateClerkPublicMetadata(
  userId: string,
  publicMetadata: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const client = await clerkClient();
  await client.users.updateUser(userId, { publicMetadata });

  userCache.set(userId, {
    publicMetadata,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return publicMetadata;
}

export function invalidateClerkUserCache(userId: string): void {
  userCache.delete(userId);
}