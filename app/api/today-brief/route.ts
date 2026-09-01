import { NextResponse } from 'next/server';

import {
  polishTodayBrief,
  type TodayBriefPolishInput,
} from '@/lib/atmosphere/today-oracle/personal-ai';

function asString(value: unknown, max = 800): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function asBool(value: unknown): boolean {
  return value === true;
}

function asNum(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<TodayBriefPolishInput>;
    const date = asString(body.date, 12);
    const leadFact = asString(body.leadFact, 280);
    if (!date || !leadFact) {
      return NextResponse.json({ success: false, error: 'Missing date or lead fact' }, { status: 400 });
    }

    const input: TodayBriefPolishInput = {
      date,
      leadFact,
      leadFactDisplay: asString(body.leadFactDisplay, 80),
      chartWhy: asString(body.chartWhy, 800),
      move: asString(body.move, 400),
      watchFor: asString(body.watchFor, 280),
      operationalTension: asString(body.operationalTension, 400) || null,
      doNot: asString(body.doNot, 220) || undefined,
      coreType: asString(body.coreType, 8) || null,
      maskType: asString(body.maskType, 8) || null,
      sunSign: asString(body.sunSign, 24) || null,
      moonSign: asString(body.moonSign, 24) || null,
      moonPhase: asString(body.moonPhase, 40) || null,
      domains: Array.isArray(body.domains)
        ? body.domains.filter((d): d is string => typeof d === 'string').slice(0, 4)
        : [],
      heldFromYesterday: asBool(body.heldFromYesterday),
      yesterdayRestless: asBool(body.yesterdayRestless),
      streak: asNum(body.streak),
    };

    const polish = await polishTodayBrief(input);
    if (!polish) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: polish });
  } catch (error) {
    console.warn('[today-brief] route failed', error);
    return NextResponse.json({ success: false, error: 'Brief polish unavailable' }, { status: 500 });
  }
}
