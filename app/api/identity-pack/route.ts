import { NextResponse } from 'next/server';
import { generateIdentityPack } from '@/lib/identity-pack';
import { upsertUserContextSnapshot } from '@/lib/user-context';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, birthChart, mbtiType } = body || {};

    if (!birthChart) {
      return NextResponse.json({ success: false, error: 'Missing birthChart' }, { status: 400 });
    }

    const identity = generateIdentityPack(birthChart, mbtiType);

    if (userId) {
      await upsertUserContextSnapshot({
        userId,
        archetypeName: identity.archetypeName,
        patternSignature: identity.patternSignature,
        coreContradiction: identity.coreContradiction,
      });
    }

    return NextResponse.json({ success: true, data: identity });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
