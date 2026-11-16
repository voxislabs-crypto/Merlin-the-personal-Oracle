import { NextResponse } from 'next/server';

import { TODAY_BRIEF_LIMITS } from '@/lib/atmosphere/today-brief-evidence';
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

function asStringList(value: unknown, limit: number, max: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    const text = asString(item, max);
    if (!text) continue;
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

function isTruncatedBody(error: unknown): boolean {
  if (error instanceof SyntaxError) return true;
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String(error.name) : '';
  if (name === 'AbortError') return true;
  const message = 'message' in error ? String(error.message) : '';
  return /unexpected end|aborted|terminated|premature close|ECONNRESET/i.test(message);
}

/** Empty or cut-off bodies are cancelled dashboard fetches, not server faults. */
async function readBriefBody(request: Request): Promise<Partial<TodayBriefPolishInput> | null> {
  let raw = '';
  try {
    raw = await request.text();
  } catch (error) {
    if (isTruncatedBody(error)) return null;
    throw error;
  }
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Partial<TodayBriefPolishInput>;
  } catch (error) {
    if (isTruncatedBody(error)) return null;
    throw error;
  }
}

export async function POST(request: Request) {
  let body: Partial<TodayBriefPolishInput> | null;
  try {
    body = await readBriefBody(request);
  } catch (error) {
    console.warn('[today-brief] route failed', error);
    return NextResponse.json({ success: false, error: 'Brief polish unavailable' }, { status: 500 });
  }
  if (!body) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const date = asString(body.date, TODAY_BRIEF_LIMITS.date);
    const leadFact = asString(body.leadFact, TODAY_BRIEF_LIMITS.leadFact);
    if (!date || !leadFact) {
      return NextResponse.json({ success: false, error: 'Missing date or lead fact' }, { status: 400 });
    }

    const input: TodayBriefPolishInput = {
      date,
      leadFact,
      leadFactDisplay: asString(body.leadFactDisplay, TODAY_BRIEF_LIMITS.leadFactDisplay),
      chartWhy: asString(body.chartWhy, TODAY_BRIEF_LIMITS.chartWhy),
      move: asString(body.move, TODAY_BRIEF_LIMITS.move),
      watchFor: asString(body.watchFor, TODAY_BRIEF_LIMITS.watchFor),
      operationalTension: asString(body.operationalTension, TODAY_BRIEF_LIMITS.operationalTension) || null,
      doNot: asString(body.doNot, TODAY_BRIEF_LIMITS.doNot) || undefined,
      coreType: asString(body.coreType, TODAY_BRIEF_LIMITS.coreType) || null,
      maskType: asString(body.maskType, TODAY_BRIEF_LIMITS.maskType) || null,
      sunSign: asString(body.sunSign, TODAY_BRIEF_LIMITS.sunSign) || null,
      moonSign: asString(body.moonSign, TODAY_BRIEF_LIMITS.moonSign) || null,
      moonPhase: asString(body.moonPhase, TODAY_BRIEF_LIMITS.moonPhase) || null,
      domains: asStringList(body.domains, TODAY_BRIEF_LIMITS.domains, TODAY_BRIEF_LIMITS.domainLength),
      supportingFacts: asStringList(
        body.supportingFacts,
        TODAY_BRIEF_LIMITS.supportingFacts,
        TODAY_BRIEF_LIMITS.factLength,
      ),
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
