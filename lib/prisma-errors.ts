export function isPrismaMissingTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('does not exist in the current database') ||
    error.message.includes('no such table')
  );
}