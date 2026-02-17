import { NextRequest, NextResponse } from 'next/server';
import { buildLifeTimeline } from '@/lib/astrology/life-timeline-engine';
import { BirthChartData } from '@/types/astrology';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chartData, birthDate } = body;

    if (!chartData || !birthDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: chartData and birthDate' },
        { status: 400 }
      );
    }

    console.log('[Life Arc] Building timeline for:', birthDate);

    const chart = chartData as BirthChartData;
    const timeline = await buildLifeTimeline(birthDate, chart.positions || chart.planets);

    console.log('[Life Arc] Timeline built:', {
      events: timeline.events.length,
      birthYear: timeline.birthYear,
      currentAge: timeline.currentAge
    });

    return NextResponse.json({
      success: true,
      data: timeline
    });

  } catch (error) {
    console.error('[Life Arc] Error building timeline:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error building timeline'
      },
      { status: 500 }
    );
  }
}
