/**
 * Grant premium tier to a Clerk user by email.
 * Usage: CLERK_SECRET_KEY=sk_... node scripts/grant-premium.mjs user@example.com [lifetime|monthly|trial]
 */

const email = process.argv[2];
const tier = process.argv[3] || 'lifetime';

if (!email) {
  console.error('Usage: node scripts/grant-premium.mjs <email> [lifetime|monthly|trial]');
  process.exit(1);
}

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  console.error('CLERK_SECRET_KEY is required');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${secretKey}`,
  'Content-Type': 'application/json',
};

async function clerk(path, init = {}) {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

const metadataByTier = {
  lifetime: {
    tier: 'lifetime',
    hasTrial: false,
    subscriptionId: null,
    subscriptionStatus: 'lifetime',
    lifetimeAccessGrantedAt: Math.floor(Date.now() / 1000),
    grantedBy: 'scripts/grant-premium.mjs',
  },
  monthly: {
    tier: 'monthly',
    hasTrial: false,
    subscriptionId: 'manual-grant',
    subscriptionStatus: 'active',
    grantedBy: 'scripts/grant-premium.mjs',
  },
  trial: {
    tier: 'trial',
    hasTrial: true,
    subscriptionStatus: 'trialing',
    grantedBy: 'scripts/grant-premium.mjs',
  },
};

const publicMetadata = metadataByTier[tier];
if (!publicMetadata) {
  console.error(`Unknown tier: ${tier}`);
  process.exit(1);
}

const users = await clerk(`/users?email_address=${encodeURIComponent(email)}&limit=5`);
const match = (users || []).find((user) =>
  (user.email_addresses || []).some((entry) => entry.email_address?.toLowerCase() === email.toLowerCase())
);

if (!match) {
  console.error(`No Clerk user found for ${email}`);
  process.exit(1);
}

const existingMetadata = match.public_metadata || {};
const updated = await clerk(`/users/${match.id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    public_metadata: {
      ...existingMetadata,
      ...publicMetadata,
    },
  }),
});

console.log(
  JSON.stringify(
    {
      ok: true,
      userId: updated.id,
      email,
      tier: publicMetadata.tier,
      firstName: updated.first_name,
      lastName: updated.last_name,
    },
    null,
    2
  )
);