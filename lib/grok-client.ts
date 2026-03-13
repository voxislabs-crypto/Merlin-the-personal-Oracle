import type { BirthChartData } from '@/types/astrology';
import { LIVE_ORACLE_STORAGE_KEYS } from '@/lib/astrology/live-oracle-storage';

const XAI_API_BASE = 'https://api.x.ai/v1';

export type OracleResponse = {
  answer: string;
  tactics?: string[];
  forecast?: { timeframe: string; themes: string[] };
  level?: { current: string; challenge: string; reward: string };
};

// Lightweight inline types so we don't import from hooks
export interface OracleTransitItem {
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  exact: boolean;
}

export interface OracleTransitContext {
  significant: OracleTransitItem[];
  approaching?: OracleTransitItem[];
  summary: { total: number; exact: number; approaching: number };
}

export interface OracleWeeklyForecast {
  week: Array<{ day: string; date: string; whisper: string }>;
}

export interface OracleLifeArc {
  events: Array<{ year: number; age: number; raw: string; oneLiner: string; intensity: string }>;
  currentAge: number;
}

export interface OracleStorm {
  date: string;
  title: string;
  intensity: string;
  lifeArea: string;
  navigation: string;
}

export interface OracleStormsReport {
  storms: OracleStorm[];
  weekSummary: string;
  clearDays: string[];
}

export interface AskGrokOracleInput {
  question: string;
  birthChart?: BirthChartData;
  progressedChart?: unknown;
  plainEnglish?: boolean;
  mbtiType?: string;
  transits?: OracleTransitContext;
  weeklyForecast?: OracleWeeklyForecast;
  lifeArc?: OracleLifeArc;
  chartSummary?: string;
  stormsReport?: OracleStormsReport;
}

// ─── Context builders ────────────────────────────────────────────────────────

function buildNatalChart(chart?: BirthChartData): string {
  if (!chart) return 'No natal chart available.';

  const planets = (chart.planets || [])
    .map((p) => `${p.name} ${p.sign} ${p.degree}°${p.minute ? String(p.minute).padStart(2,'0')+"'" : ''} H${p.house ?? '?'}`)
    .join(' | ');

  const houses = (chart.houses || [])
    .map((h: any, i: number) => `${i + 1}:${h.sign || '?'}`)
    .join(' ');

  const aspects = (chart.aspects || [])
    .sort((a: any, b: any) => (a.orb ?? 99) - (b.orb ?? 99))
    .slice(0, 12)
    .map((a: any) => `${a.planet1?.name} ${a.type} ${a.planet2?.name} (${a.orb?.toFixed?.(1) ?? '?'}°)`)
    .join(' | ');

  const asc = (chart as any).angles?.ascendant ?? (chart as any).ascendant;
  const mc  = (chart as any).angles?.midheaven  ?? (chart as any).mc ?? (chart as any).midheaven;
  const ascSign = typeof asc === 'object' ? asc?.sign : '?';
  const mcSign  = typeof mc  === 'object' ? mc?.sign  : '?';

  return [
    `Planets: ${planets || 'n/a'}`,
    `Houses: ${houses || 'n/a'}`,
    `Ascendant: ${ascSign} | Midheaven: ${mcSign}`,
    `Key aspects: ${aspects || 'n/a'}`,
  ].join('\n');
}

function buildTransitContext(transits?: OracleTransitContext): string {
  if (!transits) return getStoredLiveSnapshotSummary();

  const exact = transits.significant.filter((t) => t.exact);
  const close = transits.significant.filter((t) => !t.exact);
  const approaching = transits.approaching || [];

  const lines: string[] = [];
  if (exact.length)
    lines.push(`Exact: ${exact.map((t) => `${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet}`).join(', ')}`);
  if (close.length)
    lines.push(`Close: ${close.map((t) => `${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet} (${t.orb}°)`).join(', ')}`);
  if (approaching.length)
    lines.push(`Approaching: ${approaching.slice(0, 5).map((t) => `${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet} (${t.orb}°)`).join(', ')}`);
  lines.push(`Total: ${transits.summary.total} active, ${transits.summary.exact} exact, ${transits.summary.approaching} approaching`);

  const liveSnapshot = getStoredLiveSnapshotSummary();
  if (!liveSnapshot.includes('unavailable')) lines.push(`GPS live: ${liveSnapshot}`);

  return lines.join('\n') || 'No active transits.';
}

function buildWeeklyContext(wf?: OracleWeeklyForecast): string {
  if (!wf?.week?.length) return 'No weekly forecast available.';
  return wf.week
    .slice(0, 7)
    .map((d) => `${d.day} (${d.date}): ${d.whisper}`)
    .join('\n');
}

function buildLifeArcContext(arc?: OracleLifeArc): string {
  if (!arc?.events?.length) return 'No life arc data available.';
  const age = arc.currentAge;
  const recent = arc.events.filter((e) => e.age >= age - 2 && e.age <= age).slice(0, 4);
  const upcoming = arc.events.filter((e) => e.age > age && e.age <= age + 3).slice(0, 4);
  const lines: string[] = [`Current age: ${age}`];
  if (recent.length)
    lines.push(`Recent (${age - 2}–${age}): ${recent.map((e) => `${e.year} age ${e.age} — ${e.oneLiner}`).join('; ')}`);
  if (upcoming.length)
    lines.push(`Upcoming (${age + 1}–${age + 3}): ${upcoming.map((e) => `${e.year} age ${e.age} — ${e.oneLiner}`).join('; ')}`);
  return lines.join('\n');
}

function buildStormsContext(report?: OracleStormsReport): string {
  if (!report) return 'No storms report available.';
  const lines: string[] = [`Week summary: ${report.weekSummary}`];
  if (report.clearDays?.length)
    lines.push(`Clear days: ${report.clearDays.join(', ')}`);
  const severe = report.storms.filter((s) => s.intensity === 'severe').slice(0, 3);
  const moderate = report.storms.filter((s) => s.intensity === 'moderate').slice(0, 3);
  if (severe.length)
    lines.push(`Severe storms: ${severe.map((s) => `${s.date} ${s.title} (${s.lifeArea}) — ${s.navigation}`).join('; ')}`);
  if (moderate.length)
    lines.push(`Moderate: ${moderate.map((s) => `${s.date} ${s.title}`).join('; ')}`);
  return lines.join('\n');
}

function getStoredLiveSnapshotSummary(): string {
  try {
    const raw = localStorage.getItem(LIVE_ORACLE_STORAGE_KEYS.snapshot);
    if (!raw) return 'No live GPS transit snapshot yet.';
    const parsed = JSON.parse(raw) as {
      timestamp?: string;
      advice?: string;
      transitSummary?: { exact?: number; approaching?: number };
      location?: { latitude?: number; longitude?: number };
    };
    return `Last live check ${parsed.timestamp || 'unknown'} at ${parsed.location?.latitude?.toFixed?.(3) ?? '?'},${parsed.location?.longitude?.toFixed?.(3) ?? '?'}. Exact: ${parsed.transitSummary?.exact ?? 0}, approaching: ${parsed.transitSummary?.approaching ?? 0}. Advice: ${parsed.advice || 'n/a'}`;
  } catch {
    return 'Live snapshot unavailable.';
  }
}

function resolveApiKey(): string | null {
  const fromStorage = localStorage.getItem(LIVE_ORACLE_STORAGE_KEYS.grokApiKey);
  if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  const fromEnv = (process.env.NEXT_PUBLIC_XAI_API_KEY || '').trim();
  return fromEnv || null;
}

function extractJsonBlock(content: string): OracleResponse {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { answer: content.trim() || 'I could not generate a response.' };
    }
    const parsed = JSON.parse(jsonMatch[0]) as OracleResponse;
    return {
      answer: parsed.answer || content.trim(),
      tactics: parsed.tactics?.slice(0, 4),
      forecast: parsed.forecast,
      level: parsed.level,
    };
  } catch {
    return { answer: content.trim() || 'I could not generate a response.' };
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function askGrokOracleClient(input: AskGrokOracleInput): Promise<OracleResponse> {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error('Missing xAI API key. Set it in Oracle Chat via Set Key.');
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const systemPrompt = [
    'You are Merlin, an astrology oracle deeply integrated with this specific user\'s chart, MBTI, transits, and life arc.',
    `Today is ${today}.`,
    input.plainEnglish
      ? 'Use plain, direct language. Cut the mystical fluff — be insightful but clear.'
      : 'Use an evocative oracle tone with practical, grounded guidance.',
    'You have complete context about the user listed below. Use it actively — reference specific placements, transits, and life arc events when relevant.',
    'Return ONLY valid JSON with keys: answer (string), tactics (array of 1-4 action steps), forecast (object with timeframe and themes array), level (object with current, challenge, reward).',
  ].join(' ');

  const contextSections = [
    `=== QUESTION ===\n${input.question}`,
    `=== MBTI PROFILE ===\n${input.mbtiType || 'Unknown — ask the user'}`,
    `=== NATAL BIRTH CHART ===\n${buildNatalChart(input.birthChart)}`,
    `=== ACTIVE TRANSITS (TODAY) ===\n${buildTransitContext(input.transits)}`,
    `=== WEEKLY ENERGY FORECAST ===\n${buildWeeklyContext(input.weeklyForecast)}`,
    `=== LIFE ARC TIMELINE ===\n${buildLifeArcContext(input.lifeArc)}`,
    `=== WEEKLY STORMS & NAVIGATIONS ===\n${buildStormsContext(input.stormsReport)}`,
    input.chartSummary ? `=== CHART INTERPRETATION SUMMARY ===\n${input.chartSummary}` : '',
    input.progressedChart ? '=== PROGRESSED CHART: Present ===' : '',
  ].filter(Boolean).join('\n\n');

  const response = await fetch(`${XAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3-fast',
      temperature: 0.6,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextSections },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI request failed (${response.status}): ${errorText.slice(0, 240)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return extractJsonBlock(content);
}
