import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { recomputeCalibrationProfile } from '@/lib/astrology/feedback/calibration';

interface RecomputeBody {
  userId?: string;
  days?: number;
  minSamples?: number;
}

export async function POST(request: Request) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as RecomputeBody;
    const targetUserId = body.userId || authUserId;

    if (targetUserId !== authUserId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const result = await recomputeCalibrationProfile({
      userId: targetUserId,
      days: body.days,
      minSamples: body.minSamples,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
