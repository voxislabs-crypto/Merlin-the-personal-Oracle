import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Initialize trial for new users
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId || clerkUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Trial is initialized in Clerk webhooks
    // This endpoint is just a confirmation
    console.log('[Trial] Trial initialized for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Trial initialized'
    });
  } catch (error) {
    console.error('[Trial] Error initializing trial:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize trial' },
      { status: 500 }
    );
  }
}
