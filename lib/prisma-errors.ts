export function isPrismaMissingTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('does not exist in the current database') ||
    error.message.includes('no such table') ||
    error.message.includes('P2021') ||
    error.message.includes('P1014')
  );
}

export function isPrismaDelegateUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("reading 'findMany'") ||
    error.message.includes("reading 'deleteMany'") ||
    error.message.includes("reading 'createMany'") ||
    error.message.includes("reading 'upsert'")
  );
}

export function isPrismaStoreUnavailableError(error: unknown): boolean {
  return isPrismaMissingTableError(error) || isPrismaDelegateUnavailableError(error);
}