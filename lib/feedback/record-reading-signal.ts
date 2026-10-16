import 'server-only';

import { detectPatternFromText, logInteractionEvent } from '@/lib/pattern-mirror';
import { resonanceDB } from '@/lib/resonance-database';

export type ReadingSignal = 'hit' | 'missed' | 'up' | 'down' | 'landed' | 'somewhat';
export type FeedbackKind = 'resonance' | 'usefulness' | 'accuracy';

function accuracyFor(signal: ReadingSignal): { resonated: boolean; accuracyScore: number } {
  if (signal === 'hit' || signal === 'up' || signal === 'landed') {
    return { resonated: true, accuracyScore: 0.85 };
  }
  if (signal === 'somewhat') return { resonated: true, accuracyScore: 0.55 };
  return { resonated: false, accuracyScore: 0.25 };
}

/**
 * Resonance and usefulness may move resonance weights.
 * Accuracy is an evaluation log only. It does not update those weights
 * or attach a pattern tag personalization can read.
 */
export async function recordReadingSignal(input: {
  userId: string;
  source: string;
  aspectId: string;
  theme: string;
  signal: ReadingSignal;
  kind?: FeedbackKind;
  message?: string;
  notes?: string;
  mbtiType?: string;
}): Promise<{ pattern: boolean; resonance: boolean; evaluation: boolean }> {
  const kind: FeedbackKind =
    input.kind === 'usefulness' || input.kind === 'accuracy' ? input.kind : 'resonance';
  const score = accuracyFor(input.signal);
  const text = input.message || input.notes || input.signal;

  if (kind === 'accuracy') {
    const logged = await logInteractionEvent({
      userId: input.userId,
      type: 'evaluation_log',
      content: input.message || input.notes,
      feedbackSignal: input.signal,
      metadata: {
        source: 'evaluation_log',
        aspectId: input.aspectId,
        theme: input.theme,
        kind: 'accuracy',
        personalization: false,
      },
    });
    return { pattern: false, resonance: false, evaluation: Boolean(logged) };
  }

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
      kind,
    },
  });

  let resonance = false;
  try {
    await resonanceDB.ensureUser({
      userId: input.userId,
      mbtiType: input.mbtiType,
      createdAt: new Date(),
    });
    const weightAspectId =
      kind === 'usefulness' ? `${input.aspectId}:usefulness` : input.aspectId;
    await resonanceDB.processFeedback(input.userId, weightAspectId, input.theme, {
      resonated: score.resonated,
      accuracyScore: kind === 'usefulness' ? Math.min(score.accuracyScore, 0.65) : score.accuracyScore,
      notes: input.notes || input.message,
    });
    resonance = true;
  } catch (error) {
    console.warn(
      '[feedback] resonance write failed',
      error instanceof Error ? error.message.slice(0, 160) : error,
    );
  }

  return { pattern: Boolean(logged), resonance, evaluation: false };
}
