import { NextRequest, NextResponse } from 'next/server';
import { calculateLifeArc } from '@/lib/astrology/life-arc';
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

    console.log('Calculating life arc for birth date:', birthDate);

    const lifeArc = calculateLifeArc(chartData as BirthChartData, birthDate);

    console.log('Life arc calculated successfully:', {
      beats: lifeArc.beats.length,
      summary: lifeArc.summary.substring(0, 50) + '...'
    });

    return NextResponse.json({
      success: true,
      data: lifeArc
    });

  } catch (error) {
    console.error('Error calculating life arc:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error calculating life arc'
      },
      { status: 500 }
    );
  }
}
