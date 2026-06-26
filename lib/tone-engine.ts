import 'server-only';

const XAI_API_BASE = 'https://api.x.ai/v1';
const XAI_API_KEY = process.env.XAI_API_KEY;

const MERLIN_SYSTEM_PROMPT = `You are Merlin.

A calm, observant psychological oracle.

You do not act like an assistant.
You act like a presence that has been watching the user over time.

Your role is to reveal patterns in behavior, not explain them.

STYLE:
- Short sentences
- Line breaks between thoughts
- Calm, controlled tone
- No soft language (no "maybe", "might", "it seems", "perhaps")
- No over-explaining
- No bullet points
- No emojis
- No section headers

BEHAVIOR:
- Speak as if you remember the user
- Reference repeated behavior when relevant
- Escalate tone as awareness increases
- Do not break the fourth wall

DO NOT:
- Sound friendly or casual
- Give advice like a coach
- Use filler words
- Explain obvious things

EXAMPLE TONE:

"You've done this before.

You recognized it.

You didn't act.

And now it's happening again."

TASK:
Rewrite the provided insight into Merlin's voice.
Return only the final message. No preamble. No sign-off.`;

type ToneLevel = 'soft' | 'direct' | 'confrontational';

function resolveToneLevel(arcLevel: number): ToneLevel {
  if (arcLevel < 2) return 'soft';
  if (arcLevel < 4) return 'direct';
  return 'confrontational';
}

function buildToneInstruction(
  toneLevel: ToneLevel,
  patternCount: number,
  patternLabel?: string
): string {
  const repetitionNote =
    patternCount >= 6
      ? `This pattern (${patternLabel || 'the loop'}) has repeated ${patternCount} times. Escalate accordingly — the user is choosing this, not stumbling into it.`
      : patternCount >= 3
      ? `This pattern has appeared ${patternCount} times. Make repetition undeniable without labeling it as data.`
      : patternCount === 2
      ? `This has appeared twice. Note the repetition without over-emphasizing it.`
      : '';

  const toneNote =
    toneLevel === 'confrontational'
      ? 'Be direct. No softening. The user is at a level where comfort is a trap.'
      : toneLevel === 'direct'
      ? 'Be clear and calm. Lean into the uncomfortable truth without going cold.'
      : 'Be observant and slightly uncomfortable — not harsh. The user is still building awareness.';

  return [toneNote, repetitionNote].filter(Boolean).join('\n');
}

export interface ApplyMerlinToneParams {
  baseMessage: string;
  arcLevel: number;
  patternCount: number;
  patternLabel?: string;
  mirrorMessage?: string;
}

/**
 * Rewrites a base oracle message through Merlin's voice using Grok.
 * Falls back to the original message if the API key is missing or the call fails.
 */
export async function applyMerlinTone(params: ApplyMerlinToneParams): Promise<string> {
  const { baseMessage, arcLevel, patternCount, patternLabel, mirrorMessage } = params;

  if (!XAI_API_KEY) {
    return baseMessage;
  }

  const toneLevel = resolveToneLevel(arcLevel);
  const toneInstruction = buildToneInstruction(toneLevel, patternCount, patternLabel);

  const userContent = `Tone Level: ${toneLevel}
Arc Level: ${arcLevel}

${toneInstruction}

${mirrorMessage ? `Mirror (pattern repetition data — weave in if relevant, do not quote verbatim):\n${mirrorMessage}\n` : ''}
Base Insight to rewrite:
${baseMessage}`;

  try {
    const response = await fetch(`${XAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        messages: [
          { role: 'system', content: MERLIN_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.72,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      console.warn('[ToneEngine] xAI call failed, using base message. Status:', response.status);
      return baseMessage;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const result = data?.choices?.[0]?.message?.content?.trim();
    return result || baseMessage;
  } catch (err) {
    console.warn('[ToneEngine] Tone rewrite failed, using base message.', err);
    return baseMessage;
  }
}
