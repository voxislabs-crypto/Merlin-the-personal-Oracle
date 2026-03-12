import { NextResponse } from 'next/server';
import { generateQuestsFromInputs } from '@/lib/astrology/quest-generation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transits, forecast, mbtiType } = body;
    const quests = generateQuestsFromInputs({ transits, forecast, mbtiType });

    return NextResponse.json({
      success: true,
      data: { quests, generatedAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error('[Quests] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate quests' }, { status: 500 });
  }
}
