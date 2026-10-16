'use client';

import { useCallback, useEffect, useState } from 'react';

type Vote = 'yes' | 'no';
type SignalKind = 'resonance' | 'usefulness';

const STORAGE_PREFIX = 'merlin_signal_';

function readVote(key: string): Vote | null {
  try {
    const stored = localStorage.getItem(key);
    return stored === 'yes' || stored === 'no' ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Two separate questions for today's brief.
 * Resonance and usefulness may inform later wording.
 * Whether a named thing happened is YesterdayLandCheck, not this control.
 */
export function TodaySignalFeedback({
  userId,
  itemId,
  theme = 'forecast',
}: {
  userId?: string | null;
  itemId: string;
  theme?: string;
}) {
  const resonanceKey = `${STORAGE_PREFIX}${itemId}:resonance`;
  const usefulnessKey = `${STORAGE_PREFIX}${itemId}:usefulness`;
  const [resonance, setResonance] = useState<Vote | null>(null);
  const [usefulness, setUsefulness] = useState<Vote | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setResonance(readVote(resonanceKey));
    setUsefulness(readVote(usefulnessKey));
    setReady(true);
  }, [resonanceKey, usefulnessKey]);

  const submit = useCallback(
    async (kind: SignalKind, vote: Vote) => {
      if (kind === 'resonance') {
        if (resonance) return;
        setResonance(vote);
        try {
          localStorage.setItem(resonanceKey, vote);
        } catch {
          /* local vote still shows */
        }
      } else {
        if (usefulness) return;
        setUsefulness(vote);
        try {
          localStorage.setItem(usefulnessKey, vote);
        } catch {
          /* local vote still shows */
        }
      }

      if (!userId) return;
      const helpful = vote === 'yes';
      try {
        await fetch('/api/resonance-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            aspectId: itemId,
            theme,
            feedback: {
              kind,
              resonated: helpful,
              accuracyScore: kind === 'usefulness' ? (helpful ? 0.65 : 0.4) : helpful ? 0.85 : 0.25,
              notes:
                kind === 'resonance'
                  ? `Resonance: ${helpful ? 'felt relevant' : 'did not feel relevant'}`
                  : `Usefulness: ${helpful ? 'suggestion helped' : 'suggestion did not help'}`,
            },
          }),
        });
      } catch {
        /* local vote still counts */
      }
    },
    [itemId, resonance, resonanceKey, theme, usefulness, usefulnessKey, userId],
  );

  if (!ready) return null;

  return (
    <div className="space-y-2" role="group" aria-label="Today's reflection feedback">
      <SignalRow
        question="Did this description feel relevant?"
        vote={resonance}
        yesLabel="Relevant"
        noLabel="Not really"
        onYes={() => void submit('resonance', 'yes')}
        onNo={() => void submit('resonance', 'no')}
      />
      <SignalRow
        question="Did the suggestion help?"
        vote={usefulness}
        yesLabel="It helped"
        noLabel="Not really"
        onYes={() => void submit('usefulness', 'yes')}
        onNo={() => void submit('usefulness', 'no')}
      />
    </div>
  );
}

function SignalRow({
  question,
  vote,
  yesLabel,
  noLabel,
  onYes,
  onNo,
}: {
  question: string;
  vote: Vote | null;
  yesLabel: string;
  noLabel: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-3">
      <p className="text-sm text-slate-200">{question}</p>
      {vote ? (
        <p className="mt-1.5 text-xs text-emerald-300/90">Noted.</p>
      ) : (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onYes}
            aria-label={`${question} ${yesLabel}`}
            className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20"
          >
            {yesLabel}
          </button>
          <button
            type="button"
            onClick={onNo}
            aria-label={`${question} ${noLabel}`}
            className="rounded-full border border-slate-500/40 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/70"
          >
            {noLabel}
          </button>
        </div>
      )}
    </div>
  );
}
