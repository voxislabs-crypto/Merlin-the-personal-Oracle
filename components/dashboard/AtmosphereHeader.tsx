'use client';

import { motion } from 'framer-motion';
import {
  CloudLightning,
  CloudRain,
  CloudSun,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { DayRatingBadge } from '@/components/dashboard/DayRatingBadge';
import { LifeDomainStrip } from '@/components/dashboard/LifeDomainStrip';
import {
  buildDomainStripItems,
  buildPersonalGreeting,
} from '@/lib/atmosphere/domain-strip';
import {
  ALARM_LABEL,
  FRICTION_LABEL,
  dualScoresNeedLabels,
  formatDualScoreUi,
  resolveFrictionPercent,
} from '@/lib/atmosphere/score-labels';
import { resolveAtmosphereIntensity, resolveTone } from '@/lib/atmosphere/tone';
import type { AtmosphereToneIcon, LifeRiskPacket } from '@/lib/atmosphere/types';
import type { DayRating } from '@/lib/dashboard/cosmic-rating';

const TONE_ICONS: Record<AtmosphereToneIcon, LucideIcon> = {
  storm: CloudLightning,
  rain: CloudRain,
  mixed: CloudSun,
  clear: Sparkles,
};

export type AtmosphereHeaderVariant = 'hero' | 'compact';

export interface AtmosphereHeaderProps {
  intensity?: number;
  feltIntensity?: number;
  sentimentScore?: number | null;
  dayRating?: DayRating | string;
  eyebrow?: string;
  date?: string;
  moonPhase?: string;
  moonSign?: string;
  streak?: number;
  driverLabel?: string;
  confluenceAligned?: boolean;
  confluenceThemes?: string[];
  variant?: AtmosphereHeaderVariant;
  loading?: boolean;
  barLabel?: string;
  /** First name for "Good evening, Kao" */
  firstName?: string | null;
  /** Life-risk packet for domain strip + risk % */
  risk?: LifeRiskPacket | null;
  /** Show personal greeting line (hero Today) */
  showGreeting?: boolean;
}

function formatStoryDate(value?: string): string | null {
  if (!value) return null;
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    const localDate = new Date(year, month - 1, day, 12, 0, 0);
    return localDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function AtmosphereHeaderSkeleton({ variant }: { variant: AtmosphereHeaderVariant }) {
  if (variant === 'compact') {
    return <div className="h-16 rounded-xl bg-slate-800/60 animate-pulse" />;
  }

  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-40 rounded bg-slate-700/50" />
      <div className="h-3 w-36 rounded bg-slate-700/40" />
      <div className="h-14 w-full max-w-md rounded bg-slate-700/50" />
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-24 rounded-full bg-slate-700/40" />
        <div className="h-6 w-20 rounded-full bg-slate-700/40" />
        <div className="h-6 w-16 rounded-full bg-slate-700/40" />
      </div>
      <div className="h-10 w-full max-w-sm rounded-full bg-slate-700/50" />
    </div>
  );
}

export function AtmosphereHeader({
  intensity,
  feltIntensity,
  sentimentScore = null,
  dayRating,
  eyebrow = "Today's life weather",
  date,
  moonPhase,
  moonSign,
  streak,
  driverLabel,
  confluenceAligned = false,
  confluenceThemes = [],
  variant = 'hero',
  loading = false,
  barLabel = 'Life weather',
  firstName = null,
  risk = null,
  showGreeting = false,
}: AtmosphereHeaderProps) {
  if (loading) {
    return <AtmosphereHeaderSkeleton variant={variant} />;
  }

  const resolvedIntensity = resolveAtmosphereIntensity(intensity, dayRating);
  const resolvedFeltIntensity =
    typeof feltIntensity === 'number' ? resolveAtmosphereIntensity(feltIntensity, dayRating) : null;
  const showFeltLine =
    resolvedFeltIntensity !== null &&
    typeof sentimentScore === 'number' &&
    Math.abs(resolvedFeltIntensity - resolvedIntensity) >= 8;
  const tone = resolveTone(resolvedIntensity);
  const Icon = TONE_ICONS[tone.icon];
  const formattedDate = formatStoryDate(date);
  const greeting = showGreeting ? buildPersonalGreeting(firstName) : null;
  const domainItems =
    variant === 'hero'
      ? buildDomainStripItems(risk, { max: 6, includeQuiet: false })
          .filter((item) => item.trend === 'down' || item.friction >= 48)
          .slice(0, 2)
      : [];
  const frictionPercent = resolveFrictionPercent(risk);
  const showFrictionBesideAlarm =
    frictionPercent != null && dualScoresNeedLabels(resolvedIntensity, frictionPercent);
  const riskPercent = variant === 'hero' ? frictionPercent : null;

  const feltLine = showFeltLine ? (
    <p className="mt-1 text-xs text-slate-300/90">
      Felt intensity {resolvedFeltIntensity}% · chart weather alarm {resolvedIntensity}%
      {typeof sentimentScore === 'number' ? ` · mood signal ${sentimentScore}%` : ''}
    </p>
  ) : null;
  const confluenceChip =
    confluenceAligned && variant === 'hero' ? (
      <span
        className="inline-flex items-center rounded-full border border-violet-300/35 bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-100"
        title={
          confluenceThemes.length
            ? `Aligned signals: ${confluenceThemes.join(', ')}`
            : 'Multiple life-weather signals are converging today'
        }
      >
        Signals aligned
      </span>
    ) : null;

  /** Clear → Storm weather scale (shared compact + hero). */
  const weatherBar = (
    <div
      className={
        variant === 'hero' ? 'w-full' : 'min-w-[120px] max-w-[220px] flex-1'
      }
    >
      <div className="flex items-end justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
          {variant === 'hero' ? 'Weather scale' : barLabel}
        </span>
        {variant === 'hero' ? (
          <span className={`text-xs font-semibold tabular-nums ${tone.text}`}>
            {resolvedIntensity}% {ALARM_LABEL}
          </span>
        ) : null}
      </div>
      <div
        className="relative mt-2"
        role="meter"
        aria-valuenow={resolvedIntensity}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${tone.label} alarm ${resolvedIntensity} percent${
          showFrictionBesideAlarm && frictionPercent != null
            ? `, friction ${frictionPercent} percent`
            : ''
        }`}
      >
        <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-slate-950/90 shadow-inner">
          <div
            className="h-full w-full opacity-35"
            style={{
              background:
                'linear-gradient(90deg, #34d399 0%, #22d3ee 28%, #fbbf24 58%, #f43f5e 100%)',
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-3 overflow-hidden rounded-full">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${tone.gradient} shadow-[0_0_14px_rgba(255,255,255,0.22)]`}
            initial={{ width: 0 }}
            animate={{ width: `${resolvedIntensity}%` }}
            transition={{ duration: variant === 'hero' ? 0.85 : 0.6, ease: 'easeOut' }}
          />
        </div>
        <motion.div
          className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white/80 bg-slate-950 shadow-md ${tone.glow}`}
          style={{ left: `clamp(0px, calc(${resolvedIntensity}% - 8px), calc(100% - 16px))` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          aria-hidden
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-medium tracking-wide text-slate-500">
        <span className={resolvedIntensity < 40 ? 'text-emerald-300/90' : undefined}>Clear</span>
        <span className={resolvedIntensity >= 40 && resolvedIntensity < 60 ? 'text-cyan-300/90' : undefined}>
          Mixed
        </span>
        <span className={resolvedIntensity >= 60 && resolvedIntensity < 80 ? 'text-amber-300/90' : undefined}>
          Caution
        </span>
        <span className={resolvedIntensity >= 80 ? 'text-rose-300/90' : undefined}>Storm</span>
      </div>
      {variant === 'hero' && typeof streak === 'number' && streak > 0 ? (
        <p className="mt-1.5 text-right text-xs text-slate-400">{streak}-day return streak</p>
      ) : null}
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className={`rounded-xl border ${tone.border} bg-gradient-to-br ${tone.shellBg} px-4 py-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`rounded-lg border ${tone.border} bg-black/20 p-2 shrink-0`}>
              <Icon className={`h-4 w-4 ${tone.text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Life weather</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-sm font-bold ${tone.text}`}>{tone.label}</p>
                <span className={`text-xs font-semibold tabular-nums ${tone.text}`}>
                  {formatDualScoreUi(resolvedIntensity, frictionPercent)}
                </span>
                {dayRating ? <DayRatingBadge dayRating={dayRating} /> : null}
              </div>
            </div>
          </div>
          {weatherBar}
        </div>
        {feltLine}
        {(driverLabel || moonPhase || moonSign) && (
          <p className="mt-2 line-clamp-2 text-xs text-slate-300/90">
            {driverLabel ||
              `${moonPhase && moonPhase !== 'Unknown' ? moonPhase : 'Lunar phase updating'}${
                moonSign ? ` · Moon in ${moonSign}` : ''
              }`}
          </p>
        )}
      </div>
    );
  }

  // Hero: greeting → life weather → gigantic tone → domain strip → scale
  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        {greeting ? (
          <p className="text-base font-medium text-slate-200 sm:text-lg">{greeting}.</p>
        ) : null}
        <p
          className={`text-[11px] uppercase tracking-[0.32em] text-slate-300/85 ${greeting ? 'mt-1.5' : ''}`}
        >
          {eyebrow}
        </p>

        <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
          <h2
            className={`text-[2.75rem] font-black uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-[3.5rem] ${tone.text} drop-shadow-[0_0_28px_rgba(255,255,255,0.1)]`}
          >
            {tone.label}
          </h2>
          <div className="mb-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className={`text-2xl font-bold tabular-nums sm:text-3xl ${tone.text} opacity-90`}>
              {resolvedIntensity}%
              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {ALARM_LABEL}
              </span>
            </span>
            {showFrictionBesideAlarm && frictionPercent != null ? (
              <span className="text-2xl font-bold tabular-nums sm:text-3xl text-sky-200/90">
                {frictionPercent}%
                <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {FRICTION_LABEL}
                </span>
              </span>
            ) : null}
          </div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {dayRating ? <DayRatingBadge dayRating={dayRating} /> : null}
            {confluenceChip}
          </div>
        </div>

        {formattedDate ? <p className="mt-2 text-sm text-slate-300/90">{formattedDate}</p> : null}
        {feltLine}
        {(moonPhase || moonSign) && (
          <p className="mt-1 text-xs text-slate-400">
            {moonPhase && moonPhase !== 'Unknown' ? moonPhase : 'Lunar phase updating'}
            {moonSign ? ` · Moon in ${moonSign}` : ''}
          </p>
        )}
      </div>

      {(domainItems.length > 0 || riskPercent != null) && (
        <LifeDomainStrip items={domainItems} riskPercent={riskPercent} />
      )}

      {weatherBar}
    </div>
  );
}

export function getAtmosphereShellClassName(intensity?: number, dayRating?: DayRating | string): string {
  const tone = resolveTone(resolveAtmosphereIntensity(intensity, dayRating));
  return `rounded-2xl border ${tone.border} bg-gradient-to-br ${tone.shellBg} shadow-xl ${tone.glow}`;
}
