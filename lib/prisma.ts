import 'server-only';

import { PrismaClient } from '@prisma/client';

// Prisma schema requires DATABASE_URL. Local: file SQLite. Vercel: must be Postgres (Neon)
// or an ephemeral path — SQLite under /tmp is not durable and many APIs soft-fail without DB.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.VERCEL
    ? 'file:/tmp/merlin-ephemeral.db'
    : 'file:./dev.db';
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

type PrismaDelegate = {
  findMany?: (...args: unknown[]) => Promise<unknown>;
  findUnique?: (...args: unknown[]) => Promise<unknown>;
  create?: (...args: unknown[]) => Promise<unknown>;
  deleteMany?: (...args: unknown[]) => Promise<unknown>;
  createMany?: (...args: unknown[]) => Promise<unknown>;
};

export function hasPrismaDelegate(delegateName: string): boolean {
  const delegate = (prisma as unknown as Record<string, PrismaDelegate | undefined>)[delegateName];
  return (
    typeof delegate?.findMany === 'function' ||
    typeof delegate?.findUnique === 'function' ||
    typeof delegate?.create === 'function'
  );
}

export function hasAtmospherePatternStore(): boolean {
  return hasPrismaDelegate('atmospherePatternRecord');
}

export function hasResonanceStore(): boolean {
  return hasPrismaDelegate('resonanceFeedbackRecord');
}