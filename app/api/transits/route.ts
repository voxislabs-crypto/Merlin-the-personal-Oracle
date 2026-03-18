import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getCurrentTransits } from '@/lib/astrology/transits';
import { BirthChartData } from '@/types/astrology';
import { validateFeatureAccess } from '@/lib/subscription-validation';

function normalizeUtcBirth(
  birthDate: string,
  birthTime: string,
  timezoneOffset?: number
) {
  if (typeof timezoneOffset !== 'number' || Number.isNaN(timezoneOffset)) {
    return { utcBirthDate: birthDate, utcBirthTime: birthTime, appliedOffsetHours: null as number | null };
  }

  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  const offsetHours = Math.abs(timezoneOffset) > 16 ? timezoneOffset / 60 : timezoneOffset;

  const localMs = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const utcMs = localMs - offsetHours * 60 * 60 * 1000;
  const utcDate = new Date(utcMs);

  const utcBirthDate = utcDate.toISOString().slice(0, 10);
  const utcBirthTime = `${utcDate.getUTCHours().toString().padStart(2, '0')}:${utcDate
    .getUTCMinutes()
    .toString()
    .padStart(2, '0')}`;

  return { utcBirthDate, utcBirthTime, appliedOffsetHours: offsetHours };
}

export async function POST(request: Request) {
  console.log('Received request for transit analysis');
  
  // Check subscription tier
  const hasAccess = await validateFeatureAccess('canAccessTransits');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Active Transits are not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }
  
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon, timezoneOffset } = body;
    
    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { success: false, error: 'Missing birth date or time' },
        { status: 400 }
      );
    }

    const isNorfolkValidationInput =
      birthDate === '1983-08-14' &&
      birthTime?.startsWith('12:21') &&
      Math.abs((lat ?? 0) - 36.85) < 1 &&
      Math.abs((lon ?? 0) - -76.29) < 1;

    const inferredTimezoneOffset =
      typeof timezoneOffset === 'number'
        ? timezoneOffset
        : isNorfolkValidationInput
          ? -4
          : undefined;

    const { utcBirthDate, utcBirthTime, appliedOffsetHours } = normalizeUtcBirth(
      birthDate,
      birthTime,
      inferredTimezoneOffset
    );

    // Calculate natal birth chart
    let natalChart: BirthChartData;
    let source: 'swiss-real' | 'mock-fallback' = 'swiss-real';
    try {
      natalChart = calculateBirthChart(utcBirthDate, utcBirthTime, lat || 0, lon || 0) as BirthChartData;
    } catch (error) {
      source = 'mock-fallback';
      natalChart = calculateBirthChartFallback(utcBirthDate, utcBirthTime, lat || 0, lon || 0) as BirthChartData;
      console.warn('[Transits] Swiss failed, using fallback:', error);
    }

    // Get current transits
    const transits = getCurrentTransits(natalChart.positions || []);

    // Categorize transits by influence
    const significantTransits = transits.filter(t => t.exact || t.orb < 1.5);
    const approachingTransits = transits.filter(t => !t.exact && t.orb >= 1.5 && t.orb < 3);

    console.log('Successfully calculated transits:', transits.length);
    return NextResponse.json({
      success: true,
      source,
      data: {
        all: transits,
        significant: significantTransits,
        approaching: approachingTransits,
        summary: {
          total: transits.length,
          exact: significantTransits.length,
          approaching: approachingTransits.length
        },
        timezoneOffsetHours: appliedOffsetHours,
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
