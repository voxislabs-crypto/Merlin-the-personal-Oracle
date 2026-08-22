/**
 * Shared daily-forecast enrichment used by /api/forecast and tests.
 * getTodaysForecast() is the ephemeris layer. This adds transit lookup + MBTI overlay.
 */

import { getTodaysForecast, realignSummaryToDayRating } from '@/lib/astrology/ephemeris';
import { generateDailyForecast } from '@/lib/transit-calculator';
import { computeMBTI } from '@/lib/astrology/mbtiFusion';
import { getCosmicTendencies, getDetailedMBTITranslation } from '@/lib/astrology/mbti-profiles';
import { calendarDateToLocalNoon } from '@/lib/datetime/local-calendar';
import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import type { BirthChartData } from '@/types/astrology';
import type { MBTIType } from '@/lib/mbti-system';

const VALID_MBTI = new Set<string>([
  'INFJ', 'INFP', 'INTJ', 'INTP', 'ISFJ', 'ISFP', 'ISTJ', 'ISTP',
  'ENFJ', 'ENFP', 'ENTJ', 'ENTP', 'ESFJ', 'ESFP', 'ESTJ', 'ESTP',
]);

export function parseForecastMbtiType(value: unknown): MBTIType | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.toUpperCase();
  return VALID_MBTI.has(normalized) ? (normalized as MBTIType) : undefined;
}

type SanitizableForecastOutput = {
  summary?: unknown;
  advice?: unknown;
  transits?: unknown;
  planetaryHighlights?: unknown;
};

export function sanitizeForecastOutput<T extends SanitizableForecastOutput>(input: T): T {
  const output: T = { ...input };

  if (typeof output.summary === 'string') {
    output.summary = sanitizeCopyText(output.summary);
  }
  if (typeof output.advice === 'string') {
    output.advice = sanitizeCopyText(output.advice);
  }
  if (Array.isArray(output.transits)) {
    output.transits = output.transits.map((entry) =>
      typeof entry === 'string' ? sanitizeCopyText(entry) : entry,
    );
  }
  if (Array.isArray(output.planetaryHighlights)) {
    output.planetaryHighlights = output.planetaryHighlights.map((entry) =>
      typeof entry === 'string' ? sanitizeCopyText(entry) : entry,
    );
  }

  return output;
}

export interface EnrichDailyForecastInput {
  natalChart: BirthChartData;
  forecastDate: string;
  birthDate: string;
  birthTime?: string;
  lat?: number;
  lon?: number;
  mbtiType?: string | null;
  userId?: string | null;
}

export function resolveForecastOverlayType(
  requestedMbti?: string | null,
  computedType?: unknown
): MBTIType | undefined {
  return parseForecastMbtiType(requestedMbti) || parseForecastMbtiType(computedType);
}

export async function enrichDailyForecast(input: EnrichDailyForecastInput) {
  const forecast = getTodaysForecast(input.natalChart, input.forecastDate);
  const requestedMbti = parseForecastMbtiType(input.mbtiType);
  const computed = computeMBTI(input.natalChart);
  const overlayType = resolveForecastOverlayType(requestedMbti, computed.type);

  let enriched: Record<string, unknown> = {};
  try {
    const [y, mo, d] = input.birthDate.split('-').map(Number);
    const [h, m] = (input.birthTime || '12:00').split(':').map(Number);
    const birthDateObj = new Date(Date.UTC(y, mo - 1, d, h || 12, m || 0));
    const transitAsOf = calendarDateToLocalNoon(input.forecastDate);
    const tcForecast = await generateDailyForecast(
      transitAsOf,
      {
        date: birthDateObj,
        location: { latitude: input.lat || 0, longitude: input.lon || 0 },
      },
      requestedMbti,
      input.userId || undefined,
    );

    const reasoning = overlayType
      ? (requestedMbti && tcForecast.mbti_overlay?.[requestedMbti]?.translation) ||
        getDetailedMBTITranslation(overlayType, [], tcForecast.primaryTheme ? [tcForecast.primaryTheme] : [])
      : undefined;

    enriched = {
      day_rating: tcForecast.day_rating || forecast.day_rating,
      primaryTheme: tcForecast.primaryTheme,
      secondaryThemes: tcForecast.secondaryThemes,
      transitLookup: tcForecast.transits,
      ...(overlayType
        ? {
            mbti_overlay: {
              type: overlayType,
              confidence: computed.confidence,
              breakdown: computed.breakdown,
              reasoning,
              cosmicTendencies: getCosmicTendencies(overlayType),
              ...(tcForecast.mbti_overlay || {}),
            },
          }
        : {}),
      summary_raw: forecast.summary,
      summary_mbti_adjusted: reasoning,
    };

    if (tcForecast.day_rating && forecast.summary) {
      const natalSunSign =
        forecast.sunSign ||
        input.natalChart.positions?.find((p) => p.name === 'Sun')?.sign ||
        input.natalChart.planets?.find((p) => p.name === 'Sun')?.sign ||
        'Unknown';
      enriched.summary = realignSummaryToDayRating(
        forecast.summary,
        tcForecast.day_rating,
        natalSunSign,
      );
    }
  } catch (error) {
    console.warn(
      '[Forecast] Transit-lookup enrichment skipped:',
      error instanceof Error ? error.message : error,
    );
    enriched = {
      ...(overlayType
        ? {
            mbti_overlay: {
              type: overlayType,
              confidence: computed.confidence,
              breakdown: computed.breakdown,
              reasoning: getDetailedMBTITranslation(overlayType, [], []),
              cosmicTendencies: getCosmicTendencies(overlayType),
            },
          }
        : {}),
      summary_raw: forecast.summary,
      summary_mbti_adjusted: forecast.summary,
    };
  }

  return sanitizeForecastOutput({
    ...forecast,
    ...enriched,
  });
}
