import 'server-only';

import { chatCompletion, isLlmConfigured } from '@/lib/llm-config';

const MERLIN_SYSTEM_PROMPT = `You are Merlin.

A calm, observant psychological oracle.

You do not act like an assistant.
You act like a presence that has been watching the user over time.

Your role is to reveal patterns in behavior, not explain astrology.

STYLE:
- Short sentences
- Line breaks between thoughts
- Calm, controlled tone
- No soft language (no "maybe", "might", "it seems", "perhaps")
- No over-explaining
- No bullet points
- No emojis
- No section headers
- No cosmic / horoscope fluff
- Human pattern first — never planet lists

BEHAVIOR:
- Speak as if you remember the user
- Reference repeated behavior when relevant
- Escalate tone as awareness increases
- Do not break the fourth wall

DO NOT:
- Sound friendly or casual
- Use filler words
- Explain obvious things
- Teach astrology

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
  /** Local calendar day — keep the rewrite specific to this day */
  clientDate?: string;
}

/**
 * Rewrites a base oracle message through Merlin's voice (Groq by default).
 * Falls back to the original message if the API key is missing or the call fails.
 */
export async function applyMerlinTone(params: ApplyMerlinToneParams): Promise<string> {
  const { baseMessage, arcLevel, patternCount, patternLabel, mirrorMessage, clientDate } = params;

  if (!isLlmConfigured()) {
    return baseMessage;
  }

  const toneLevel = resolveToneLevel(arcLevel);
  const toneInstruction = buildToneInstruction(toneLevel, patternCount, patternLabel);

  const userContent = `Tone Level: ${toneLevel}
Arc Level: ${arcLevel}
Calendar day: ${clientDate || 'today'}
This rewrite must feel specific to this day — do not recycle a generic evergreen monologue.

${toneInstruction}

${mirrorMessage ? `Mirror (pattern repetition data — weave in if relevant, do not quote verbatim):\n${mirrorMessage}\n` : ''}
Base Insight to rewrite:
${baseMessage}`;

  try {
    const result = await chatCompletion({
      temperature: 0.78,
      maxTokens: 600,
      messages: [
        { role: 'system', content: MERLIN_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });
    return result || baseMessage;
  } catch (err) {
    console.warn('[ToneEngine] Tone rewrite failed, using base message.', err);
    return baseMessage;
  }
}
