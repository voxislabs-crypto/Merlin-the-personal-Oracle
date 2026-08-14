/**
 * Resolve a short display first name from a Clerk user for greetings.
 * "Kao" in docs/examples is illustrative only — never hardcode a name in UI.
 */

export type ClerkNameSource = {
  firstName?: string | null;
  fullName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }> | null;
};

function cleanToken(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function firstWord(value: string): string {
  return cleanToken(value).split(/\s+/)[0] || '';
}

/** Capitalize first letter for email/username tokens. */
function titleCaseToken(value: string): string {
  const t = value.trim();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/**
 * Best-effort first name for "Good evening, {name}".
 * Order: firstName → fullName first word → username → email local part (if name-like).
 */
export function resolveClerkFirstName(user?: ClerkNameSource | null): string | null {
  if (!user) return null;

  const first = user.firstName ? firstWord(user.firstName) : '';
  if (first) return first;

  const fromFull = user.fullName ? firstWord(user.fullName) : '';
  if (fromFull) return fromFull;

  const username = user.username ? cleanToken(user.username) : '';
  if (username && /^[a-zA-Z][a-zA-Z0-9._-]{1,30}$/.test(username)) {
    // Prefer the part before digits/underscore if it looks like a name
    const base = username.split(/[0-9._-]/)[0] || username;
    if (base.length >= 2) return titleCaseToken(base);
  }

  const email =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    '';
  if (email.includes('@')) {
    const local = email.split('@')[0] || '';
    // Avoid random ids: need letters, short, no plus-tags
    if (
      local &&
      !local.includes('+') &&
      /^[a-zA-Z][a-zA-Z._-]{1,24}$/.test(local)
    ) {
      const base = local.split(/[._-]/)[0] || local;
      if (base.length >= 2) return titleCaseToken(base);
    }
  }

  return null;
}
