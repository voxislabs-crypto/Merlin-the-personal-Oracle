/**
 * Prisma / DB error helpers for serverless.
 * On Vercel, SQLite file:./dev.db cannot open (Error code 14) — treat as unavailable
 * so chart/weather/oracle can still run without persistence.
 */

function errorText(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error) {
    const anyErr = error as Error & { code?: string; meta?: unknown; cause?: unknown };
    const parts = [anyErr.name, anyErr.message, anyErr.code, String(anyErr.meta ?? '')];
    if (anyErr.cause) parts.push(errorText(anyErr.cause));
    return parts.join(' ');
  }
  if (typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

export function isPrismaMissingTableError(error: unknown): boolean {
  const message = errorText(error);
  return (
    message.includes('does not exist in the current database') ||
    message.includes('no such table') ||
    message.includes('P2021') ||
    message.includes('P1014')
  );
}

export function isPrismaDelegateUnavailableError(error: unknown): boolean {
  const message = errorText(error);
  return (
    message.includes("reading 'findMany'") ||
    message.includes("reading 'deleteMany'") ||
    message.includes("reading 'createMany'") ||
    message.includes("reading 'upsert'") ||
    message.includes("reading 'findUnique'") ||
    message.includes("reading 'create'")
  );
}

/** SQLite can't open on Vercel, connection refused, missing DATABASE_URL, etc. */
export function isPrismaConnectionError(error: unknown): boolean {
  const message = errorText(error).toLowerCase();
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code || '')
      : '';

  if (['P1001', 'P1003', 'P1017', 'P1000', 'P1010', 'P2010', 'P2024'].includes(code)) {
    return true;
  }

  return (
    message.includes('unable to open the database file') ||
    message.includes('error code 14') ||
    message.includes('sqlite_cantopen') ||
    message.includes('p1001') ||
    message.includes('p1003') ||
    message.includes('p1017') ||
    message.includes("can't reach database server") ||
    message.includes('connection refused') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('database `dev.db` does not exist') ||
    message.includes('no such file or directory') ||
    message.includes('readonly database') ||
    message.includes('attempt to write a readonly database') ||
    message.includes('the url must start with the protocol `file:`') ||
    message.includes('error validating datasource') ||
    message.includes('error querying the database') ||
    message.includes('invalid `prisma.') ||
    message.includes('timed out fetching a new connection')
  );
}

export function isPrismaStoreUnavailableError(error: unknown): boolean {
  return (
    isPrismaMissingTableError(error) ||
    isPrismaDelegateUnavailableError(error) ||
    isPrismaConnectionError(error)
  );
}
