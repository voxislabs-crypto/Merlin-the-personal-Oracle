import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getTodaysForecast } from '@/lib/astrology/ephemeris';
import { generateDailyForecast } from '@/lib/transit-calculator';
import { BirthChartData } from '@/types/astrology';
import { validateFeatureAccess } from '@/lib/subscription-validation';

export async function POST(request: Request) {
  console.log('Received request for daily forecast');
  
  // Check subscription tier
  const hasAccess = await validateFeatureAccess('canAccessForecast');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Daily Forecasts are not available on the free tier',
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
    let source: 'swiss-real' | 'mock-fallback' = 'swiss-real';
    try {
      natalChart = calculateBirthChart(birthDate, birthTime, lat || 0, lon || 0) as BirthChartData;
    } catch (error) {
      source = 'mock-fallback';
      natalChart = calculateBirthChartFallback(birthDate, birthTime, lat || 0, lon || 0) as BirthChartData;
      console.warn('[Forecast] Swiss failed, using fallback:', error);
    }

    // Generate today's forecast (ephemeris-based)
    const forecast = getTodaysForecast(natalChart);

    // Enrich with TRANSIT_LOOKUP (28-aspect library) + day_rating + mbti_overlay
    let enrichedFields: Record<string, unknown> = {};
    try {
      const [birthDateStr, birthTimeStr] = [birthDate as string, (birthTime as string) || '12:00'];
      const [y, mo, d] = birthDateStr.split('-').map(Number);
      const [h, m] = birthTimeStr.split(':').map(Number);
      const birthDateObj = new Date(Date.UTC(y, mo - 1, d, h || 12, m || 0));
      const tcForecast = await generateDailyForecast(
        new Date(),
        { date: birthDateObj, location: { latitude: lat || 0, longitude: lon || 0 } },
        undefined, // mbtiType — not required for basic enrichment
      );
      enrichedFields = {
        day_rating: tcForecast.day_rating,           // "green" | "yellow" | "red"
        mbti_overlay: tcForecast.mbti_overlay,       // per-type guidance
        primaryTheme: tcForecast.primaryTheme,       // e.g. "transformation"
        secondaryThemes: tcForecast.secondaryThemes, // supporting themes
        transitLookup: tcForecast.transits,          // full 28-aspect transits with do/don't
      };
      console.log('[Forecast] Transit-lookup enriched with', tcForecast.transits.length, 'aspects');
    } catch (tcErr) {
      console.warn('[Forecast] Transit-lookup enrichment skipped:', tcErr instanceof Error ? tcErr.message : tcErr);
    }

    console.log('Successfully generated forecast');
    return NextResponse.json({
      success: true,
      source,
      data: { ...forecast, ...enrichedFields }
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
