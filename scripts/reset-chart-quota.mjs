/**
 * Reset unique-natal quota for a Clerk user (email or user_id).
 * Usage: CLERK_SECRET_KEY=sk_... node scripts/reset-chart-quota.mjs silorush99@gmail.com
 */

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/reset-chart-quota.mjs <email-or-user-id>');
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
    throw new Error(
      `${response.status} ${response.statusText}: ${typeof body === 'string' ? body : JSON.stringify(body)}`,
    );
  }
  return body;
}

let user = null;
if (target.startsWith('user_')) {
  user = await clerk(`/users/${target}`);
} else {
  const users = await clerk(`/users?email_address=${encodeURIComponent(target)}&limit=5`);
  user = (users || []).find((entry) =>
    (entry.email_addresses || []).some(
      (row) => row.email_address?.toLowerCase() === target.toLowerCase(),
    ),
  );
}

if (!user) {
  console.error(`No Clerk user found for ${target}`);
  process.exit(1);
}

const privateMetadata = {
  ...(user.private_metadata || {}),
  chartQuota: {
    count: 0,
    fingerprints: [],
    limit: 3,
    updatedAt: new Date().toISOString(),
    resetBy: 'scripts/reset-chart-quota.mjs',
  },
};

await clerk(`/users/${user.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ private_metadata: privateMetadata }),
});

console.log(`Reset chart quota for ${user.id} (${target})`);
