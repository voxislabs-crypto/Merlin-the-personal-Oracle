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
import { resolveAtmosphereIntensity, resolveTone } from '@/lib/atmosphere/tone';
import type { AtmosphereToneIcon } from '@/lib/atmosphere/types';
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
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-slate-700/60" />
        <div className="space-y-2">
          <div className="h-3 w-32 bg-slate-700/50 rounded" />
          <div className="h-7 w-48 bg-slate-700/50 rounded" />
          <div className="h-3 w-36 bg-slate-700/40 rounded" />
        </div>
      </div>
      <div className="min-w-[180px] h-10 rounded-full bg-slate-700/50" />
    </div>
  );
}

export function AtmosphereHeader({
  intensity,
  feltIntensity,
  sentimentScore = null,
  dayRating,
  eyebrow = "Today's cosmic story",
  date,
  moonPhase,
  moonSign,
  streak,
  driverLabel,
  confluenceAligned = false,
  confluenceThemes = [],
  variant = 'hero',
  loading = false,
  barLabel = 'Sky tone',
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
  const feltLine = showFeltLine ? (
    <p className="mt-1 text-xs text-slate-300/90">
      Felt intensity {resolvedFeltIntensity}% · sky {resolvedIntensity}%
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
            : 'Multiple sky signals are converging today'
        }
      >
        Signals aligned
      </span>
    ) : null;

  if (variant === 'compact') {
    return (
      <div className={`rounded-xl border ${tone.border} bg-gradient-to-br ${tone.shellBg} px-4 py-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`rounded-lg border ${tone.border} bg-black/20 p-2 shrink-0`}>
              <Icon className={`h-4 w-4 ${tone.text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Sky tone</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-sm font-bold ${tone.text}`}>{tone.label}</p>
                <span className={`text-xs font-semibold ${tone.text}`}>{resolvedIntensity}%</span>
                {dayRating ? <DayRatingBadge dayRating={dayRating} /> : null}
              </div>
            </div>
          </div>
          <div className="min-w-[120px] flex-1 max-w-[200px]">
            <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${tone.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${resolvedIntensity}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
        {feltLine}
        {(driverLabel || moonPhase || moonSign) && (
          <p className="mt-2 text-xs text-slate-300/90 line-clamp-2">
            {driverLabel ||
              `${moonPhase && moonPhase !== 'Unknown' ? moonPhase : 'Lunar phase updating'}${
                moonSign ? ` · Moon in ${moonSign}` : ''
              }`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl border ${tone.border} bg-black/20 p-3`}>
          <Icon className={`h-6 w-6 ${tone.text}`} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-300/80">{eyebrow}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className={`text-2xl font-bold ${tone.text}`}>{tone.label}</h2>
            <span className={`text-sm font-semibold ${tone.text}`}>{resolvedIntensity}%</span>
            {dayRating ? <DayRatingBadge dayRating={dayRating} /> : null}
            {confluenceChip}
          </div>
          {formattedDate ? <p className="mt-1 text-sm text-slate-300/90">{formattedDate}</p> : null}
          {feltLine}
          {(moonPhase || moonSign) && (
            <p className="mt-1 text-xs text-slate-400">
              {moonPhase && moonPhase !== 'Unknown' ? moonPhase : 'Lunar phase updating'}
              {moonSign ? ` · Moon in ${moonSign}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="min-w-[180px]">
        <div className="flex items-end justify-between gap-2">
          <span className="text-xs uppercase tracking-widest text-slate-400">{barLabel}</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-slate-800/80 overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${tone.gradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${resolvedIntensity}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        {typeof streak === 'number' && streak > 0 ? (
          <p className="mt-2 text-xs text-slate-400 text-right">{streak}-day return streak</p>
        ) : null}
      </div>
    </div>
  );
}

export function getAtmosphereShellClassName(intensity?: number, dayRating?: DayRating | string): string {
  const tone = resolveTone(resolveAtmosphereIntensity(intensity, dayRating));
  return `rounded-2xl border ${tone.border} bg-gradient-to-br ${tone.shellBg} shadow-xl ${tone.glow}`;
}