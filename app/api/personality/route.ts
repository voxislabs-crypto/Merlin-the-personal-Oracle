import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getMBTI } from '@/lib/personality/fusion';
import { BirthChartData } from '@/types/astrology';

export async function POST(request: Request) {
  console.log('[Personality] Received request for MBTI derivation');
  
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
      console.log('[Personality] Using Swiss Ephemeris engine');
    } catch (swephError) {
      console.log('[Personality] Swiss Ephemeris failed, using fallback:', swephError);
      natalChart = calculateBirthChartFallback(
        birthDate,
        birthTime,
        lat || 0,
        lon || 0
      ) as BirthChartData;
    }

    // Derive MBTI from chart
    const mbtiType = getMBTI(natalChart);

    console.log('[Personality] Successfully derived MBTI:', mbtiType);
    return NextResponse.json({
      success: true,
      data: { mbtiType }
    });
  } catch (error) {
    console.error('[Personality] Error deriving MBTI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
