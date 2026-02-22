// app/api/timeline/route.ts - Time Machine API: Generate long-range forecasts

import { NextRequest, NextResponse } from 'next/server';
import { generateTimeline } from '@/lib/timeline-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthChart, lookAheadMonths = 12 } = body;

    if (!birthChart || !birthChart.planets) {
      return NextResponse.json(
        {
          success: false,
          error: 'Birth chart data is required',
        },
        { status: 400 }
      );
    }

    if (lookAheadMonths < 1 || lookAheadMonths > 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Look ahead must be between 1 and 36 months',
        },
        { status: 400 }
      );
    }

    console.log(`[Timeline] Generating ${lookAheadMonths}-month forecast for chart...`);

    const timeline = await generateTimeline(birthChart, lookAheadMonths);

    console.log(`[Timeline] Generated ${timeline.phases.length} phases, ${timeline.majorTurningPoints.length} turning points`);

    return NextResponse.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    console.error('[Timeline] Error generating timeline:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate timeline',
      },
      { status: 500 }
    );
  }
}
