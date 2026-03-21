import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getTodaysForecast } from '@/lib/astrology/ephemeris';
import { getUserContextSnapshot } from '@/lib/user-context';
import { BirthChartData } from '@/types/astrology';

interface DailyOracleRequest {
  userId?: string;
  birthDate?: string;
  birthTime?: string;
  lat?: number;
  lon?: number;
  birthChart?: BirthChartData;
  truthBomb?: boolean;
}

function buildDailyOracleMessage(params: {
  forecastSummary: string;
  dayRating?: string;
  context?: Awaited<ReturnType<typeof getUserContextSnapshot>>;
  truthBomb?: boolean;
}): string {
  const { forecastSummary, dayRating, context, truthBomb } = params;
  const mood = context?.mood || 'uncertain';
  const lastFeedback = context?.lastFeedbackNotes || '';
  const path = context?.arcPath || 'Path of Truth';
  const level = context?.arcLevel || 1;

  const opener = truthBomb
    ? `Truth Bomb: Level ${level} on ${path} means the old script is expensive now.`
    : `Daily Oracle: Level ${level} on ${path}.`;

  const pressureLine = dayRating === 'Very Challenging' || dayRating === 'Challenging'
    ? 'Today is a pressure day. Choose precision over speed.'
    : 'Today is workable terrain. A small decisive move compounds.';

  const memoryLine = lastFeedback
    ? `Last time you said: "${lastFeedback.slice(0, 120)}${lastFeedback.length > 120 ? '...' : ''}". Do not repeat that pattern today.`
    : `Current mood reads ${mood}. Use that as data, not destiny.`;

  const truthLine = truthBomb
    ? 'You do not have an information problem. You have an avoidance pattern wearing intellectual clothing.'
    : 'Watch for one moment where hesitation pretends to be preparation.';

  return `${opener} ${pressureLine} ${memoryLine} ${forecastSummary} ${truthLine}`.trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DailyOracleRequest;
    const { userId, birthDate, birthTime, lat = 0, lon = 0, birthChart, truthBomb = false } = body;

    let chart: BirthChartData | null = birthChart || null;

    if (!chart && birthDate && birthTime) {
      try {
        chart = calculateBirthChart(birthDate, birthTime, lat, lon) as BirthChartData;
      } catch {
        chart = calculateBirthChartFallback(birthDate, birthTime, lat, lon) as BirthChartData;
      }
    }

    if (!chart) {
      return NextResponse.json({ success: false, error: 'Missing chart context' }, { status: 400 });
    }

    const context = userId ? await getUserContextSnapshot(userId) : null;
    const forecast = getTodaysForecast(chart);

    const message = buildDailyOracleMessage({
      forecastSummary: forecast.summary,
      dayRating: forecast.day_rating,
      context,
      truthBomb,
    });

    return NextResponse.json({
      success: true,
      data: {
        date: forecast.date,
        message,
        dayRating: forecast.day_rating,
        path: context?.arcPath,
        level: context?.arcLevel,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
