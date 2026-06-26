import { NextResponse } from 'next/server';

import { computeLunarReturnWeather } from '@/lib/astrology/lunar-return';
import { computeSolarReturnBriefing } from '@/lib/astrology/solar-return';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { validateFeatureAccess } from '@/lib/subscription-validation';
import type { BirthChartData } from '@/types/astrology';

function normalizeUtcBirth(birthDate: string, birthTime: string, timezoneOffset?: number) {
  if (typeof timezoneOffset !== 'number' || Number.isNaN(timezoneOffset)) {
    return { utcBirthDate: birthDate, utcBirthTime: birthTime };
  }

  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  const offsetHours = Math.abs(timezoneOffset) > 16 ? timezoneOffset / 60 : timezoneOffset;
  const localMs = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const utcMs = localMs - offsetHours * 60 * 60 * 1000;
  const utcDate = new Date(utcMs);

  return {
    utcBirthDate: utcDate.toISOString().slice(0, 10),
    utcBirthTime: `${utcDate.getUTCHours().toString().padStart(2, '0')}:${utcDate
      .getUTCMinutes()
      .toString()
      .padStart(2, '0')}`,
  };
}

export async function POST(request: Request) {
  const hasAccess = await validateFeatureAccess('canAccessForecast');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Return charts are not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon, timezoneOffset, clientDate } = body;

    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { success: false, error: 'Missing birth date or time' },
        { status: 400 }
      );
    }

    const { utcBirthDate, utcBirthTime } = normalizeUtcBirth(
      birthDate as string,
      birthTime as string,
      timezoneOffset
    );

    let natalChart: BirthChartData;
    try {
      natalChart = calculateBirthChart(
        utcBirthDate,
        utcBirthTime,
        (lat as number) || 0,
        (lon as number) || 0
      ) as BirthChartData;
    } catch {
      natalChart = calculateBirthChartFallback(
        utcBirthDate,
        utcBirthTime,
        (lat as number) || 0,
        (lon as number) || 0
      ) as BirthChartData;
    }

    const positions = natalChart.positions || natalChart.planets || [];
    const natalSun = positions.find((planet) => planet.name === 'Sun');
    const natalMoon = positions.find((planet) => planet.name === 'Moon');

    if (!natalSun || !natalMoon) {
      return NextResponse.json(
        { success: false, error: 'Natal Sun/Moon positions unavailable' },
        { status: 500 }
      );
    }

    const referenceDate =
      typeof clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)
        ? new Date(`${clientDate}T12:00:00`)
        : new Date();

    const solarReturn = computeSolarReturnBriefing({
      birthDate: birthDate as string,
      birthTime: birthTime as string,
      lat: (lat as number) || 0,
      lon: (lon as number) || 0,
      natalSunLongitude: natalSun.longitude,
      ascendantSign: natalChart.ascendant?.sign || 'Unknown',
      referenceDate,
    });

    const lunarReturn = computeLunarReturnWeather({
      birthDate: birthDate as string,
      birthTime: birthTime as string,
      lat: (lat as number) || 0,
      lon: (lon as number) || 0,
      natalMoonLongitude: natalMoon.longitude,
      referenceDate,
    });

    return NextResponse.json({
      success: true,
      data: {
        solarReturn,
        lunarReturn,
      },
    });
  } catch (error) {
    console.error('[Returns] Error generating return charts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}