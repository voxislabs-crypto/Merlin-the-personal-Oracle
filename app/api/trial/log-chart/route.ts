import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Log chart generation for trial tracking
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

    // Note: Chart count would typically be tracked in a database
    // For now, this is a placeholder that would integrate with:
    // - Prisma/MongoDB to store chart generation history
    // - Clerk webhook to update user metadata
    
    console.log('[Trial] Chart generation logged for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Chart logged'
    });
  } catch (error) {
    console.error('[Trial] Error logging chart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log chart' },
      { status: 500 }
    );
  }
}
