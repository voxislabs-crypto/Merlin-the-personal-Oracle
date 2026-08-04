'use client';

import { useMemo, useState } from 'react';
import { MessageCircle, Radio, ChevronDown, Sparkles, Clock } from 'lucide-react';
import { explainTransitTitle } from '@/lib/astrology/transit-plain-language';

export interface StorylineTheme {
  theme?: string;
  title: string;
  headline?: string;
  summary?: string;
  score?: number;
  signalCount: number;
  dominantPhase?: 'building' | 'peak' | 'integrating' | string;
}

export interface StorylineWindow {
  eventId?: string;
  title: string;
  exactAt: string;
  currentPhase?: 'building' | 'peak' | 'integrating' | string;
  intensity?: number;
  startsAt?: string;
  endsAt?: string;
  /** Optional API subtitle / narrative */
  subtitle?: string;
  plain?: string;
  detail?: string;
}

interface ActiveStorylinePanelProps {
  themes?: StorylineTheme[] | null;
  windows?: StorylineWindow[] | null;
  /** Fallback plain text when structured data is missing */
  fallbackText?: string | null;
  onAskStoryline?: () => void;
  onAskTheme?: (title: string) => void;
  onAskWindow?: (title: string) => void;
  className?: string;
}

const THEME_ACCENT: Record<string, string> = {
  transformation: 'from-violet-500/30 to-fuchsia-500/10 border-violet-400/40 text-violet-100',
  love: 'from-rose-500/25 to-pink-500/10 border-rose-400/40 text-rose-100',
  career: 'from-amber-500/25 to-orange-500/10 border-amber-400/40 text-amber-100',
  'inner work': 'from-indigo-500/25 to-blue-500/10 border-indigo-400/40 text-indigo-100',
  communication: 'from-cyan-500/25 to-sky-500/10 border-cyan-400/40 text-cyan-100',
  abundance: 'from-emerald-500/25 to-teal-500/10 border-emerald-400/40 text-emerald-100',
};

function themeAccent(theme?: string, title?: string): string {
  const key = (theme || title || '').toLowerCase();
  for (const [k, v] of Object.entries(THEME_ACCENT)) {
    if (key.includes(k)) return v;
  }
  return 'from-sky-500/20 to-slate-900/40 border-sky-400/30 text-sky-100';
}

function phaseBadge(phase?: string): string {
  const p = (phase || '').toLowerCase();
  if (p === 'peak') return 'border-amber-400/50 bg-amber-500/20 text-amber-100';
  if (p === 'building') return 'border-sky-400/40 bg-sky-500/15 text-sky-100';
  if (p === 'integrating') return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100';
  return 'border-slate-600 bg-slate-800/60 text-slate-300';
}

function formatPeak(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function TimingPeakRow({
  window: w,
  onAskWindow,
}: {
  window: StorylineWindow;
  onAskWindow?: (title: string) => void;
}) {
  // One clear plain-language line only — skip redundant "enters orb / peaks / integrates" subtitles
  const plain = useMemo(() => {
    if (w.plain?.trim()) return w.plain.trim();
    return explainTransitTitle(w.title).plain;
  }, [w.title, w.plain]);

  return (
    <div className="rounded-lg border border-sky-400/20 bg-slate-950/40 px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-sky-50">{w.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Peak {formatPeak(w.exactAt)}
            {w.currentPhase ? ` · ${w.currentPhase}` : ''}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{plain}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {w.currentPhase ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${phaseBadge(
                w.currentPhase,
              )}`}
            >
              {w.currentPhase}
            </span>
          ) : null}
          {onAskWindow ? (
            <button
              type="button"
              onClick={() => onAskWindow(w.title)}
              className="text-[11px] font-semibold text-cyan-200 hover:text-cyan-100"
            >
              Ask
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Parse the old wall-of-text storyline when API structured fields are empty.
 */
export function parseStorylineFallback(text?: string | null): {
  themes: StorylineTheme[];
  windows: StorylineWindow[];
  residual?: string;
} {
  if (!text?.trim()) return { themes: [], windows: [] };

  const themes: StorylineTheme[] = [];
  // e.g. transformation (4 aligned signals) with secondary emphasis on inner work (5 aligned signals)
  const themeRe =
    /([a-z][a-z\s]*?)\s*\((\d+)\s*aligned signals?\)/gi;
  let m: RegExpExecArray | null;
  while ((m = themeRe.exec(text)) !== null) {
    const raw = m[1]
      .trim()
      .replace(/^(with\s+)?secondary\s+emphasis\s+on\s+/i, '')
      .replace(/^the\s+strongest\s+storyline\s+is\s+/i, '')
      .trim();
    if (!raw) continue;
    themes.push({
      title: raw.replace(/\b\w/g, (c) => c.toUpperCase()),
      signalCount: Number(m[2]) || 0,
    });
  }

  const windows: StorylineWindow[] = [];
  // e.g. Uranus Opposition Uranus peaking Aug 3
  const winRe = /([A-Za-z][A-Za-z0-9\s]+?)\s+peaking\s+([A-Za-z]{3}\s+\d{1,2})/g;
  while ((m = winRe.exec(text)) !== null) {
    windows.push({
      title: m[1].trim(),
      exactAt: m[2].trim(),
      currentPhase: 'peak',
    });
  }

  return { themes, windows, residual: text };
}

/**
 * Simple visual UI for active storyline: theme strength + timing peaks.
 * Uses structured confluence data when present; falls back to parsing prose.
 */
export function ActiveStorylinePanel({
  themes: themesIn,
  windows: windowsIn,
  fallbackText,
  onAskStoryline,
  onAskTheme,
  onAskWindow,
  className = '',
}: ActiveStorylinePanelProps) {
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  const { themes, windows } = useMemo(() => {
    const hasStructured =
      (themesIn && themesIn.length > 0) || (windowsIn && windowsIn.length > 0);
    if (hasStructured) {
      return {
        themes: [...(themesIn || [])].sort(
          (a, b) => (b.signalCount || 0) - (a.signalCount || 0) || (b.score || 0) - (a.score || 0),
        ),
        windows: [...(windowsIn || [])].slice(0, 4),
      };
    }
    const parsed = parseStorylineFallback(fallbackText);
    return {
      themes: parsed.themes,
      windows: parsed.windows,
    };
  }, [themesIn, windowsIn, fallbackText]);

  if (!themes.length && !windows.length && !fallbackText?.trim()) {
    return null;
  }

  const maxSignals = Math.max(...themes.map((t) => t.signalCount || 0), 1);
  const showProseFallback = !themes.length && !windows.length && Boolean(fallbackText?.trim());

  return (
    <div
      className={`rounded-xl border border-sky-500/25 bg-sky-950/30 px-4 py-3.5 ${className}`}
      data-panel="active-storyline"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <Radio className="h-4 w-4 text-sky-300 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-sky-300/85 font-semibold">
              Now · active storyline
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Overlapping transit themes right now — not your birth personality.
            </p>
          </div>
        </div>
        {onAskStoryline ? (
          <button
            type="button"
            onClick={onAskStoryline}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/35 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/20 shrink-0"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Ask about this window
          </button>
        ) : null}
      </div>

      {showProseFallback ? (
        <p className="text-sm leading-relaxed text-slate-200">{fallbackText}</p>
      ) : null}

      {themes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Themes by signal strength
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {themes.slice(0, 4).map((theme, index) => {
              const key = theme.theme || theme.title;
              const isOpen = expandedTheme === key;
              const hasText = Boolean(theme.headline || theme.summary);
              const pct = Math.round(((theme.signalCount || 0) / maxSignals) * 100);
              const rank = index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Also active';

              return (
                <div
                  key={key}
                  className={`rounded-xl border bg-gradient-to-br p-3 ${themeAccent(theme.theme, theme.title)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider opacity-70">{rank}</p>
                      <p className="text-sm font-bold truncate">{theme.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold tabular-nums leading-none">{theme.signalCount}</p>
                      <p className="text-[10px] opacity-70">signals</p>
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 rounded-full bg-black/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/50"
                      style={{ width: `${Math.max(pct, 12)}%` }}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {theme.dominantPhase ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${phaseBadge(
                          theme.dominantPhase,
                        )}`}
                      >
                        {theme.dominantPhase}
                      </span>
                    ) : null}
                    {typeof theme.score === 'number' ? (
                      <span className="text-[10px] opacity-70">{theme.score}/100</span>
                    ) : null}
                  </div>

                  {hasText ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpandedTheme(isOpen ? null : key)}
                        className="mt-2 flex w-full items-center justify-between text-[11px] font-medium opacity-90 hover:opacity-100"
                      >
                        <span>{isOpen ? 'Hide detail' : 'What this means'}</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen ? (
                        <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
                          {theme.headline ? (
                            <p className="text-xs leading-relaxed opacity-95">{theme.headline}</p>
                          ) : null}
                          {theme.summary ? (
                            <p className="text-xs leading-relaxed opacity-80">{theme.summary}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {onAskTheme ? (
                    <button
                      type="button"
                      onClick={() => onAskTheme(theme.title)}
                      className="mt-2 text-[11px] font-semibold underline-offset-2 hover:underline opacity-90"
                    >
                      Ask Merlin about {theme.title.toLowerCase()}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {windows.length > 0 ? (
        <div className={`space-y-2 ${themes.length ? 'mt-4' : ''}`}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Clearest timing peaks
          </p>
          <div className="space-y-2">
            {windows.map((w) => (
              <TimingPeakRow
                key={w.eventId || `${w.title}-${w.exactAt}`}
                window={w}
                onAskWindow={onAskWindow}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
