'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Radar, Shield } from 'lucide-react';
import { TransitAspectLabel } from '@/components/astrology/PlanetLabel';
import { ArcanePane } from '@/components/dashboard/ArcanePane';
import { HorizonCurveChart } from '@/components/dashboard/HorizonCurveChart';
import { ShareWeatherButton } from '@/components/dashboard/ShareWeatherButton';
import { buildLifeRiskHorizon, lifeRiskLevelPresentation } from '@/lib/atmosphere/life-risk';
import type { LifeRiskLevel, LifeRiskPacket, LifeRiskWindow } from '@/lib/atmosphere/types';
import {
  FRICTION_LOAD_LABEL,
  METER_DEFINITIONS,
  READING_CONFIDENCE_LABEL,
  THEME_EMPHASIS_LABEL,
} from '@/lib/atmosphere/score-labels';
import { cn } from '@/lib/utils';
import { getLocalCalendarDate, resolveWindowCalendarDate } from '@/lib/datetime/local-calendar';

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

function localToday(): string {
  return getLocalCalendarDate();
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

/** Unique drivers for the horizon (collapse same label spam) */
function uniqueDrivers(windows: LifeRiskWindow[]): Array<{ label: string; friction: number; dates: string[] }> {
  const map = new Map<string, { friction: number; dates: Set<string> }>();
  for (const w of windows) {
    const key = w.label || 'Unknown';
    const date = resolveWindowCalendarDate(w, localToday()) || '';
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
 * Score-first horizon: overall level plus a continuous pressure curve.
 */
export function LifeRiskRadar({
  risk,
  loading = false,
  onAskAboutRisk,
  className = '',
}: LifeRiskRadarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const horizon = useMemo(() => {
    if (!risk) return [];
    if (risk.horizon?.length) return risk.horizon;
    return buildLifeRiskHorizon({
      asOfDate: risk.date,
      windowDays: risk.windowDays,
      windows: [...(risk.frictionWindows || []), ...(risk.supportWindows || [])],
    });
  }, [risk]);
  const horizonWindows = useMemo(
    () => [...(risk?.frictionWindows || []), ...(risk?.supportWindows || [])],
    [risk],
  );

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
          <span className="text-[10px] uppercase tracking-[0.22em]">Transit pressure scan</span>
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
        Transit pressure scan needs chart + forecast access. Enter birth details or unlock life weather.
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
                Transit impact · next {risk.windowDays} days
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
              title={METER_DEFINITIONS.readingConfidence}
            >
              {READING_CONFIDENCE_LABEL} {Math.round(risk.confidence)}
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
            <span className="text-slate-400" title={METER_DEFINITIONS.frictionLoad}>
              {FRICTION_LOAD_LABEL}
            </span>
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

        <HorizonCurveChart
          horizon={horizon}
          windowDays={risk.windowDays}
          asOfDate={risk.date}
          windows={horizonWindows}
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
                friction load {risk.nextFrictionPeak.friction}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">No major hard peak in this window</p>
          )}
        </div>

        {/* Domains as mini horizontal bars */}
        {hotDomains.length > 0 ? (
          <div>
            <p
              className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500"
              title={METER_DEFINITIONS.themeEmphasis}
            >
              {THEME_EMPHASIS_LABEL}
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
            Hover a planet · tap the curve for the day
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {onAskAboutRisk ? (
            <button
              type="button"
              onClick={onAskAboutRisk}
              className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
            >
              Ask Merlin about this window
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
