import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getWeeklyWhispers } from '@/lib/astrology/weekly-whisper';
import { BirthChartData } from '@/types/astrology';
import { validateFeatureAccess } from '@/lib/subscription-validation';

export async function POST(request: Request) {
  console.log('[Weekly] Received request for weekly forecast');
  
  // Check subscription tier
  const hasAccess = await validateFeatureAccess('canAccessWeeklyForecast');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Weekly Whispers are not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }
  
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
    try {
      natalChart = calculateBirthChart(
        birthDate,
        birthTime,
        lat || 0,
        lon || 0,
        { includePatterns: false, includeTransits: false }
      ) as BirthChartData;
      console.log('[Weekly] Using Swiss Ephemeris engine');
    } catch (swephError) {
      console.log('[Weekly] Swiss Ephemeris failed, using fallback:', swephError);
      natalChart = calculateBirthChartFallback(
        birthDate,
        birthTime,
        lat || 0,
        lon || 0
      ) as BirthChartData;
    }

    // Generate weekly whispers
    const weeklyForecast = getWeeklyWhispers(natalChart);

    console.log('[Weekly] Successfully generated weekly forecast');
    return NextResponse.json({
      success: true,
      data: weeklyForecast
    });
  } catch (error) {
    console.error('[Weekly] Error generating forecast:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
