import type { ProphecyEra, ProphecyStyle } from '@/lib/astrology/prophecy';
import { DEFAULT_GROQ_FAST_MODEL, resolveGroqModel } from '@/lib/llm-config';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

export type ProphecyPolishMode = 'engine' | 'groq';

export async function polishProphecyWithGroq(params: {
  prophecy: string;
  style: ProphecyStyle;
  era: ProphecyEra;
  strictMeter?: boolean;
  /** Higher on regenerate so polished text diverges */
  temperature?: number;
}): Promise<{ prophecy: string; model: string } | null> {
  const { prophecy, style, era, strictMeter = false, temperature = 0.45 } = params;

  if (!GROQ_API_KEY) {
    return null;
  }

  const groqModel = resolveGroqModel(
    process.env.GROQ_PROPHECY_MODEL || process.env.GROQ_MODEL,
    DEFAULT_GROQ_FAST_MODEL
  );

  const styleInstructions =
    style === 'sonnet'
      ? strictMeter
        ? 'Preserve exactly 14 lines. Keep each line near iambic pentameter and do not break line count.'
        : 'Preserve exactly 14 lines and sonnet cadence, while improving diction and flow.'
      : 'Keep as a compact omen paragraph, vivid but concise.';

  const systemPrompt = [
    'You are a literary editor for Merlin — clarity over mystique.',
    'Rewrite prophecy text for elegance without changing factual signal content.',
    'Prefer human stakes over sky jargon. Never sound like a fortune cookie or mystic.',
    'Never add medical, legal, or deterministic claims.',
    'Keep tone grounded, actionable, and non-fatalistic. Observations, not destinies.',
  ].join(' ');

  const userPrompt = [
    `Era: ${era}`,
    `Style: ${style}`,
    `Strict meter: ${strictMeter ? 'on' : 'off'}`,
    styleInstructions,
    'Return only the rewritten prophecy text with no preface.',
    'Original prophecy:',
    prophecy,
  ].join('\n\n');

  try {
    const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: groqModel,
        temperature: Math.min(1.2, Math.max(0.2, temperature)),
        max_tokens: style === 'sonnet' ? 800 : 260,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return null;
    }

    return {
      prophecy: content.trim(),
      model: groqModel,
    };
  } catch {
    return null;
  }
}
