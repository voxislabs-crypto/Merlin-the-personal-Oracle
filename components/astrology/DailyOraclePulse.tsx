'use client';

import React, { useEffect, useState } from 'react';

interface DailyOraclePulseProps {
  message?: string;
  dayRating?: string;
  /** Local calendar day (YYYY-MM-DD) this pulse belongs to */
  date?: string;
  onTruthBomb?: () => void;
  onFeedback?: (signal: 'hit' | 'missed') => void | boolean | Promise<boolean | void>;
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
  const [vote, setVote] = useState<'hit' | 'missed' | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    setVote(null);
    setStatus('idle');
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

  const choose = async (signal: 'hit' | 'missed') => {
    if (status === 'saving' || vote) return;
    setStatus('saving');
    setErrorText(null);
    try {
      const saved = await onFeedback?.(signal);
      if (saved === false) {
        setStatus('error');
        setErrorText('Could not save that. Try again.');
        return;
      }
      setVote(signal);
      setStatus('saved');
    } catch {
      setStatus('error');
      setErrorText('Could not save that. Try again.');
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void choose('hit')}
            disabled={status === 'saving' || vote !== null}
            aria-pressed={vote === 'hit'}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold disabled:cursor-default ${
              vote === 'hit'
                ? 'border-emerald-300 bg-emerald-400/30 text-emerald-50'
                : 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50'
            }`}
          >
            That hit
          </button>
          <button
            type="button"
            onClick={() => void choose('missed')}
            disabled={status === 'saving' || vote !== null}
            aria-pressed={vote === 'missed'}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold disabled:cursor-default ${
              vote === 'missed'
                ? 'border-slate-200 bg-slate-400/30 text-white'
                : 'border-slate-400/40 bg-slate-500/20 text-slate-100 hover:bg-slate-500/30 disabled:opacity-50'
            }`}
          >
            Missed me
          </button>
          {status === 'saving' ? (
            <span className="self-center text-xs text-rose-100/70">Saving…</span>
          ) : null}
          {status === 'saved' ? (
            <span className="self-center text-xs text-emerald-200/90">Noted. Merlin will weight the next pulse off that.</span>
          ) : null}
          {status === 'error' && errorText ? (
            <span className="self-center text-xs text-amber-200/90">{errorText}</span>
          ) : null}
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
