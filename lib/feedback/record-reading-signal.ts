import 'server-only';

import { detectPatternFromText, logInteractionEvent } from '@/lib/pattern-mirror';
import { resonanceDB } from '@/lib/resonance-database';

export type ReadingSignal = 'hit' | 'missed' | 'up' | 'down' | 'landed' | 'somewhat';

function accuracyFor(signal: ReadingSignal): { resonated: boolean; accuracyScore: number } {
  if (signal === 'hit' || signal === 'up' || signal === 'landed') {
    return { resonated: true, accuracyScore: 0.85 };
  }
  if (signal === 'somewhat') return { resonated: true, accuracyScore: 0.55 };
  return { resonated: false, accuracyScore: 0.25 };
}

/**
 * One reading vote writes both stores:
 * pattern mirror (what kind of loop the text sounds like) and
 * resonance weights (whether this reading landed).
 * Either store can fail without dropping the other.
 */
export async function recordReadingSignal(input: {
  userId: string;
  source: string;
  aspectId: string;
  theme: string;
  signal: ReadingSignal;
  message?: string;
  notes?: string;
  mbtiType?: string;
}): Promise<{ pattern: boolean; resonance: boolean }> {
  const score = accuracyFor(input.signal);
  const text = input.message || input.notes || input.signal;
  const detected = detectPatternFromText(text);
  const logged = await logInteractionEvent({
    userId: input.userId,
    type: input.source,
    content: input.message || input.notes,
    detectedPattern: detected.key,
    confidence: detected.confidence,
    feedbackSignal: input.signal,
    metadata: {
      source: input.source,
      aspectId: input.aspectId,
      theme: input.theme,
    },
  });

  let resonance = false;
  try {
    await resonanceDB.ensureUser({
      userId: input.userId,
      mbtiType: input.mbtiType,
      createdAt: new Date(),
    });
    await resonanceDB.processFeedback(input.userId, input.aspectId, input.theme, {
      resonated: score.resonated,
      accuracyScore: score.accuracyScore,
      notes: input.notes || input.message,
    });
    resonance = true;
  } catch (error) {
    console.warn(
      '[feedback] resonance write failed',
      error instanceof Error ? error.message.slice(0, 160) : error,
    );
  }

  return { pattern: Boolean(logged), resonance };
}
