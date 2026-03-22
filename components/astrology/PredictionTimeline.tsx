'use client';

import React from 'react';

export interface PredictionTimelineEntry {
  feedbackId: string;
  date: string;
  label: string;
  theme: string;
  resonated: boolean;
  accuracyScore: number;
  planets: string[];
}

interface PredictionTimelineProps {
  entries: PredictionTimelineEntry[];
  loading?: boolean;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PredictionTimeline({ entries, loading = false }: PredictionTimelineProps) {
  if (loading) {
    return (
      <div className="p-5 rounded-lg border border-slate-700 bg-slate-900/45">
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-slate-700/80 rounded w-48" />
          <div className="h-3 bg-slate-700/60 rounded w-full" />
          <div className="h-3 bg-slate-700/60 rounded w-11/12" />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-5 rounded-lg border border-slate-700 bg-slate-900/45">
        <h3 className="text-lg font-semibold text-slate-100">Prediction Timeline</h3>
        <p className="text-sm text-slate-400 mt-2">
          No resonance history yet. Once you rate predictions with thumbs up or down, Merlin will show your track record here.
        </p>
      </div>
    );
  }

  const recent = [...entries]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 20);

  return (
    <div className="p-5 rounded-lg border border-cyan-500/30 bg-cyan-950/10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-cyan-100">Prediction Timeline</h3>
        <span className="text-xs text-cyan-300/90">Last {recent.length} rated predictions</span>
      </div>

      <div className="space-y-3">
        {recent.map((entry) => (
          <div
            key={entry.feedbackId}
            className="rounded-md border border-cyan-500/20 bg-slate-900/50 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-100">{entry.label}</p>
              <span className="text-xs text-slate-400">{formatDate(entry.date)}</span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded border border-slate-600 px-2 py-0.5 text-slate-300">{entry.theme}</span>
              <span
                className={`rounded border px-2 py-0.5 ${
                  entry.resonated
                    ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                    : 'border-rose-500/40 text-rose-300 bg-rose-500/10'
                }`}
              >
                {entry.resonated ? 'Resonated' : 'Did not resonate'}
              </span>
              <span className="rounded border border-cyan-500/30 px-2 py-0.5 text-cyan-200">
                Accuracy {entry.accuracyScore}%
              </span>
            </div>

            {entry.planets.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">Planets: {entry.planets.join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
