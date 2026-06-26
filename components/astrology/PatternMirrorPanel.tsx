'use client';

import React from 'react';

interface PatternMirrorData {
  dominant?: {
    pattern: string;
    label: string;
    count: number;
    summary: string;
    trendStatus?: 'rising' | 'stable' | 'fading' | 'new';
    delta?: number;
  } | null;
  mirrorInsight?: {
    pattern: string;
    label: string;
    count: number;
    lastSeen?: string;
    message: string;
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
    previousCount?: number;
    delta?: number;
    status?: 'rising' | 'stable' | 'fading' | 'new';
  }>;
}

function getTrendBadgeClasses(status?: 'rising' | 'stable' | 'fading' | 'new') {
  switch (status) {
    case 'rising':
      return 'border-amber-400/35 bg-amber-400/12 text-amber-100';
    case 'fading':
      return 'border-emerald-400/35 bg-emerald-400/12 text-emerald-100';
    case 'new':
      return 'border-cyan-400/35 bg-cyan-400/12 text-cyan-100';
    default:
      return 'border-indigo-300/25 bg-indigo-300/10 text-indigo-100';
  }
}

function getTrendLabel(status?: 'rising' | 'stable' | 'fading' | 'new') {
  switch (status) {
    case 'rising':
      return 'Rising';
    case 'fading':
      return 'Fading';
    case 'new':
      return 'New';
    default:
      return 'Stable';
  }
}

function getIntensityMessage(count: number): string {
  if (count <= 2) return 'This pattern is emerging.';
  if (count <= 5) return 'This pattern is stabilizing.';
  return 'This pattern is dominating your behavior.';
}

function getIntensityClasses(count: number): string {
  if (count <= 2) return 'text-cyan-300/80';
  if (count <= 5) return 'text-amber-300/85';
  return 'text-rose-300 font-semibold';
}

function handleAskKeyDown(event: React.KeyboardEvent<HTMLElement>, onAsk?: () => void) {
  if (!onAsk) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onAsk();
  }
}

export function PatternMirrorPanel({
  data,
  loading = false,
  onAskContext,
  selectedContextLabel,
}: {
  data?: PatternMirrorData | null;
  loading?: boolean;
  onAskContext?: (label: string, prompt: string) => void;
  selectedContextLabel?: string;
}) {
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

  const dominantPattern = data.dominant;

  return (
    <div className="rounded-[1.4rem] border border-indigo-500/25 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_42%),linear-gradient(135deg,rgba(30,27,75,0.55),rgba(2,6,23,0.72))] p-5 shadow-[0_18px_50px_rgba(30,27,75,0.16)]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-indigo-300/90">Pattern Mirror</p>
          <h3 className="text-lg font-semibold text-indigo-100">Visible evidence of repetition</h3>
        </div>
        {data.dominant?.trendStatus ? (
          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getTrendBadgeClasses(data.dominant.trendStatus)}`}>
            {getTrendLabel(data.dominant.trendStatus)}
          </span>
        ) : null}
      </div>

      <div className="space-y-4">
        <div
          className={`rounded-2xl border border-indigo-400/20 bg-slate-950/35 p-4 ${onAskContext && dominantPattern ? 'group cursor-pointer transition hover:border-cyan-400/35 hover:bg-slate-950/50' : ''} ${selectedContextLabel === dominantPattern?.label ? 'ring-1 ring-cyan-300/40 border-cyan-300/40 bg-cyan-500/10' : ''}`}
          onClick={dominantPattern && onAskContext ? () => onAskContext(dominantPattern.label, `What is this ${dominantPattern.label} pattern trying to show me right now?`) : undefined}
          onKeyDown={dominantPattern && onAskContext ? (event) => handleAskKeyDown(event, () => onAskContext(dominantPattern.label, `What is this ${dominantPattern.label} pattern trying to show me right now?`)) : undefined}
          role={dominantPattern && onAskContext ? 'button' : undefined}
          tabIndex={dominantPattern && onAskContext ? 0 : undefined}
        >
          <p className="text-xs uppercase tracking-wider text-indigo-300/75 mb-2">Dominant Pattern</p>
          {data.dominant ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-indigo-100">{data.dominant.label}</p>
                  <p className="text-xs text-indigo-200/75 mt-1">Seen {data.dominant.count} times</p>
                  <p className={`text-xs mt-1 ${getIntensityClasses(data.dominant.count)}`}>{getIntensityMessage(data.dominant.count)}</p>
                </div>
                {data.dominant.trendStatus ? (
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getTrendBadgeClasses(data.dominant.trendStatus)}`}>
                    {getTrendLabel(data.dominant.trendStatus)}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-slate-200 mt-3 leading-relaxed">{data.dominant.summary}</p>
              {onAskContext ? <p className={`mt-3 text-[11px] transition ${selectedContextLabel === data.dominant?.label ? 'text-cyan-200/90' : 'text-cyan-200/0 group-hover:text-cyan-200/80'}`}>{selectedContextLabel === data.dominant?.label ? 'Selected for Merlin' : 'Ask Merlin about this pattern'}</p> : null}
            </>
          ) : (
            <p className="text-sm text-slate-300">No dominant pattern yet. Merlin needs more evidence.</p>
          )}
        </div>

        {data.mirrorInsight ? (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-950/20 p-4">
            <p className="text-xs uppercase tracking-wider text-rose-300/80 mb-2">Mirror Insight</p>
            <p className="text-sm text-rose-50/95 leading-relaxed whitespace-pre-line">{data.mirrorInsight.message}</p>
            {data.mirrorInsight.lastSeen ? (
              <p className="mt-2 text-[11px] text-rose-200/70">Last seen: {new Date(data.mirrorInsight.lastSeen).toLocaleString()}</p>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border border-indigo-400/20 bg-slate-950/35 p-4">
          <p className="text-xs uppercase tracking-wider text-indigo-300/75 mb-3">Pattern Frequency</p>
          <div className="space-y-3">
            {data.frequency.slice(0, 5).map((item) => {
              const width = Math.min(100, item.count * 18);
              const trend = data.trends.find((entry) => entry.pattern === item.pattern);
              return (
                <div
                  key={item.pattern}
                  className={onAskContext ? `group rounded-lg px-2 py-1 -mx-2 cursor-pointer transition hover:bg-indigo-400/8 ${selectedContextLabel === item.label ? 'bg-cyan-500/10 ring-1 ring-cyan-300/30' : ''}` : ''}
                  onClick={onAskContext ? () => onAskContext(item.label, `Why does ${item.label} keep recurring for me?`) : undefined}
                  onKeyDown={onAskContext ? (event) => handleAskKeyDown(event, () => onAskContext(item.label, `Why does ${item.label} keep recurring for me?`)) : undefined}
                  role={onAskContext ? 'button' : undefined}
                  tabIndex={onAskContext ? 0 : undefined}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-indigo-100 truncate">{item.label}</span>
                      {trend?.status ? (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getTrendBadgeClasses(trend.status)}`}>
                          {getTrendLabel(trend.status)}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-indigo-200/70">{item.count}</span>
                  </div>
                  <p className={`text-[11px] mb-1 ${getIntensityClasses(item.count)}`}>{getIntensityMessage(item.count)}</p>
                  <div className="h-2 rounded-full bg-indigo-950/80 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-400" style={{ width: `${width}%` }} />
                  </div>
                  {trend ? <p className="mt-1 text-[11px] text-indigo-200/60">Last 7d: {trend.count} | Prior 7d: {trend.previousCount || 0}</p> : null}
                  {onAskContext ? <p className={`mt-1 text-[11px] transition ${selectedContextLabel === item.label ? 'text-cyan-200/90' : 'text-cyan-200/0 group-hover:text-cyan-200/70'}`}>{selectedContextLabel === item.label ? 'Selected for Merlin' : 'Ask Merlin'}</p> : null}
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
              <div
                key={item.id}
                className={`border-l border-indigo-400/30 pl-3 ${onAskContext ? 'group cursor-pointer transition hover:border-cyan-300/60' : ''} ${selectedContextLabel === item.label ? 'border-cyan-300/80 bg-cyan-500/5 rounded-r-md py-1 pr-2' : ''}`}
                onClick={onAskContext ? () => onAskContext(item.label, `Why did Merlin flag "${item.label}" in my recent timeline, and what does it say about my pattern?`) : undefined}
                onKeyDown={onAskContext ? (event) => handleAskKeyDown(event, () => onAskContext(item.label, `Why did Merlin flag "${item.label}" in my recent timeline, and what does it say about my pattern?`)) : undefined}
                role={onAskContext ? 'button' : undefined}
                tabIndex={onAskContext ? 0 : undefined}
              >
                <p className="text-sm text-indigo-100">{item.label}</p>
                <p className="text-[11px] text-indigo-200/65 mt-0.5">{new Date(item.createdAt).toLocaleString()}</p>
                {item.feedbackSignal ? <p className="text-[11px] text-cyan-300 mt-1">Feedback: {item.feedbackSignal}</p> : null}
                {onAskContext ? <p className={`mt-1 text-[11px] transition ${selectedContextLabel === item.label ? 'text-cyan-200/90' : 'text-cyan-200/0 group-hover:text-cyan-200/70'}`}>{selectedContextLabel === item.label ? 'Selected for Merlin' : 'Ask Merlin about this moment'}</p> : null}
              </div>
            ))}
            {data.recentTimeline.length === 0 && <p className="text-sm text-slate-300">No timeline evidence yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
