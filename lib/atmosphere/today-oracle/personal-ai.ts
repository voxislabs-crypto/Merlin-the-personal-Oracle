import 'server-only';

import { chatCompletion, isLlmConfigured } from '@/lib/llm-config';
import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import { applyMerlinVoicePass, failsMerlinVoiceTest } from '@/lib/voice/merlin-voice';
import { serverCache } from '@/lib/cache-service';

export interface TodayBriefPolishInput {
  date: string;
  leadFact: string;
  leadFactDisplay: string;
  chartWhy: string;
  move: string;
  watchFor: string;
  operationalTension?: string | null;
  doNot?: string;
  coreType?: string | null;
  maskType?: string | null;
  sunSign?: string | null;
  moonSign?: string | null;
  moonPhase?: string | null;
  domains?: string[];
  heldFromYesterday?: boolean;
  yesterdayRestless?: boolean;
  streak?: number | null;
}

export interface TodayBriefPolish {
  chartWhy: string;
  watchFor: string;
  operationalTension: string | null;
  source: 'llm' | 'none';
}

const SYSTEM_PROMPT = `You sharpen a personal daily brief. You are Merlin: a clarity coach, not an astrologer.

The user already has a move, a watch-window, and a chart hit. Your job is the LIVED MEANING — the sentence only this person would recognize.

Return JSON only:
{
  "chartWhy": "2-4 sentences. Lead with the actual chart hit already given, then what it feels like for THIS sun + core/mask. If core and mask differ, make the dual-layer operational (a sequence with a timebox), not a slogan. Do not repeat the move. Do not write a weather report.",
  "watchFor": "One checkable sentence: time window + trigger + consequence.",
  "operationalTension": "One operational sequence, or null if core and mask are the same or missing."
}

Rules:
- Translate any planet/aspect in the same breath. Never leave jargon alone.
- No fortunes. No "you will". No cosmic fluff.
- No restating mixed weather / restlessness / "change one variable".
- Do not dump MBTI as a badge ("As an INFP…"). Put the type in the sequence if at all.
- Max 420 characters for chartWhy, 220 for watchFor, 280 for operationalTension.
- If a field is already sharp, return it unchanged.`;

function cacheKey(input: TodayBriefPolishInput): string {
  return [
    'today-brief',
    input.date,
    input.leadFactDisplay,
    input.coreType || '',
    input.maskType || '',
    input.sunSign || '',
    input.moonSign || '',
    input.heldFromYesterday ? 'held' : '',
    input.yesterdayRestless ? 'restless' : '',
  ].join('|');
}

function clip(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function usable(text: string | null | undefined, min = 24): string | null {
  const t = applyMerlinVoicePass(sanitizeCopyText((text || '').trim()));
  if (!t || t.length < min) return null;
  if (failsMerlinVoiceTest(t)) return null;
  return t;
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isTodayBriefLlmEnabled(): boolean {
  if (process.env.TODAY_BRIEF_LLM_ENABLED === 'false') return false;
  if (process.env.TODAY_BRIEF_LLM_ENABLED === 'true') return isLlmConfigured();
  return isLlmConfigured();
}

export async function polishTodayBrief(
  input: TodayBriefPolishInput,
): Promise<TodayBriefPolish | null> {
  if (!isTodayBriefLlmEnabled()) return null;
  if (!input.leadFact || !input.date) return null;

  const key = cacheKey(input);
  const cached = serverCache.get<TodayBriefPolish>(key);
  if (cached?.chartWhy) return cached;

  const userPrompt = [
    `Date: ${input.date}`,
    `Chart hit: ${input.leadFact}`,
    `Label: ${input.leadFactDisplay}`,
    `Deterministic why: ${input.chartWhy}`,
    `Move (do not rewrite): ${input.move}`,
    `Watch (sharpen, keep the time window): ${input.watchFor}`,
    input.operationalTension ? `Dual-layer draft: ${input.operationalTension}` : 'Dual-layer: none',
    input.doNot ? `Do not: ${input.doNot}` : '',
    `Sun: ${input.sunSign || 'unknown'}`,
    `Core: ${input.coreType || 'unknown'}`,
    `Mask: ${input.maskType || 'same or unknown'}`,
    `Moon: ${input.moonPhase || ''} ${input.moonSign || ''}`.trim(),
    `Hot domains: ${(input.domains || []).join(', ') || 'unspecified'}`,
    input.heldFromYesterday ? 'Yesterday’s condition still applies.' : '',
    input.yesterdayRestless ? 'User flagged restlessness yesterday.' : '',
    typeof input.streak === 'number' ? `Return streak: ${input.streak}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const timeoutMs = Number(process.env.TODAY_BRIEF_LLM_TIMEOUT_MS || '4000');

  try {
    const raw = await Promise.race([
      chatCompletion({
        temperature: 0.45,
        maxTokens: 420,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);

    if (!raw) return null;
    const parsed = parseJsonObject(raw);
    if (!parsed) return null;

    const chartWhy = usable(typeof parsed.chartWhy === 'string' ? parsed.chartWhy : null, 40);
    const watchFor = usable(typeof parsed.watchFor === 'string' ? parsed.watchFor : null, 20);
    const operational =
      parsed.operationalTension === null
        ? null
        : usable(typeof parsed.operationalTension === 'string' ? parsed.operationalTension : null, 24);

    if (!chartWhy && !watchFor) return null;

    const result: TodayBriefPolish = {
      chartWhy: clip(chartWhy || input.chartWhy, 460),
      watchFor: clip(watchFor || input.watchFor, 240),
      operationalTension: operational ? clip(operational, 300) : input.operationalTension || null,
      source: 'llm',
    };
    serverCache.set(key, result);
    return result;
  } catch (error) {
    console.warn('[today-brief] LLM polish failed', error);
    return null;
  }
}
