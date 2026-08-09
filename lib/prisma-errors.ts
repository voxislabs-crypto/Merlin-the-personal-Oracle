/**
 * Prisma / DB error helpers for serverless.
 * On Vercel, SQLite file:./dev.db cannot open (Error code 14) — treat as unavailable
 * so chart/weather/oracle can still run without persistence.
 */

function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name} ${error.message}`;
  return String(error ?? '');
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
    message.includes('the table main.') && message.includes('does not exist')
  );
}

export function isPrismaStoreUnavailableError(error: unknown): boolean {
  return (
    isPrismaMissingTableError(error) ||
    isPrismaDelegateUnavailableError(error) ||
    isPrismaConnectionError(error)
  );
}
