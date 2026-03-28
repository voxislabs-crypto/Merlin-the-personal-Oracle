import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { BirthChartData } from '@/types/astrology';
import { generateProphecy, type ProphecyEra, type ProphecyStyle } from '@/lib/astrology/prophecy';
import { logInteractionEvent } from '@/lib/pattern-mirror';
import { polishProphecyWithGroq, type ProphecyPolishMode } from '@/lib/prophecy-polish';

function estimateSyllables(input: string): number {
  const word = input.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  const matches = word.match(/[aeiouy]+/g);
  let syllables = matches ? matches.length : 1;
  if (word.endsWith('e') && syllables > 1) syllables -= 1;
  return Math.max(1, syllables);
}

function scoreSonnetMeter(poem: string): { score: number; averageSyllables: number } {
  const lines = poem.split('\n').filter((line) => line.trim().length > 0);
  if (!lines.length) {
    return { score: 0, averageSyllables: 0 };
  }

  const syllablesByLine = lines.map((line) => {
    const words = line.split(/\s+/).filter(Boolean);
    return words.reduce((sum, word) => sum + estimateSyllables(word), 0);
  });

  const average = syllablesByLine.reduce((sum, count) => sum + count, 0) / syllablesByLine.length;
  const normalized = syllablesByLine.reduce((sum, count) => {
    const delta = Math.abs(count - 10);
    return sum + Math.max(0, 1 - delta / 10);
  }, 0) / syllablesByLine.length;

  return {
    score: Math.round(normalized * 100),
    averageSyllables: Number(average.toFixed(2)),
  };
}

interface ProphecyRequest {
  birthChart?: BirthChartData;
  style?: ProphecyStyle;
  era?: ProphecyEra;
  strictMeter?: boolean;
  saveToHistory?: boolean;
  polishMode?: ProphecyPolishMode;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProphecyRequest;
    const {
      birthChart,
      style = 'omen',
      era = 'babylonian',
      strictMeter = false,
      saveToHistory = false,
      polishMode = 'engine',
    } = body || {};
    const { userId } = await auth();

    if (!birthChart?.planets?.length) {
      return NextResponse.json({ success: false, error: 'Missing birth chart data' }, { status: 400 });
    }

    if (style !== 'omen' && style !== 'sonnet') {
      return NextResponse.json({ success: false, error: 'Invalid prophecy style' }, { status: 400 });
    }

    if (!['babylonian', 'hermetic', 'psalmic', 'stoic'].includes(era)) {
      return NextResponse.json({ success: false, error: 'Invalid prophecy era' }, { status: 400 });
    }
    if (!['engine', 'groq'].includes(polishMode)) {
      return NextResponse.json({ success: false, error: 'Invalid prophecy polish mode' }, { status: 400 });
    }

    if (saveToHistory && !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = generateProphecy({ birthChart, style, era, strictMeter });

    let polishedBy: 'engine' | 'groq' = 'engine';
    if (polishMode === 'groq') {
      const polished = await polishProphecyWithGroq({
        prophecy: data.prophecy,
        style,
        era,
        strictMeter,
      });
      if (polished?.prophecy) {
        data.prophecy = polished.prophecy;
        if (style === 'sonnet') {
          // Recalculate meter score against polished sonnet text.
          data.meter = scoreSonnetMeter(polished.prophecy);
        }
        polishedBy = 'groq';
      }
    }

    if (saveToHistory && userId) {
      await logInteractionEvent({
        userId,
        type: 'prophecy_generation',
        content: data.title,
        feedbackSignal: 'open',
        metadata: {
          style: data.style,
          era: data.era,
          strictMeter,
          polishMode,
          polishedBy,
          prophecy: data.prophecy,
          signals: data.signals,
          meter: data.meter,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: true, data: { ...data, polishedBy } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
