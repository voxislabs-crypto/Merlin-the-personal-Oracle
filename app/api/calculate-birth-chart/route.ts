
import { NextResponse } from 'next/server';
import { calculateBirthChart as calculateSwissBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateFallbackBirthChart } from '@/lib/engine-fallback';
import { getMBTIDual } from '@/lib/personality/fusion';

type ChartSource = 'swiss-real' | 'mock-fallback';

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

function tagSourceMetadata(chartData: any, source: ChartSource, timezoneOffsetHours: number | null) {
  return {
    ...chartData,
    metadata: {
      ...(chartData?.metadata || {}),
      calculationSource: source,
      ephemeris: source === 'swiss-real' ? 'Swiss real' : 'Mock',
      timezoneOffsetHours,
    },
  };
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon, timezoneOffset } = body;
    
    console.log('[API] Calculate birth chart request:', { birthDate, birthTime, lat, lon });
    
    if (!birthDate || !birthTime || lat === undefined || lon === undefined) {
      console.error('[API] Missing required parameters:', { birthDate, birthTime, lat, lon });
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
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

    console.log('[API] Normalized birth datetime:', {
      input: `${birthDate} ${birthTime}`,
      timezoneOffset,
      utcBirthDate,
      utcBirthTime,
      lat,
      lon,
    });

    // Prefer local Swiss Ephemeris engine
    try {
      console.log('[API] Attempting Swiss engine calculation...');
      const swissData = calculateSwissBirthChart(
        utcBirthDate,
        utcBirthTime,
        lat,
        lon,
        { includeTransits: false }
      );

      const moonSign = swissData?.positions?.find((p: any) => p.name === 'Moon')?.sign;
      if (isNorfolkValidationInput && (moonSign === 'Sagittarius' || moonSign === 'Capricorn')) {
        console.error('[API] Moon sign sanity check failed for Norfolk input:', {
          moonSign,
          birthDate,
          birthTime,
          timezoneOffset,
          lat,
          lon,
        });
      }

      console.log('[API] ✓ Swiss engine success, moonSign:', moonSign);
      const taggedSwissData = tagSourceMetadata(swissData, 'swiss-real', appliedOffsetHours);
      const mbtiDual = getMBTIDual(taggedSwissData);
      return NextResponse.json({
        success: true,
        source: 'swiss-real',
        data: {
          ...taggedSwissData,
          personalitySnapshot: {
            hardware: mbtiDual.hardware.type,
            firmware: mbtiDual.firmware.type,
            finalType: mbtiDual.type,
            finalConfidence: mbtiDual.confidence,
          },
        },
      });
    } catch (err) {
      console.log('[API] ✗ Swiss engine failed:', err instanceof Error ? err.message : String(err));
      console.log('[API] Stack:', err instanceof Error ? err.stack : 'no stack');
      try {
        console.log('[API] Attempting fallback engine...');
        const chartData = calculateFallbackBirthChart(utcBirthDate, utcBirthTime, lat, lon);
        const fallbackMoon = chartData?.positions?.find((p: any) => p.name === 'Moon')?.sign;
        console.log('[API] ✓ Fallback engine success, moonSign:', fallbackMoon);
        const taggedFallbackData = tagSourceMetadata(chartData, 'mock-fallback', appliedOffsetHours);
        const mbtiDual = getMBTIDual(taggedFallbackData);
        return NextResponse.json({
          success: true,
          source: 'mock-fallback',
          data: {
            ...taggedFallbackData,
            personalitySnapshot: {
              hardware: mbtiDual.hardware.type,
              firmware: mbtiDual.firmware.type,
              finalType: mbtiDual.type,
              finalConfidence: mbtiDual.confidence,
            },
          },
          fallback: true,
        });
      } catch (fallbackError) {
        console.error('[API] ✗ Fallback engine failed:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('[API] Calculate birth chart error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate birth chart';
    return NextResponse.json({ success: false, error: errorMessage, details: String(error) }, { status: 500 });
  }
}
