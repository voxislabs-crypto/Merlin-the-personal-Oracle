import type { ProphecyEra, ProphecyStyle } from '@/lib/astrology/prophecy';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_PROPHECY_MODEL || process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

export type ProphecyPolishMode = 'engine' | 'groq';

export async function polishProphecyWithGroq(params: {
  prophecy: string;
  style: ProphecyStyle;
  era: ProphecyEra;
  strictMeter?: boolean;
}): Promise<{ prophecy: string; model: string } | null> {
  const { prophecy, style, era, strictMeter = false } = params;

  if (!GROQ_API_KEY) {
    return null;
  }

  const styleInstructions =
    style === 'sonnet'
      ? strictMeter
        ? 'Preserve exactly 14 lines. Keep each line near iambic pentameter and do not break line count.'
        : 'Preserve exactly 14 lines and sonnet cadence, while improving diction and flow.'
      : 'Keep as a compact omen paragraph, vivid but concise.';

  const systemPrompt = [
    'You are a literary editor for an astrology product.',
    'Rewrite prophecy text to improve elegance and clarity without changing factual signal content.',
    'Never add medical, legal, or deterministic claims.',
    'Keep tone grounded, actionable, and non-fatalistic.',
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
        model: GROQ_MODEL,
        temperature: 0.45,
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
      model: GROQ_MODEL,
    };
  } catch {
    return null;
  }
}
