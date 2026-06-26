import { auth, clerkClient } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { DashboardEventsInternalClient } from '@/components/internal/DashboardEventsInternalClient';

function isAdminUser(userId: string, metadata: Record<string, unknown> | undefined): boolean {
  const role = metadata?.role;
  const isAdminFlag = metadata?.isAdmin;
  const allowList = (process.env.INTERNAL_ANALYTICS_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return role === 'admin' || isAdminFlag === true || allowList.includes(userId);
}

export default async function DashboardEventsInternalPage() {
  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = (user.publicMetadata as Record<string, unknown> | undefined) || undefined;

  if (!isAdminUser(userId, metadata)) {
    notFound();
  }

  return <DashboardEventsInternalClient />;
}
