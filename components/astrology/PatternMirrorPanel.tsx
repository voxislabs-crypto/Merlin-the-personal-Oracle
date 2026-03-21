'use client';

import React from 'react';

interface PatternMirrorData {
  dominant?: {
    pattern: string;
    label: string;
    count: number;
    summary: string;
  } | null;
  frequency: Array<{
    pattern: string;
    label: string;
    count: number;
  }>;
  recentTimeline: Array<{
    id: string;
    type: string;
    label: string;
    content?: string | null;
    createdAt: string;
    feedbackSignal?: string | null;
  }>;
  trends: Array<{
    pattern: string;
    label: string;
    count: number;
  }>;
}

export function PatternMirrorPanel({ data, loading = false }: { data?: PatternMirrorData | null; loading?: boolean }) {
  if (loading) {
    return (
      <div className="rounded-[1.4rem] border border-indigo-500/25 bg-indigo-950/10 p-4 animate-pulse">
        <div className="h-4 w-40 bg-indigo-300/20 rounded mb-4" />
        <div className="grid grid-cols-1 gap-4">
          <div className="h-28 rounded-2xl bg-indigo-300/10" />
          <div className="h-28 rounded-2xl bg-indigo-300/10" />
          <div className="h-28 rounded-2xl bg-indigo-300/10" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-[1.4rem] border border-indigo-500/25 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_42%),linear-gradient(135deg,rgba(30,27,75,0.55),rgba(2,6,23,0.72))] p-5 shadow-[0_18px_50px_rgba(30,27,75,0.16)]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-indigo-300/90">Pattern Mirror</p>
          <h3 className="text-lg font-semibold text-indigo-100">Visible evidence of repetition</h3>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-indigo-400/20 bg-slate-950/35 p-4">
          <p className="text-xs uppercase tracking-wider text-indigo-300/75 mb-2">Dominant Pattern</p>
          {data.dominant ? (
            <>
              <p className="text-base font-semibold text-indigo-100">{data.dominant.label}</p>
              <p className="text-xs text-indigo-200/75 mt-1">Seen {data.dominant.count} times</p>
              <p className="text-sm text-slate-200 mt-3 leading-relaxed">{data.dominant.summary}</p>
            </>
          ) : (
            <p className="text-sm text-slate-300">No dominant pattern yet. Merlin needs more evidence.</p>
          )}
        </div>

        <div className="rounded-2xl border border-indigo-400/20 bg-slate-950/35 p-4">
          <p className="text-xs uppercase tracking-wider text-indigo-300/75 mb-3">Pattern Frequency</p>
          <div className="space-y-3">
            {data.frequency.slice(0, 5).map((item) => {
              const width = Math.min(100, item.count * 18);
              return (
                <div key={item.pattern}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm text-indigo-100">{item.label}</span>
                    <span className="text-xs text-indigo-200/70">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-indigo-950/80 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-400" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
            {data.frequency.length === 0 && <p className="text-sm text-slate-300">No pattern frequency yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-400/20 bg-slate-950/35 p-4">
          <p className="text-xs uppercase tracking-wider text-indigo-300/75 mb-3">Recent Timeline</p>
          <div className="space-y-3 max-h-64 overflow-auto pr-1">
            {data.recentTimeline.slice(0, 6).map((item) => (
              <div key={item.id} className="border-l border-indigo-400/30 pl-3">
                <p className="text-sm text-indigo-100">{item.label}</p>
                <p className="text-[11px] text-indigo-200/65 mt-0.5">{new Date(item.createdAt).toLocaleString()}</p>
                {item.feedbackSignal ? <p className="text-[11px] text-cyan-300 mt-1">Feedback: {item.feedbackSignal}</p> : null}
              </div>
            ))}
            {data.recentTimeline.length === 0 && <p className="text-sm text-slate-300">No timeline evidence yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
