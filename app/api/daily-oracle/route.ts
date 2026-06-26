import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getTodaysForecast } from '@/lib/astrology/ephemeris';
import { getUserContextSnapshot } from '@/lib/user-context';
import { BirthChartData } from '@/types/astrology';
import { detectPatternFromText, getPatternMirror, logInteractionEvent } from '@/lib/pattern-mirror';
import { applyMerlinTone } from '@/lib/tone-engine';

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
  patternMirror?: Awaited<ReturnType<typeof getPatternMirror>> | null;
  truthBomb?: boolean;
}): string {
  const { forecastSummary, dayRating, context, patternMirror, truthBomb } = params;
  const mood = context?.mood || 'uncertain';
  const lastFeedback = context?.lastFeedbackNotes || '';
  const path = context?.arcPath || 'Path of Truth';
  const level = context?.arcLevel || 1;
  const dominantPattern = patternMirror?.dominant;
  const mirrorInsight = patternMirror?.mirrorInsight;
  const stanceMode = level > 3 ? 'direct' : 'soft';

  const patternFraming: Record<string, { plain: string; truth: string; move: string }> = {
    avoidance_loop: {
      plain: 'The repeat risk today is avoidance dressed up as waiting for the right moment.',
      truth: 'Your real tax right now is delay. You keep calling it discernment after the decision is already obvious.',
      move: 'Ship one imperfect action before noon.',
    },
    overthinking_loop: {
      plain: 'The repeat risk today is overthinking until clarity expires.',
      truth: 'You are trying to think your way out of a move that only reveals itself after action.',
      move: 'Make one decision with the data you already have.',
    },
    inconsistency: {
      plain: 'The repeat risk today is breaking trust with yourself through drift.',
      truth: 'The problem is not ambition. It is your habit of abandoning the version of you that started the work.',
      move: 'Finish one open loop before you open another.',
    },
    validation_seeking: {
      plain: 'The repeat risk today is outsourcing your conviction.',
      truth: 'You already know the answer. You are shopping for permission so you can avoid the cost of backing yourself.',
      move: 'Ask fewer people. Back one instinct publicly.',
    },
    control_friction: {
      plain: 'The repeat risk today is gripping too hard where timing needs flexibility.',
      truth: 'Your need for certainty is creating more drag than the external problem.',
      move: 'Loosen one plan and protect only the non-negotiable.',
    },
    self_trust_gap: {
      plain: 'The repeat risk today is doubting your own signal after you already felt it clearly.',
      truth: 'You do not need another sign. You need to stop betraying the signs you already got.',
      move: 'Act on the first clean knowing before fear edits it.',
    },
  };

  const trendFraming: Record<'rising' | 'stable' | 'fading' | 'new', {
    patternLine: (label: string, count: number) => string;
    pressureLine: string;
    truthPrefix: string;
    movePrefix: string;
  }> = {
    rising: {
      patternLine: (label, count) => `Merlin sees the main loop intensifying: ${label}. It has shown up ${count} times and the pressure is climbing, not settling.`,
      pressureLine: 'This is not background noise. The pattern is gaining momentum, so timing matters more than usual.',
      truthPrefix: 'Because it is rising:',
      movePrefix: 'Best interruption while it is rising:',
    },
    stable: {
      patternLine: (label, count) => `Merlin sees the main loop: ${label}. It has shown up ${count} times and it is holding its shape.`,
      pressureLine: 'This is familiar terrain. The cost today comes from repeating it on autopilot.',
      truthPrefix: 'What stays true:',
      movePrefix: 'Best correction on a stable loop:',
    },
    fading: {
      patternLine: (label, count) => `Merlin sees the main loop cooling off: ${label}. It is still present, but it is not running the room the way it was.`,
      pressureLine: 'The grip is loosening. Today is better for consolidation than crisis management.',
      truthPrefix: 'While it is fading:',
      movePrefix: 'Best move while the pattern is weaker:',
    },
    new: {
      patternLine: (label, count) => `Merlin sees a newer loop taking form: ${label}. It has appeared ${count} time${count === 1 ? '' : 's'} recently, which is enough to watch closely.`,
      pressureLine: 'This pattern is still young, which means you have more leverage than usual if you interrupt it early.',
      truthPrefix: 'Early read:',
      movePrefix: 'Best move before it hardens:',
    },
  };

  const patternLens = dominantPattern ? patternFraming[dominantPattern.pattern] || patternFraming.self_trust_gap : null;
  const dominantTrend = dominantPattern?.trendStatus || 'stable';
  const trendLens = trendFraming[dominantTrend];

  const opener = truthBomb
    ? `Truth Bomb: Level ${level} on ${path} means the old script is expensive now.`
    : `Daily Oracle: Level ${level} on ${path}.`;

  const basePressureLine = dayRating === 'Very Challenging' || dayRating === 'Challenging'
    ? 'Today is a pressure day. Choose precision over speed.'
    : 'Today is workable terrain. A small decisive move compounds.';
  const pressureLine = dominantPattern ? `${basePressureLine} ${trendLens.pressureLine}` : basePressureLine;

  const memoryLine = lastFeedback
    ? `Last time you said: "${lastFeedback.slice(0, 120)}${lastFeedback.length > 120 ? '...' : ''}". Do not repeat that pattern today.`
    : `Current mood reads ${mood}. Use that as data, not destiny.`;

  const patternLine = dominantPattern
    ? truthBomb
      ? `Dominant loop: ${dominantPattern.label}. Status: ${dominantTrend}. ${trendLens.patternLine(dominantPattern.label, dominantPattern.count)}`
      : trendLens.patternLine(dominantPattern.label, dominantPattern.count)
    : truthBomb
      ? 'The pattern is still forming, so today the instruction is simple: watch what repeats under pressure.'
      : 'No dominant loop has fully hardened yet. Treat today like evidence collection.';

  const truthLine = patternLens
    ? truthBomb
      ? `${trendLens.truthPrefix} ${patternLens.truth}`
      : `${trendLens.truthPrefix} ${patternLens.plain}`
    : truthBomb
      ? 'You do not have an information problem. You have a follow-through problem wearing elegant language.'
      : 'Watch for one moment where hesitation pretends to be preparation.';

  const moveLine = patternLens
    ? `${trendLens.movePrefix} ${patternLens.move}`
    : 'Best behavioral correction today: choose one concrete move and let that become the reading.';

  // Mirror voice merges into the oracle — same speaker, one escalating message.
  // The oracle sets the frame; the mirror delivers the undeniable landing.
  const confrontationLine = mirrorInsight
    ? stanceMode === 'direct'
      ? `${mirrorInsight.message}\n\nIf it repeats again today, that is not confusion. That is consent.`
      : mirrorInsight.message
    : '';

  const parts = [opener, pressureLine, memoryLine, patternLine, forecastSummary, truthLine];
  if (confrontationLine) parts.push(confrontationLine);
  parts.push(moveLine);
  return parts.filter(Boolean).join('\n\n').trim();
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
    const patternMirror = userId ? await getPatternMirror(userId) : null;
    const forecast = getTodaysForecast(chart);

    const baseMessage = buildDailyOracleMessage({
      forecastSummary: forecast.summary,
      dayRating: forecast.day_rating,
      context,
      patternMirror,
      truthBomb,
    });

    // Rewrite through Merlin's voice layer — escalates with arc level + pattern repetition.
    // Falls back to baseMessage if API key is absent or call fails.
    const message = await applyMerlinTone({
      baseMessage,
      arcLevel: context?.arcLevel ?? 1,
      patternCount: patternMirror?.mirrorInsight?.count ?? 0,
      patternLabel: patternMirror?.dominant?.label,
      mirrorMessage: patternMirror?.mirrorInsight?.message,
    });

    if (userId) {
      const detected = detectPatternFromText(message);
      await logInteractionEvent({
        userId,
        type: truthBomb ? 'truth_bomb' : 'daily_oracle',
        content: message,
        detectedPattern: detected.key,
        confidence: detected.confidence,
        metadata: {
          dayRating: forecast.day_rating,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        date: forecast.date,
        message,
        dayRating: forecast.day_rating,
        path: context?.arcPath,
        level: context?.arcLevel,
        dominantPattern: patternMirror?.dominant || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
