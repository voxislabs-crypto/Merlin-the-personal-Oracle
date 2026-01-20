import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine-fallback';
import { getCurrentTransits } from '@/lib/astrology/transits';
import { BirthChartData } from '@/types/astrology';

export async function POST(request: Request) {
  console.log('Received request for transit analysis');
  
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
    const natalChart = calculateBirthChart(
      birthDate,
      birthTime,
      lat || 0,
      lon || 0
    ) as BirthChartData;

    // Get current transits
    const transits = getCurrentTransits(natalChart.positions || []);

    // Categorize transits by influence
    const significantTransits = transits.filter(t => t.exact || t.orb < 1.5);
    const approachingTransits = transits.filter(t => !t.exact && t.orb >= 1.5 && t.orb < 3);

    console.log('Successfully calculated transits:', transits.length);
    return NextResponse.json({
      success: true,
      data: {
        all: transits,
        significant: significantTransits,
        approaching: approachingTransits,
        summary: {
          total: transits.length,
          exact: significantTransits.length,
          approaching: approachingTransits.length
        }
      }
    });
  } catch (error) {
    console.error('Error calculating transits:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
