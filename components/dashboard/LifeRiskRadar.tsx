'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Radar, Shield } from 'lucide-react';
import { TransitAspectLabel } from '@/components/astrology/PlanetLabel';
import { ArcanePane } from '@/components/dashboard/ArcanePane';
import { ShareWeatherButton } from '@/components/dashboard/ShareWeatherButton';
import { lifeRiskLevelPresentation } from '@/lib/atmosphere/life-risk';
import type { LifeRiskLevel, LifeRiskPacket, LifeRiskWindow } from '@/lib/atmosphere/types';
import { cn } from '@/lib/utils';

function formatPeak(peakAt?: string, daysToPeak?: number): string {
  if (typeof daysToPeak === 'number' && Number.isFinite(daysToPeak)) {
    if (daysToPeak <= 0) return 'peaking now';
    if (daysToPeak === 1) return 'peak tomorrow';
    return `peak in ~${daysToPeak}d`;
  }
  if (!peakAt) return 'timing TBD';
  const d = new Date(peakAt.includes('T') ? peakAt : `${peakAt}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 'timing TBD';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function dateKeyFromIso(iso?: string): string | null {
  if (!iso) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localToday(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function frictionBarClass(friction: number): string {
  if (friction >= 78) return 'from-rose-500 to-fuchsia-500';
  if (friction >= 62) return 'from-orange-500 to-rose-500';
  if (friction >= 42) return 'from-amber-400 to-orange-500';
  return 'from-emerald-400 to-teal-500';
}

function barSolidColor(friction: number): string {
  if (friction >= 78) return '#f43f5e';
  if (friction >= 62) return '#fb923c';
  if (friction >= 42) return '#fbbf24';
  if (friction > 0) return '#34d399';
  return '#334155';
}

type DayBar = {
  date: string;
  friction: number;
  labels: string[];
  isToday: boolean;
};

function buildFrictionDaySeries(
  windows: LifeRiskWindow[],
  windowDays: number
): DayBar[] {
  const today = localToday();
  const byDate = new Map<string, { friction: number; labels: Set<string> }>();

  for (const w of windows) {
    // Prefer explicit calendar dates; fall back to daysToPeak offset from today
    let key =
      dateKeyFromIso(w.peakAt) ||
      dateKeyFromIso(w.startsAt) ||
      dateKeyFromIso(w.endsAt);

    // peakAt like "2026-08-05T12:00:00.000Z" — slice is fine, but also handle Date parse shift
    if (!key && w.peakAt) {
      const d = new Date(w.peakAt);
      if (!Number.isNaN(d.getTime())) {
        // Use UTC date for Z timestamps so we don't shift a day west of UTC
        if (String(w.peakAt).endsWith('Z') || String(w.peakAt).includes('+00:00')) {
          key = d.toISOString().slice(0, 10);
        } else {
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
    }

    if (!key && typeof w.daysToPeak === 'number' && Number.isFinite(w.daysToPeak)) {
      key = addDaysIso(today, Math.max(0, Math.round(w.daysToPeak)));
    }

    if (!key) continue;
    const prev = byDate.get(key) || { friction: 0, labels: new Set<string>() };
    prev.friction = Math.max(prev.friction, w.friction || 0);
    if (w.label) prev.labels.add(w.label);
    byDate.set(key, prev);
  }

  // Continuous horizon from today
  const span = Math.min(Math.max(windowDays || 14, 7), 21);
  const series: DayBar[] = [];
  for (let i = 0; i < span; i++) {
    const date = addDaysIso(today, i);
    const hit = byDate.get(date);
    series.push({
      date,
      friction: hit?.friction ?? 0,
      labels: hit ? Array.from(hit.labels) : [],
      isToday: date === today,
    });
  }

  // Include any scored days that fell outside the span (past or far future)
  const covered = new Set(series.map((s) => s.date));
  const extras = Array.from(byDate.keys())
    .filter((d) => !covered.has(d) && (d >= today || byDate.get(d)!.friction > 0))
    .sort();
  for (const date of extras.slice(0, 8)) {
    const hit = byDate.get(date)!;
    series.push({
      date,
      friction: hit.friction,
      labels: Array.from(hit.labels),
      isToday: date === today,
    });
  }

  // Sort chronologically if we appended extras
  series.sort((a, b) => a.date.localeCompare(b.date));
  return series;
}

const CHART_HEIGHT_PX = 112;

function FrictionTimelineChart({
  windows,
  windowDays,
  accentHex,
  selectedDate,
  onSelectDate,
}: {
  windows: LifeRiskWindow[];
  windowDays: number;
  accentHex: string;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const series = useMemo(
    () => buildFrictionDaySeries(windows, windowDays),
    [windows, windowDays]
  );

  const maxF = Math.max(1, ...series.map((d) => d.friction), 1);
  const hasAny = series.some((d) => d.friction > 0);

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-400">
        No hard-transit cluster scored in this window — sky is relatively quiet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Friction by day
        </p>
        <p className="text-[10px] text-slate-500">tap a bar · 0–100</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 px-2 pt-4 pb-2">
        {/* Chart plot: fixed pixel height so bars always render */}
        <div
          className="flex items-end gap-1 sm:gap-1.5"
          style={{ height: CHART_HEIGHT_PX }}
          role="img"
          aria-label="Friction intensity by day"
        >
          {series.map((day) => {
            // Pixel heights — % heights fail inside flex rows with items-end
            const barPx =
              day.friction > 0
                ? Math.max(10, Math.round((day.friction / maxF) * (CHART_HEIGHT_PX - 4)))
                : 3;
            const active = selectedDate === day.date;
            const color = barSolidColor(day.friction);

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(active ? null : day.date)}
                className={cn(
                  'group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none',
                  active && 'z-10'
                )}
                title={`${day.date}: friction ${day.friction}${
                  day.labels[0] ? ` · ${day.labels[0]}` : ''
                }`}
              >
                {day.friction > 0 ? (
                  <span className="pointer-events-none mb-0.5 text-[9px] font-semibold tabular-nums text-slate-400 opacity-0 transition group-hover:opacity-100">
                    {day.friction}
                  </span>
                ) : (
                  <span className="mb-0.5 h-[12px]" aria-hidden />
                )}
                <div
                  className={cn(
                    'w-[70%] max-w-[1.5rem] rounded-t-md transition-all duration-300',
                    day.friction <= 0 && 'opacity-50',
                    active && 'ring-2 ring-sky-400/70 ring-offset-1 ring-offset-slate-950'
                  )}
                  style={{
                    height: barPx,
                    minHeight: barPx,
                    background:
                      day.friction > 0
                        ? `linear-gradient(to top, ${color}99, ${color})`
                        : '#334155',
                    boxShadow: day.friction >= 62 ? `0 0 14px ${color}55` : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Day labels under the plot */}
        <div className="mt-1.5 flex gap-1 sm:gap-1.5">
          {series.map((day) => {
            const label = new Date(`${day.date}T12:00:00`).toLocaleDateString('en-US', {
              weekday: 'narrow',
            });
            const dayNum = new Date(`${day.date}T12:00:00`).getDate();
            const active = selectedDate === day.date;
            return (
              <button
                key={`lbl-${day.date}`}
                type="button"
                onClick={() => onSelectDate(active ? null : day.date)}
                className="flex min-w-0 flex-1 flex-col items-center leading-none"
              >
                <span
                  className={cn(
                    'text-[9px] font-medium uppercase',
                    day.isToday ? 'text-violet-300' : active ? 'text-sky-300' : 'text-slate-500'
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    'text-[10px] tabular-nums',
                    day.isToday
                      ? 'font-bold text-violet-200'
                      : active
                        ? 'font-semibold text-sky-200'
                        : 'text-slate-500'
                  )}
                >
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex justify-between border-t border-white/5 pt-1.5 text-[9px] text-slate-600">
          <span>low</span>
          <span style={{ color: accentHex }}>high friction →</span>
        </div>
      </div>

      {selectedDate ? (
        <div className="rounded-lg border border-sky-400/25 bg-sky-950/25 px-3 py-2 text-xs text-slate-200">
          <span className="font-semibold text-sky-100">
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {(() => {
            const day = series.find((d) => d.date === selectedDate);
            if (!day) return null;
            return (
              <>
                <span className="text-slate-500"> · friction </span>
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: barSolidColor(day.friction) }}
                >
                  {day.friction}
                </span>
                {day.labels.length > 0 ? (
                  <div className="mt-1.5 space-y-1">
                    {day.labels.slice(0, 3).map((label) => (
                      <div key={label} className="text-slate-300">
                        <TransitAspectLabel label={label} showGlyphs />
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500"> · no hard peak scored</span>
                )}
              </>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}

/** Unique drivers for the horizon (collapse same label spam) */
function uniqueDrivers(windows: LifeRiskWindow[]): Array<{ label: string; friction: number; dates: string[] }> {
  const map = new Map<string, { friction: number; dates: Set<string> }>();
  for (const w of windows) {
    const key = w.label || 'Unknown';
    const date =
      dateKeyFromIso(w.peakAt) || dateKeyFromIso(w.startsAt) || '';
    const prev = map.get(key) || { friction: 0, dates: new Set<string>() };
    prev.friction = Math.max(prev.friction, w.friction || 0);
    if (date) prev.dates.add(date);
    map.set(key, prev);
  }
  return Array.from(map.entries())
    .map(([label, v]) => ({
      label,
      friction: v.friction,
      dates: Array.from(v.dates).sort(),
    }))
    .sort((a, b) => b.friction - a.friction)
    .slice(0, 4);
}

function SeverityTitle({ level, label }: { level: LifeRiskLevel; label: string }) {
  const presentation = lifeRiskLevelPresentation(level);
  return (
    <h2
      className={cn(
        'mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl',
        presentation.textClass,
      )}
      style={{ color: presentation.hex }}
    >
      {label}
    </h2>
  );
}

export interface LifeRiskRadarProps {
  risk?: LifeRiskPacket | null;
  loading?: boolean;
  onAskAboutRisk?: () => void;
  className?: string;
}

/**
 * Score-first horizon: overall level + friction-by-day chart (not redundant lists).
 */
export function LifeRiskRadar({
  risk,
  loading = false,
  onAskAboutRisk,
  className = '',
}: LifeRiskRadarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (loading && !risk) {
    return (
      <ArcanePane
        tone="storm"
        shellClassName="border-rose-500/25 bg-slate-950/50"
        className={`animate-pulse ${className}`}
        orbs
      >
        <div className="flex items-center gap-2 text-rose-200/70">
          <Radar className="h-4 w-4" />
          <span className="text-[10px] uppercase tracking-[0.22em]">Transit risk scan</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-8 w-2/3 rounded bg-slate-700/40" />
          <div className="h-28 w-full rounded-lg bg-slate-800/40" />
        </div>
      </ArcanePane>
    );
  }

  if (!risk) {
    return (
      <div
        className={`rounded-2xl border border-slate-600/40 bg-slate-950/50 px-4 py-5 text-sm text-slate-400 ${className}`}
      >
        Transit risk radar needs chart + forecast access. Enter birth details or unlock life weather.
      </div>
    );
  }

  const presentation = lifeRiskLevelPresentation(risk.level);
  const hotDomains = risk.domains.filter((d) => d.friction >= 45).slice(0, 4);
  const drivers = uniqueDrivers(risk.frictionWindows);
  const supportDrivers = uniqueDrivers(risk.supportWindows).slice(0, 2);

  const arcaneTone =
    risk.level === 'storm'
      ? 'storm'
      : risk.level === 'friction'
        ? 'amber'
        : risk.level === 'watch'
          ? 'sky'
          : 'violet';

  const shellByLevel: Record<string, string> = {
    storm: 'border-rose-400/45 bg-slate-950/55',
    friction: 'border-orange-400/40 bg-slate-950/55',
    watch: 'border-amber-400/35 bg-slate-950/55',
    calm: 'border-emerald-400/35 bg-slate-950/55',
  };

  return (
    <ArcanePane
      tone={arcaneTone}
      shellClassName={shellByLevel[risk.level] || shellByLevel.watch}
      glass
      orbs
      className={className}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-400">
              <Radar className="h-3.5 w-3.5" style={{ color: presentation.hex }} />
              <span style={{ color: presentation.hex }}>
                Transit impact · {risk.windowDays}d
              </span>
            </p>
            <SeverityTitle level={risk.level} label={presentation.label} />
            <p className="mt-1 max-w-xl text-sm text-slate-300">{risk.headline}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                presentation.badgeClass,
              )}
              style={{ color: presentation.hex }}
              title={
                risk.elevatedDisruption
                  ? 'Hard life-friction window — timing awareness, not a verdict on you'
                  : 'No major disruption window dominating right now'
              }
            >
              {risk.elevatedDisruption ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {risk.elevatedDisruption ? 'Hard friction window' : 'Friction contained'}
            </span>
            <span
              className="text-[11px] text-slate-500"
              title="How solid this read is — not a fate score"
            >
              Signal strength {Math.round(risk.confidence)}%
            </span>
          </div>
        </div>

        {/* Move first — especially on hard days */}
        <div
          className={cn(
            'rounded-xl border px-4 py-3.5',
            risk.elevatedDisruption || risk.level === 'storm' || risk.level === 'friction'
              ? 'border-emerald-400/35 bg-emerald-950/30 shadow-[0_0_24px_rgba(16,185,129,0.08)]'
              : 'border-emerald-400/20 bg-emerald-950/20',
          )}
        >
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            <Shield className="h-3.5 w-3.5" />
            Your move
          </p>
          <p className="mt-1.5 text-base font-semibold leading-snug text-emerald-50 md:text-lg">
            {risk.move}
          </p>
          {risk.elevatedDisruption ? (
            <p className="mt-2 text-xs text-slate-400">
              Hard window — not a judgment. Shrink the plate; prefer reversible steps.
            </p>
          ) : null}
        </div>

        {/* Overall friction */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Overall friction</span>
            <span className="font-semibold" style={{ color: presentation.hex }}>
              {risk.overallFriction}/100
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/80">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${frictionBarClass(risk.overallFriction)} transition-all duration-500`}
              style={{ width: `${Math.max(4, Math.min(100, risk.overallFriction))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{presentation.description}</p>
        </div>

        {/* Linear bar graph of friction by day */}
        <FrictionTimelineChart
          windows={[...risk.frictionWindows, ...risk.supportWindows]}
          windowDays={risk.windowDays}
          accentHex={presentation.hex}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Next peak */}
        <div className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Next hard peak</p>
          {risk.nextFrictionPeak ? (
            <>
              <div className="mt-1 text-sm font-semibold text-slate-100">
                <TransitAspectLabel label={risk.nextFrictionPeak.label} />
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {formatPeak(risk.nextFrictionPeak.peakAt, risk.nextFrictionPeak.daysToPeak)}
                {' · '}
                friction {risk.nextFrictionPeak.friction}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">No major hard peak in this window</p>
          )}
        </div>

        {/* Domains as mini horizontal bars */}
        {hotDomains.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Hot domains
            </p>
            <div className="space-y-2">
              {hotDomains.map((domain) => (
                <div key={domain.name} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-xs font-medium text-slate-300">
                    {domain.label}
                  </span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(4, Math.min(100, domain.friction))}%`,
                        backgroundColor: barSolidColor(domain.friction),
                      }}
                    />
                  </div>
                  <span
                    className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums"
                    style={{ color: barSolidColor(domain.friction) }}
                  >
                    {domain.friction}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Unique drivers (not repeated day rows) */}
        {drivers.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Top drivers
            </p>
            <ul className="space-y-2">
              {drivers.map((d) => (
                <li
                  key={d.label}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-400/15 bg-rose-950/15 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100">
                      <TransitAspectLabel label={d.label} />
                    </div>
                    {d.dates.length > 1 ? (
                      <p className="text-[11px] text-slate-500">
                        Active across {d.dates.length} days in this window
                      </p>
                    ) : d.dates[0] ? (
                      <p className="text-[11px] text-slate-500">
                        Peak{' '}
                        {new Date(`${d.dates[0]}T12:00:00`).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                    style={{
                      color: barSolidColor(d.friction),
                      borderColor: `${barSolidColor(d.friction)}66`,
                      backgroundColor: `${barSolidColor(d.friction)}18`,
                    }}
                  >
                    {d.friction}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {supportDrivers.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-emerald-400/70">
              Support openings
            </p>
            <ul className="space-y-1.5">
              {supportDrivers.map((d) => (
                <li
                  key={d.label}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-400/15 bg-emerald-950/15 px-3 py-2 text-sm"
                >
                  <TransitAspectLabel label={d.label} />
                  <span className="shrink-0 text-[11px] text-emerald-300/80">
                    {d.dates[0]
                      ? new Date(`${d.dates[0]}T12:00:00`).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-white/5 pt-3 text-[10px] uppercase tracking-[0.12em]">
          <span className="font-semibold text-orange-300">Fire</span>
          <span className="font-semibold text-emerald-300">Earth</span>
          <span className="font-semibold text-sky-300">Air</span>
          <span className="font-semibold text-violet-300">Water</span>
          <span className="normal-case tracking-normal text-slate-500">
            Hover planets · tap chart bars for day detail
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {onAskAboutRisk ? (
            <button
              type="button"
              onClick={onAskAboutRisk}
              className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
            >
              Ask Merlin about this risk window
            </button>
          ) : null}
          <ShareWeatherButton
            label="Share forecast"
            payload={{
              date: risk.date,
              levelLabel: presentation.label,
              friction: risk.overallFriction,
              elevatedDisruption: risk.elevatedDisruption,
              confidence: risk.confidence,
              story: risk.headline,
              move: risk.move,
              driver: risk.topDrivers?.[0]?.label,
            }}
          />
        </div>
      </div>
    </ArcanePane>
  );
}
