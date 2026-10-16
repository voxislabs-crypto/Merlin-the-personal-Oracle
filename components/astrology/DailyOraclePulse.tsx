'use client';

import React, { useEffect, useState } from 'react';

interface DailyOraclePulseProps {
  message?: string;
  dayRating?: string;
  /** Local calendar day (YYYY-MM-DD) this pulse belongs to */
  date?: string;
  onTruthBomb?: () => void;
  onFeedback?: (
    signal: 'hit' | 'missed',
    kind: 'resonance' | 'usefulness',
  ) => void | boolean | Promise<boolean | void>;
  loading?: boolean;
}

function formatPulseDate(date?: string): string | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

export function DailyOraclePulse({
  message,
  dayRating,
  date,
  onTruthBomb,
  onFeedback,
  loading = false,
}: DailyOraclePulseProps) {
  const [votes, setVotes] = useState<Partial<Record<'resonance' | 'usefulness', 'hit' | 'missed'>>>({});
  const [pending, setPending] = useState<'resonance' | 'usefulness' | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    setVotes({});
    setPending(null);
    setErrorText(null);
  }, [date, message]);

  if (loading) {
    return (
      <div className="rounded-[1.4rem] border border-rose-500/30 bg-rose-950/15 p-5 animate-pulse">
        <div className="h-3 w-1/3 bg-rose-300/20 rounded mb-3" />
        <div className="h-4 w-2/3 bg-rose-300/15 rounded mb-4" />
        <div className="h-3 w-full bg-rose-300/20 rounded mb-2" />
        <div className="h-3 w-5/6 bg-rose-300/20 rounded mb-2" />
        <div className="h-3 w-4/6 bg-rose-300/20 rounded" />
      </div>
    );
  }

  if (!message) return null;

  const dateLabel = formatPulseDate(date);

  const choose = async (kind: 'resonance' | 'usefulness', signal: 'hit' | 'missed') => {
    if (pending || votes[kind]) return;
    setPending(kind);
    setErrorText(null);
    try {
      const saved = await onFeedback?.(signal, kind);
      if (saved === false) {
        setErrorText('Could not save that. Try again.');
        setPending(null);
        return;
      }
      setVotes((current) => ({ ...current, [kind]: signal }));
      setPending(null);
    } catch {
      setErrorText('Could not save that. Try again.');
      setPending(null);
    }
  };

  return (
    <div className="rounded-[1.4rem] border border-rose-400/30 bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.18),_transparent_45%),linear-gradient(135deg,rgba(76,5,25,0.55),rgba(2,6,23,0.72))] p-5 shadow-[0_18px_50px_rgba(76,5,25,0.22)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-rose-300/90">Daily Oracle Pulse</p>
          <h3 className="mt-2 text-lg md:text-xl font-semibold text-rose-50">What the field is asking from you today</h3>
          {dateLabel ? (
            <p className="mt-1 font-mono text-[11px] text-rose-200/55">{dateLabel}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dateLabel ? (
            <span className="self-start rounded-full border border-rose-300/20 bg-black/20 px-3 py-1 text-[11px] text-rose-100/70">
              {dateLabel}
            </span>
          ) : null}
          {dayRating ? (
            <span className="self-start rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1 text-xs text-rose-100/85">
              {dayRating}
            </span>
          ) : null}
        </div>
      </div>
      <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
        <p className="text-sm md:text-[15px] text-rose-50/95 leading-7">{message}</p>
      </div>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <PulseQuestion
            question="Did this description feel relevant?"
            yesLabel="Relevant"
            noLabel="Not really"
            vote={votes.resonance}
            disabled={pending !== null}
            onYes={() => void choose('resonance', 'hit')}
            onNo={() => void choose('resonance', 'missed')}
          />
          <PulseQuestion
            question="Did the suggestion help?"
            yesLabel="It helped"
            noLabel="Not really"
            vote={votes.usefulness}
            disabled={pending !== null}
            onYes={() => void choose('usefulness', 'hit')}
            onNo={() => void choose('usefulness', 'missed')}
          />
          {pending ? <span className="text-xs text-rose-100/70">Saving…</span> : null}
          {errorText ? <span className="text-xs text-amber-200/90">{errorText}</span> : null}
        </div>
        <button
          type="button"
          onClick={onTruthBomb}
          className="rounded-full border border-rose-300/40 bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-50 hover:bg-rose-500/30"
        >
          Tell me something I do not want to hear
        </button>
      </div>
    </div>
  );
}

function PulseQuestion({
  question,
  yesLabel,
  noLabel,
  vote,
  disabled,
  onYes,
  onNo,
}: {
  question: string;
  yesLabel: string;
  noLabel: string;
  vote?: 'hit' | 'missed';
  disabled: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div>
      <p className="text-xs text-rose-100/80">{question}</p>
      {vote ? (
        <p className="mt-1 text-xs text-emerald-200/90">Noted.</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onYes}
            disabled={disabled}
            aria-label={`${question} ${yesLabel}`}
            className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {yesLabel}
          </button>
          <button
            type="button"
            onClick={onNo}
            disabled={disabled}
            aria-label={`${question} ${noLabel}`}
            className="rounded-full border border-slate-400/40 bg-slate-500/20 px-3.5 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-500/30 disabled:opacity-50"
          >
            {noLabel}
          </button>
        </div>
      )}
    </div>
  );
}
