import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

function isAdminUser(userId: string, metadata: Record<string, unknown> | undefined): boolean {
  const role = metadata?.role;
  const isAdminFlag = metadata?.isAdmin;
  const allowList = (process.env.INTERNAL_ANALYTICS_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return role === 'admin' || isAdminFlag === true || allowList.includes(userId);
}

export async function requireInternalOpsAccess(request: NextRequest): Promise<NextResponse | null> {
  const expectedToken = process.env.INTERNAL_OPS_API_TOKEN;
  const providedToken = request.headers.get('x-internal-ops-token');

  if (expectedToken && providedToken && providedToken === expectedToken) {
    return null;
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized internal ops access' },
        { status: 401 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = (user.publicMetadata as Record<string, unknown> | undefined) || undefined;

    if (!isAdminUser(userId, metadata)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden internal ops access' },
        { status: 403 }
      );
    }

    return null;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to validate internal ops access' },
      { status: 500 }
    );
  }
}
