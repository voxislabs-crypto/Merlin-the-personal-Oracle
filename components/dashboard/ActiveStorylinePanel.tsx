'use client';

import { useMemo, useState } from 'react';
import { MessageCircle, Radio, Sparkles, Clock } from 'lucide-react';
import { TransitAspectLabel } from '@/components/astrology/PlanetLabel';
import { parseTransitPhrase } from '@/lib/astrology/planet-style';
import { explainTransitTitle } from '@/lib/astrology/transit-plain-language';
import { ArcanePane } from '@/components/dashboard/ArcanePane';

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

/** Stroke colors for circular progress rings */
const THEME_RING: Record<string, { stroke: string; glow: string; text: string }> = {
  transformation: { stroke: '#a78bfa', glow: 'rgba(167,139,250,0.35)', text: 'text-violet-200' },
  love: { stroke: '#fb7185', glow: 'rgba(251,113,133,0.35)', text: 'text-rose-200' },
  career: { stroke: '#fbbf24', glow: 'rgba(251,191,36,0.35)', text: 'text-amber-200' },
  'inner work': { stroke: '#818cf8', glow: 'rgba(129,140,248,0.35)', text: 'text-indigo-200' },
  communication: { stroke: '#22d3ee', glow: 'rgba(34,211,238,0.35)', text: 'text-cyan-200' },
  abundance: { stroke: '#34d399', glow: 'rgba(52,211,153,0.35)', text: 'text-emerald-200' },
};

function themeRing(theme?: string, title?: string) {
  const key = (theme || title || '').toLowerCase();
  for (const [k, v] of Object.entries(THEME_RING)) {
    if (key.includes(k)) return v;
  }
  return { stroke: '#38bdf8', glow: 'rgba(56,189,248,0.35)', text: 'text-sky-200' };
}

const RING_SIZE = 72;
const RING_STROKE = 5;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

function ThemeSignalRing({
  count,
  maxSignals,
  selected,
  stroke,
  glow,
}: {
  count: number;
  maxSignals: number;
  selected: boolean;
  stroke: string;
  glow: string;
}) {
  const pct = Math.min(1, Math.max(0.08, (count || 0) / Math.max(maxSignals, 1)));
  const dash = RING_C * pct;
  const gap = RING_C - dash;

  return (
    <div
      className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full transition-transform ${
        selected ? 'scale-105' : ''
      }`}
      style={selected ? { filter: `drop-shadow(0 0 10px ${glow})` } : undefined}
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        {/* Track */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          fill="none"
          stroke="rgba(148,163,184,0.2)"
          strokeWidth={RING_STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          fill="none"
          stroke={stroke}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <div
        className={`relative z-[1] flex h-14 w-14 flex-col items-center justify-center rounded-full border ${
          selected
            ? 'border-white/25 bg-slate-900/90'
            : 'border-white/10 bg-slate-950/80'
        }`}
      >
        <span className="text-xl font-bold tabular-nums leading-none text-white">{count}</span>
        <span className="mt-0.5 text-[9px] uppercase tracking-wide text-slate-400">sig</span>
      </div>
    </div>
  );
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
          <p className="text-sm font-semibold text-sky-50">
            {parseTransitPhrase(w.title) ? (
              <TransitAspectLabel label={w.title} />
            ) : (
              w.title
            )}
          </p>
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

  const themeSlice = themes.slice(0, 4);
  const defaultKey = themeSlice[0] ? themeSlice[0].theme || themeSlice[0].title : null;
  const [selectedThemeKey, setSelectedThemeKey] = useState<string | null>(defaultKey);

  // Keep selection valid when themes load/change
  const selectedKey =
    selectedThemeKey && themeSlice.some((t) => (t.theme || t.title) === selectedThemeKey)
      ? selectedThemeKey
      : defaultKey;

  const selectedTheme = themeSlice.find((t) => (t.theme || t.title) === selectedKey) || null;

  if (!themes.length && !windows.length && !fallbackText?.trim()) {
    return null;
  }

  const maxSignals = Math.max(...themes.map((t) => t.signalCount || 0), 1);
  const showProseFallback = !themes.length && !windows.length && Boolean(fallbackText?.trim());

  return (
    <ArcanePane
      tone="sky"
      as="div"
      static
      shellClassName={`border-sky-500/30 bg-sky-950/35 ${className}`}
      padding="px-4 py-3.5"
      orbs
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Radio className="h-4 w-4 text-sky-300 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-sky-300/85 font-semibold">
              Now · active storyline
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Overlapping transit themes right now — not your birth personality. Tap a ring for detail.
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

      {themeSlice.length > 0 ? (
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
            <Sparkles className="h-3 w-3" />
            Themes by signal strength
          </p>

          {/* Compact circular rings */}
          <div
            className="flex flex-wrap items-start justify-center gap-4 sm:gap-6"
            role="listbox"
            aria-label="Active storyline themes"
          >
            {themeSlice.map((theme, index) => {
              const key = theme.theme || theme.title;
              const selected = key === selectedKey;
              const ring = themeRing(theme.theme, theme.title);
              const rank = index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Active';

              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setSelectedThemeKey(key)}
                  className="group flex w-[88px] flex-col items-center gap-1.5 rounded-xl p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                >
                  <ThemeSignalRing
                    count={theme.signalCount}
                    maxSignals={maxSignals}
                    selected={selected}
                    stroke={ring.stroke}
                    glow={ring.glow}
                  />
                  <span
                    className={`text-center text-[11px] font-semibold leading-tight ${
                      selected ? ring.text : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {theme.title}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">{rank}</span>
                </button>
              );
            })}
          </div>

          {/* Shared detail area — swaps with selection */}
          <div
            className="min-h-[5.5rem] rounded-xl border border-sky-400/20 bg-slate-950/50 px-4 py-3"
            aria-live="polite"
          >
            {selectedTheme ? (
              <div key={selectedKey} className="animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300/80">Selected theme</p>
                    <p className="text-base font-semibold text-sky-50">{selectedTheme.title}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-sky-100">
                      {selectedTheme.signalCount} signals
                    </span>
                    {selectedTheme.dominantPhase ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${phaseBadge(
                          selectedTheme.dominantPhase,
                        )}`}
                      >
                        {selectedTheme.dominantPhase}
                      </span>
                    ) : null}
                    {typeof selectedTheme.score === 'number' ? (
                      <span className="text-[10px] text-slate-500">{selectedTheme.score}/100</span>
                    ) : null}
                  </div>
                </div>
                {selectedTheme.headline ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">{selectedTheme.headline}</p>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {selectedTheme.signalCount} aligned signals point at{' '}
                    <span className="text-slate-200">{selectedTheme.title.toLowerCase()}</span> right
                    now.
                  </p>
                )}
                {selectedTheme.summary ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{selectedTheme.summary}</p>
                ) : null}
                {onAskTheme ? (
                  <button
                    type="button"
                    onClick={() => onAskTheme(selectedTheme.title)}
                    className="mt-2 text-[11px] font-semibold text-cyan-200 hover:text-cyan-100"
                  >
                    Ask Merlin about {selectedTheme.title.toLowerCase()} →
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a theme ring above.</p>
            )}
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
    </ArcanePane>
  );
}
