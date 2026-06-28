import 'server-only';

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

type PrismaWithOptionalDelegates = PrismaClient & {
  atmospherePatternRecord?: {
    findMany: (...args: unknown[]) => Promise<unknown[]>;
    deleteMany: (...args: unknown[]) => Promise<unknown>;
    createMany: (...args: unknown[]) => Promise<unknown>;
  };
};

export function hasAtmospherePatternStore(): boolean {
  const delegate = (prisma as PrismaWithOptionalDelegates).atmospherePatternRecord;
  return typeof delegate?.findMany === 'function';
}