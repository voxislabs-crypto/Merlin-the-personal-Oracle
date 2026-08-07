import { NextResponse } from 'next/server';
import { getOracleQuotaStatus } from '@/lib/oracle-quota';

/**
 * GET /api/oracle-quota
 * Free-tier Oracle message allowance (read-only).
 */
export async function GET() {
  try {
    const quota = await getOracleQuotaStatus();
    return NextResponse.json({
      success: true,
      quota: {
        allowed: quota.allowed,
        tier: quota.tier,
        limit: quota.limit,
        used: quota.used,
        remaining: quota.remaining,
        day: quota.day,
        code: quota.code,
        error: quota.error,
      },
    });
  } catch (error) {
    console.error('[OracleQuota] Failed to resolve:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve Oracle quota',
      },
      { status: 500 }
    );
  }
}
