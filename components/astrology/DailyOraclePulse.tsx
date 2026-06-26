'use client';

import React from 'react';

interface DailyOraclePulseProps {
  message?: string;
  dayRating?: string;
  onTruthBomb?: () => void;
  onFeedback?: (signal: 'hit' | 'missed') => void;
  loading?: boolean;
}

export function DailyOraclePulse({ message, dayRating, onTruthBomb, onFeedback, loading = false }: DailyOraclePulseProps) {
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

  return (
    <div className="rounded-[1.4rem] border border-rose-400/30 bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.18),_transparent_45%),linear-gradient(135deg,rgba(76,5,25,0.55),rgba(2,6,23,0.72))] p-5 shadow-[0_18px_50px_rgba(76,5,25,0.22)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-rose-300/90">Daily Oracle Pulse</p>
          <h3 className="mt-2 text-lg md:text-xl font-semibold text-rose-50">What the field is asking from you today</h3>
        </div>
        {dayRating ? <span className="self-start rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1 text-xs text-rose-100/85">{dayRating}</span> : null}
      </div>
      <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
        <p className="text-sm md:text-[15px] text-rose-50/95 leading-7">{message}</p>
      </div>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onFeedback?.('hit')}
            className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
          >
            That hit
          </button>
          <button
            type="button"
            onClick={() => onFeedback?.('missed')}
            className="rounded-full border border-slate-400/40 bg-slate-500/20 px-3.5 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-500/30"
          >
            Missed me
          </button>
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
