/** @jest-environment node */

import {
  isPrismaDelegateUnavailableError,
  isPrismaMissingTableError,
  isPrismaStoreUnavailableError,
} from '@/lib/prisma-errors';

describe('prisma-errors', () => {
  it('detects missing table errors', () => {
    expect(
      isPrismaMissingTableError(new Error('Table `AtmospherePatternRecord` does not exist in the current database'))
    ).toBe(true);
    expect(isPrismaMissingTableError(new Error('no such table: AtmospherePatternRecord'))).toBe(true);
  });

  it('detects stale Prisma delegate errors', () => {
    const error = new Error("Cannot read properties of undefined (reading 'findMany')");
    expect(isPrismaDelegateUnavailableError(error)).toBe(true);
    expect(isPrismaStoreUnavailableError(error)).toBe(true);
  });
});