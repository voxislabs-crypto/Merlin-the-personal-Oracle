import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { BirthChartData } from '@/types/astrology';
import { generateProphecy, type ProphecyEra, type ProphecyStyle } from '@/lib/astrology/prophecy';
import { logInteractionEvent } from '@/lib/pattern-mirror';

interface ProphecyRequest {
  birthChart?: BirthChartData;
  style?: ProphecyStyle;
  era?: ProphecyEra;
  strictMeter?: boolean;
  saveToHistory?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProphecyRequest;
    const { birthChart, style = 'omen', era = 'babylonian', strictMeter = false, saveToHistory = false } = body || {};
    const { userId } = await auth();

    if (!birthChart?.planets?.length) {
      return NextResponse.json({ success: false, error: 'Missing birth chart data' }, { status: 400 });
    }

    if (style !== 'omen' && style !== 'sonnet') {
      return NextResponse.json({ success: false, error: 'Invalid prophecy style' }, { status: 400 });
    }

    if (!['babylonian', 'hermetic', 'psalmic', 'stoic'].includes(era)) {
      return NextResponse.json({ success: false, error: 'Invalid prophecy era' }, { status: 400 });
    }

    if (saveToHistory && !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = generateProphecy({ birthChart, style, era, strictMeter });

    if (saveToHistory && userId) {
      await logInteractionEvent({
        userId,
        type: 'prophecy_generation',
        content: data.title,
        feedbackSignal: 'open',
        metadata: {
          style: data.style,
          era: data.era,
          strictMeter,
          prophecy: data.prophecy,
          signals: data.signals,
          meter: data.meter,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
