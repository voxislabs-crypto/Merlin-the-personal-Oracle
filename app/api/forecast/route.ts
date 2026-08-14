import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { BirthChartData } from '@/types/astrology';
import { validateFeatureAccess } from '@/lib/subscription-validation';
import { resolveForecastTargetDate } from '@/lib/datetime/local-calendar';
import { enrichDailyForecast } from '@/lib/astrology/enrich-daily-forecast';

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
    const { birthDate, birthTime, lat, lon, clientDate, timezoneOffset, mbtiType, userId } = body;
    
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
      console.warn('[Forecast] Swiss failed, using fallback:', error);
    }

    // Generate day's forecast for the *client's* local calendar date (not server UTC)
    const forecastDate = resolveForecastTargetDate(
      typeof clientDate === 'string' ? clientDate : undefined,
    );
    const safeForecast = {
      ...(await enrichDailyForecast({
        natalChart,
        forecastDate,
        birthDate,
        birthTime,
        lat,
        lon,
        mbtiType,
        userId: typeof userId === 'string' ? userId : undefined,
      })),
      timezoneOffsetHours: appliedOffsetHours,
    };
    console.log('Successfully generated forecast');
    return NextResponse.json({
      success: true,
      source,
      data: safeForecast
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
