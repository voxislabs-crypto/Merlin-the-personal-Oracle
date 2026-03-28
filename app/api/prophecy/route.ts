import { NextResponse } from 'next/server';
import type { BirthChartData } from '@/types/astrology';
import { generateProphecy, type ProphecyStyle } from '@/lib/astrology/prophecy';

interface ProphecyRequest {
  birthChart?: BirthChartData;
  style?: ProphecyStyle;
  ancientLayer?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProphecyRequest;
    const { birthChart, style = 'omen', ancientLayer = true } = body || {};

    if (!birthChart?.planets?.length) {
      return NextResponse.json({ success: false, error: 'Missing birth chart data' }, { status: 400 });
    }

    if (style !== 'omen' && style !== 'sonnet') {
      return NextResponse.json({ success: false, error: 'Invalid prophecy style' }, { status: 400 });
    }

    const data = generateProphecy({ birthChart, style, ancientLayer });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
