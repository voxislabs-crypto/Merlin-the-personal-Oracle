import { NextResponse } from 'next/server';
import { getChartQuotaStatus } from '@/lib/chart-quota';

/**
 * GET /api/chart-quota
 * Lifetime birth-chart build allowance (read-only).
 */
export async function GET() {
  try {
    const quota = await getChartQuotaStatus();
    return NextResponse.json({
      success: true,
      quota: {
        allowed: quota.allowed,
        tier: quota.tier,
        limit: quota.limit,
        used: quota.used,
        remaining: quota.remaining,
        code: quota.code,
        error: quota.error,
      },
    });
  } catch (error) {
    console.error('[ChartQuota] Failed to resolve:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve chart quota',
      },
      { status: 500 }
    );
  }
}
