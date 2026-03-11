import type { BirthChartData } from '@/types/astrology';
import { LIVE_ORACLE_STORAGE_KEYS } from '@/lib/astrology/live-oracle-storage';

const XAI_API_BASE = 'https://api.x.ai/v1';

type OracleResponse = {
  answer: string;
  tactics?: string[];
  forecast?: { timeframe: string; themes: string[] };
  level?: { current: string; challenge: string; reward: string };
};

interface AskGrokOracleInput {
  question: string;
  birthChart?: BirthChartData;
  progressedChart?: unknown;
  plainEnglish?: boolean;
  mbtiType?: string;
}

function compactChartSummary(chart?: BirthChartData): string {
  if (!chart) return 'No natal chart context available.';

  const planets = (chart.planets || [])
    .slice(0, 8)
    .map((p) => `${p.name} ${p.sign} ${p.degree}deg H${p.house ?? '?'}`)
    .join(', ');

  const aspects = (chart.aspects || [])
    .slice(0, 6)
    .map((a) => `${a.planet1?.name} ${a.type} ${a.planet2?.name}`)
    .join(', ');

  return `Planets: ${planets || 'n/a'}. Aspects: ${aspects || 'n/a'}.`;
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

    return `Last live check ${parsed.timestamp || 'unknown'} at ${parsed.location?.latitude?.toFixed?.(3) ?? '?'} , ${parsed.location?.longitude?.toFixed?.(3) ?? '?'}. Exact: ${parsed.transitSummary?.exact ?? 0}, approaching: ${parsed.transitSummary?.approaching ?? 0}. Advice: ${parsed.advice || 'n/a'}`;
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

export async function askGrokOracleClient(input: AskGrokOracleInput): Promise<OracleResponse> {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error('Missing xAI API key. Set it in Oracle Chat via Set Key.');
  }

  const systemPrompt = [
    'You are Merlin, an astrology oracle assistant.',
    input.plainEnglish
      ? 'Use plain, direct language. No mystical fluff.'
      : 'Use evocative oracle tone with practical guidance.',
    'Return valid JSON only with keys: answer, tactics, forecast, level.',
    'tactics must be an array of 1-4 concise action steps.',
    'forecast should include timeframe and themes array when possible.',
    'level should include current, challenge, reward when possible.',
  ].join(' ');

  const userPrompt = [
    `Question: ${input.question}`,
    `MBTI: ${input.mbtiType || 'unknown'}`,
    `Natal context: ${compactChartSummary(input.birthChart)}`,
    `Live GPS transit context: ${getStoredLiveSnapshotSummary()}`,
    `Progressed chart present: ${input.progressedChart ? 'yes' : 'no'}`,
  ].join('\n');

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
        { role: 'user', content: userPrompt },
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
