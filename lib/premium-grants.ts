/**
 * Manually granted lifetime access (admin/script grants).
 * Merged with LIFETIME_USER_IDS and PREMIUM_EMAILS env vars in getUserTier().
 */
export const LIFETIME_GRANTED_USER_IDS = new Set([
  'user_39wOhHuS5AuJ3Hj9aJUGXCCDZDS',
]);

export const LIFETIME_GRANTED_EMAILS = new Set(['silorush99@gmail.com']);

export function parseEnvList(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isLifetimeGrantedUser(userId: string, email: string | null): boolean {
  const envUserIds = parseEnvList(process.env.LIFETIME_USER_IDS);
  const envEmails = parseEnvList(process.env.PREMIUM_EMAILS).map((entry) => entry.toLowerCase());

  if (LIFETIME_GRANTED_USER_IDS.has(userId) || envUserIds.includes(userId)) {
    return true;
  }

  if (!email) {
    return false;
  }

  const normalizedEmail = email.toLowerCase();
  return LIFETIME_GRANTED_EMAILS.has(normalizedEmail) || envEmails.includes(normalizedEmail);
}