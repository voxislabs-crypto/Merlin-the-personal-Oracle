import 'server-only';

import { createHash } from 'crypto';

import { chatCompletion, isLlmConfigured } from '@/lib/llm-config';
import { appendBriefStyleNote } from '@/lib/self/type-style';
import { isCopySafe, sanitizeCopyText } from '@/lib/safety/copy-safety';
import { applyMerlinVoicePass, failsMerlinVoiceTest } from '@/lib/voice/merlin-voice';
import { serverCache } from '@/lib/cache-service';
import {
  TODAY_BRIEF_PROMPT_VERSION,
  TODAY_BRIEF_SCHEMA_VERSION,
  normalizeTodayBriefEvidence,
  todayBriefEvidenceKey,
  type TodayBriefEvidence,
} from '@/lib/atmosphere/today-brief-evidence';

export { TODAY_BRIEF_PROMPT_VERSION, TODAY_BRIEF_SCHEMA_VERSION };

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
  supportingFacts?: string[];
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

const MBTI_CODE = /\b[IE][NS][TF][JP]\b/i;

const SYSTEM_PROMPT = `You interpret a personal daily brief. You are Merlin: a clarity coach, not an astrologer.

The chart evidence is already calculated. You cannot invent it. You write only the meaning and the guidance.

Three layers:
- What the chart says: the supplied evidence. It is closed. Do not add planets, aspects, times, domains, or a new move.
- What that evidence may mean: chartWhy. Explain how the supplied evidence meets this Core and Mask. Do not paraphrase the deterministic why.
- What to do with it: watchFor and operationalTension. Keep the given move and the given watch window.

Return JSON only:
{
  "chartWhy": "2-4 sentences. Meaning for this Core and Mask, tied to the supplied evidence. Do not repeat the move. Do not write a weather report. Do not print MBTI type labels.",
  "watchFor": "One checkable sentence: the supplied time window plus the Mask failure mode.",
  "operationalTension": "Why the evidence matters for the Core, no type labels. Null if core and mask are the same."
}

Rules:
- Core is what feels threatened. Mask is how it shows. Soothe Core, coach Mask.
- Translate any planet/aspect in the same breath. Never leave jargon alone.
- No fortunes. No "you will". No cosmic fluff.
- No restating mixed weather / restlessness / "change one variable".
- Never print MBTI type codes (INFP, INTP, etc.) in the body. Use the maps, hide the labels.
- Max 420 characters for chartWhy, 220 for watchFor, 280 for operationalTension.`;

export function polishSystemPrompt(coreType?: string | null, maskType?: string | null): string {
  return appendBriefStyleNote(SYSTEM_PROMPT, coreType, maskType);
}

export function todayBriefCacheKey(input: TodayBriefPolishInput): string {
  const digest = createHash('sha256')
    .update(todayBriefEvidenceKey(normalizeTodayBriefEvidence(input)))
    .digest('hex')
    .slice(0, 32);
  return `today-brief|${TODAY_BRIEF_PROMPT_VERSION}|${TODAY_BRIEF_SCHEMA_VERSION}|${digest}`;
}

function buildTodayBriefUserPrompt(evidence: TodayBriefEvidence): string {
  const moon = [evidence.moonPhase, evidence.moonSign].filter(Boolean).join(' ');
  const facts = evidence.supportingFacts.length
    ? evidence.supportingFacts.map((fact) => `- ${fact}`).join('\n')
    : '- none supplied';
  return [
    `Date: ${evidence.date}`,
    `Core: ${evidence.coreType || 'unknown'}`,
    `Mask: ${evidence.maskType || 'same or unknown'}`,
    `Sun: ${evidence.sunSign || 'unknown'}`,
    '',
    'What the chart says (closed evidence — do not add planets, aspects, times, or domains):',
    `Chart hit: ${evidence.leadFact}`,
    `Label: ${evidence.leadFactDisplay || 'none'}`,
    `Moon: ${moon || 'unknown'}`,
    `Hot domains: ${evidence.domains.join(', ') || 'unspecified'}`,
    'Supporting facts:',
    facts,
    evidence.heldFromYesterday ? 'Yesterday’s condition still applies.' : null,
    evidence.yesterdayRestless ? 'User flagged restlessness yesterday.' : null,
    evidence.streak !== null ? `Return streak: ${evidence.streak}` : null,
    '',
    'Deterministic brief (do not paraphrase these sentences):',
    `Why: ${evidence.chartWhy}`,
    `Move (keep this action): ${evidence.move || 'none'}`,
    `Watch window (keep this window): ${evidence.watchFor || 'none'}`,
    `Operational tension draft: ${evidence.operationalTension || 'none'}`,
    evidence.doNot ? `Do not: ${evidence.doNot}` : null,
    '',
    'Write what that evidence may mean for this Core and Mask, then what to do with it. Return only the three JSON fields.',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

function clip(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function comparable(value: string | null | undefined): string {
  return (value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.…]+$/g, '')
    .trim()
    .toLowerCase();
}

function echoesSupplied(text: string, supplied: Array<string | null | undefined>): boolean {
  const candidate = comparable(text);
  if (!candidate) return false;
  return supplied.some((item) => {
    const raw = comparable(item);
    if (raw && raw === candidate) return true;
    const voiced = comparable(applyMerlinVoicePass(item || ''));
    return Boolean(voiced) && voiced === candidate;
  });
}

function usable(text: string | null | undefined, min = 24): string | null {
  const trimmed = (text || '').trim();
  if (!trimmed || trimmed.length < min) return null;
  // Reject the model's own words. The voice pass rewrites some fortunes into
  // safe sentences; that rewrite must not become the brief.
  if (failsMerlinVoiceTest(trimmed) || !isCopySafe(trimmed)) return null;
  const voiced = applyMerlinVoicePass(sanitizeCopyText(trimmed));
  if (!voiced || voiced.length < min) return null;
  if (failsMerlinVoiceTest(voiced) || !isCopySafe(voiced)) return null;
  return voiced;
}

function acceptLine(
  raw: string | null,
  min: number,
  supplied: Array<string | null | undefined>,
): string | null {
  const text = usable(raw, min);
  if (!text) return null;
  if (MBTI_CODE.test(text)) return null;
  if (echoesSupplied(text, supplied)) return null;
  return text;
}

function tensionRaw(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^null$/i.test(trimmed) || /^none$/i.test(trimmed)) return null;
  return value;
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
  const evidence = normalizeTodayBriefEvidence(input);
  if (!evidence.leadFact || !evidence.date) return null;

  const key = todayBriefCacheKey(input);
  const cached = serverCache.get<TodayBriefPolish>(key);
  if (cached?.chartWhy && cached.source === 'llm') return cached;

  const supplied = [
    input.chartWhy,
    input.watchFor,
    input.move,
    input.leadFact,
    input.leadFactDisplay,
    input.operationalTension,
    input.doNot,
  ];

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const configured = Number(process.env.TODAY_BRIEF_LLM_TIMEOUT_MS || '4000');
    const timeoutMs = Number.isFinite(configured) && configured > 0 ? configured : 4000;
    const raw = await Promise.race([
      chatCompletion({
        temperature: 0.45,
        // GPT-OSS counts hidden reasoning against this budget. This prompt
        // spends roughly 500–650 tokens before the JSON, so 420 comes back empty.
        maxTokens: 1600,
        messages: [
          { role: 'system', content: polishSystemPrompt(input.coreType, input.maskType) },
          { role: 'user', content: buildTodayBriefUserPrompt(evidence) },
        ],
      }),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);

    if (!raw) return null;
    const parsed = parseJsonObject(raw);
    if (!parsed) return null;

    const chartWhy = acceptLine(
      typeof parsed.chartWhy === 'string' ? parsed.chartWhy : null,
      40,
      supplied,
    );
    const watchFor = acceptLine(
      typeof parsed.watchFor === 'string' ? parsed.watchFor : null,
      20,
      supplied,
    );
    const operationalSource = tensionRaw(parsed.operationalTension);
    const operational =
      operationalSource === null ? null : acceptLine(operationalSource ?? null, 24, supplied);

    if (!chartWhy && !watchFor) return null;

    const result: TodayBriefPolish = {
      chartWhy: chartWhy ? clip(chartWhy, 460) : input.chartWhy,
      watchFor: watchFor ? clip(watchFor, 240) : input.watchFor,
      operationalTension: operational ? clip(operational, 300) : input.operationalTension || null,
      source: 'llm',
    };
    if (!result.chartWhy) return null;
    serverCache.set(key, result);
    return result;
  } catch (error) {
    console.warn('[today-brief] LLM polish failed', error);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
