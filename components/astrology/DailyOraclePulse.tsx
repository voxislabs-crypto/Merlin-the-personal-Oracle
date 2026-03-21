'use client';

import React from 'react';

interface DailyOraclePulseProps {
  message?: string;
  dayRating?: string;
  onTruthBomb?: () => void;
  loading?: boolean;
}

export function DailyOraclePulse({ message, dayRating, onTruthBomb, loading = false }: DailyOraclePulseProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-rose-500/30 bg-rose-950/15 p-4 animate-pulse">
        <div className="h-3 w-1/3 bg-rose-300/20 rounded mb-3" />
        <div className="h-3 w-full bg-rose-300/20 rounded mb-2" />
        <div className="h-3 w-5/6 bg-rose-300/20 rounded" />
      </div>
    );
  }

  if (!message) return null;

  return (
    <div className="rounded-lg border border-rose-500/30 bg-gradient-to-br from-rose-950/25 to-slate-950/50 p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs uppercase tracking-wider text-rose-300/90">Daily Oracle Pulse</p>
        {dayRating ? <span className="text-xs text-rose-100/80">{dayRating}</span> : null}
      </div>
      <p className="text-sm text-rose-100/95 leading-relaxed">{message}</p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onTruthBomb}
          className="rounded-md border border-rose-400/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/30"
        >
          Tell me something I do not want to hear
        </button>
      </div>
    </div>
  );
}
