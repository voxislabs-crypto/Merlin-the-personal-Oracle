import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getTodaysForecast } from '@/lib/astrology/ephemeris';
import { BirthChartData } from '@/types/astrology';

export async function POST(request: Request) {
  console.log('Received request for daily forecast');
  
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon } = body;
    
    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { success: false, error: 'Missing birth date or time' },
        { status: 400 }
      );
    }

    // Calculate natal birth chart
    let natalChart: BirthChartData;
    let source: 'swiss-real' | 'mock-fallback' = 'swiss-real';
    try {
      natalChart = calculateBirthChart(birthDate, birthTime, lat || 0, lon || 0) as BirthChartData;
    } catch (error) {
      source = 'mock-fallback';
      natalChart = calculateBirthChartFallback(birthDate, birthTime, lat || 0, lon || 0) as BirthChartData;
      console.warn('[Forecast] Swiss failed, using fallback:', error);
    }

    // Generate today's forecast
    const forecast = getTodaysForecast(natalChart);

    console.log('Successfully generated forecast');
    return NextResponse.json({
      success: true,
      source,
      data: forecast
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
