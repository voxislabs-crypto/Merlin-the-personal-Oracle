import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { requireInternalOpsAccess } from '@/lib/internal/ops-auth';

export async function GET(request: NextRequest) {
  const denied = await requireInternalOpsAccess(request);
  if (denied) return denied;

  try {
    const filePath = path.join(process.cwd(), 'docs/ops/reports/trend-rollup.json');
    const raw = await readFile(filePath, 'utf8');
    const report = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load trend rollup',
      },
      { status: 500 }
    );
  }
}
