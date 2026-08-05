'use client';

import { motion } from 'framer-motion';
import { Compass, Lightbulb, MessageCircle } from 'lucide-react';
import ThumbsFeedback from '@/components/astrology/ThumbsFeedback';
import {
  AtmosphereHeader,
  getAtmosphereShellClassName,
} from '@/components/dashboard/AtmosphereHeader';
import { ArcanePane } from '@/components/dashboard/ArcanePane';
import { ShareWeatherButton } from '@/components/dashboard/ShareWeatherButton';
import type { DayRating } from '@/lib/dashboard/cosmic-rating';
import { StatusPanel } from '@/components/ui/status-panel';
import { resolveAtmosphereIntensity, resolveTone } from '@/lib/atmosphere/tone';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';

/**
 * Day-one / daily hero: intensity · why · one move.
 * Self is one click away; depth lives below.
 */
export interface TodayWeatherBriefProps {
  intensity: number;
  feltIntensity?: number;
  sentimentScore?: number | null;
  dayRating?: DayRating | string;
  date?: string;
  story: string;
  whyLine?: string;
  todayMove?: string;
  moonPhase?: string;
  moonSign?: string;
  streak?: number;
  loading?: boolean;
  userId?: string;
  confluenceAligned?: boolean;
  confluenceThemes?: string[];
  onAskMerlin?: () => void;
  onExploreSelf?: () => void;
  askLabel?: string;
  eyebrow?: string;
  /** Compact identity chips under the brief */
  selfChips?: string[];
  /** Forecast/atmosphere failed */
  isError?: boolean;
  onRetry?: () => void;
  /** No chart / no data yet */
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Optional risk packet for share text */
  risk?: LifeRiskPacket | null;
}

function arcaneToneFromIntensity(
  intensity: number,
  dayRating?: DayRating | string,
): 'sky' | 'amber' | 'violet' | 'storm' {
  const n = resolveAtmosphereIntensity(intensity, dayRating);
  if (n >= 80) return 'storm';
  if (n >= 60) return 'amber';
  if (n >= 40) return 'sky';
  return 'violet';
}

export function TodayWeatherBrief({
  intensity,
  feltIntensity,
  sentimentScore,
  dayRating,
  date,
  story,
  whyLine,
  todayMove,
  moonPhase,
  moonSign,
  streak,
  loading = false,
  userId,
  confluenceAligned,
  confluenceThemes,
  onAskMerlin,
  onExploreSelf,
  askLabel = 'Ask Merlin about today',
  eyebrow = "Today's life weather",
  selfChips = [],
  isError = false,
  onRetry,
  isEmpty = false,
  emptyTitle = 'No life weather yet',
  emptyMessage = "Build your chart from birth details and Merlin will assemble today's personal forecast.",
  risk = null,
}: TodayWeatherBriefProps) {
  if (loading) {
    return (
      <ArcanePane
        tone="sky"
        shellClassName="border-sky-500/25 bg-slate-950/50"
        className="animate-pulse"
        orbs
      >
        <AtmosphereHeader loading variant="hero" barLabel="Life weather" />
        <div className="mt-5 space-y-2">
          <div className="h-3 w-full rounded bg-slate-700/50" />
          <div className="h-3 w-5/6 rounded bg-slate-700/50" />
          <div className="h-10 w-full rounded-lg bg-emerald-900/20" />
        </div>
        <p className="mt-4 text-center text-xs tracking-wide text-sky-300/60">
          Station reading the currents…
        </p>
      </ArcanePane>
    );
  }

  if (isError) {
    return (
      <StatusPanel
        tone="error"
        title="Life weather unavailable"
        message={
          story ||
          'The forecast feed hiccuped. Your chart is still safe — try refreshing the read.'
        }
        hint={whyLine || 'Usually temporary. Retry in a moment.'}
        onRetry={onRetry}
        retryLabel="Refresh life weather"
      />
    );
  }

  if (isEmpty) {
    return (
      <StatusPanel
        tone="empty"
        title={emptyTitle}
        message={emptyMessage}
        hint="One birth date, time, and place is enough to personalize the sky."
        primaryHref="/dashboard"
        primaryLabel="Enter birth details"
      />
    );
  }

  const tone = resolveTone(resolveAtmosphereIntensity(intensity, dayRating));
  const arcaneTone = arcaneToneFromIntensity(intensity, dayRating);

  return (
    <ArcanePane
      tone={arcaneTone}
      shellClassName={getAtmosphereShellClassName(intensity, dayRating)}
      glass
      orbs
    >
      <div className="flex flex-col gap-5">
        <AtmosphereHeader
          intensity={intensity}
          feltIntensity={feltIntensity}
          sentimentScore={sentimentScore}
          dayRating={dayRating}
          eyebrow={eyebrow}
          date={date}
          moonPhase={moonPhase}
          moonSign={moonSign}
          streak={streak}
          variant="hero"
          barLabel="Life weather"
          confluenceAligned={confluenceAligned}
          confluenceThemes={confluenceThemes}
        />

        {/* Three-beat brief — glass inner pane */}
        <div className="relative space-y-4 overflow-hidden rounded-xl border border-white/15 bg-black/30 p-4 shadow-inner shadow-black/40 backdrop-blur-sm md:p-5">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${
                arcaneTone === 'storm'
                  ? 'rgba(251,113,133,0.5)'
                  : arcaneTone === 'amber'
                    ? 'rgba(251,191,36,0.45)'
                    : 'rgba(56,189,248,0.5)'
              }, transparent)`,
            }}
          />

          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-[0.28em] text-slate-400">
              How it feels
            </p>
            <p className="text-base font-medium leading-relaxed text-white/95 md:text-lg">
              {story}
            </p>
          </div>

          {whyLine ? (
            <div className="border-t border-white/10 pt-3">
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.28em] text-slate-400">Why</p>
              <p className="text-sm leading-relaxed text-slate-200/95 md:text-[15px]">{whyLine}</p>
            </div>
          ) : null}

          {todayMove ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-start gap-2.5 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3.5 py-3 shadow-[0_0_24px_rgba(52,211,153,0.08)]"
            >
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                  Today&apos;s move
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-emerald-50 md:text-[15px]">
                  {todayMove}
                </p>
              </div>
            </motion.div>
          ) : null}

          <div className="pt-1">
            <ThumbsFeedback
              itemId={`life-weather-${date || 'today'}`}
              label="today's life weather"
              userId={userId}
              theme="forecast"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {onAskMerlin ? (
            <button
              type="button"
              onClick={onAskMerlin}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-300/45 bg-sky-500/20 px-4 py-2.5 text-sm font-semibold text-sky-50 shadow-[0_0_20px_rgba(56,189,248,0.15)] transition-all hover:bg-sky-500/30 hover:shadow-[0_0_28px_rgba(56,189,248,0.25)]"
            >
              <MessageCircle className="h-4 w-4" />
              {askLabel}
            </button>
          ) : null}
          {onExploreSelf ? (
            <button
              type="button"
              onClick={onExploreSelf}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/40 bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.1)] transition-all hover:bg-amber-500/25"
            >
              <Compass className="h-4 w-4" />
              Who you are · Self
            </button>
          ) : null}
          <ShareWeatherButton
            payload={{
              date,
              dayRating: typeof dayRating === 'string' ? dayRating : undefined,
              intensity,
              friction: risk?.overallFriction,
              levelLabel: risk
                ? risk.level === 'storm'
                  ? 'Storm risk'
                  : risk.level === 'friction'
                    ? 'Friction elevated'
                    : risk.level === 'watch'
                      ? 'Watch window'
                      : 'Relatively clear'
                : undefined,
              bullshitPossible: risk?.bullshitPossible,
              confidence: risk?.confidence,
              story,
              why: whyLine,
              move: todayMove,
              driver: risk?.topDrivers?.[0]?.label,
            }}
          />
          {selfChips.length ? (
            <p className="text-xs text-slate-400 sm:ml-auto">{selfChips.join(' · ')}</p>
          ) : null}
        </div>

        {/* Soft tone caption — high-tech flavor, low noise */}
        <p className="text-center font-mono text-[10px] tracking-[0.2em] text-slate-500/80">
          MERLIN · {tone.label.toUpperCase()} · {resolveAtmosphereIntensity(intensity, dayRating)}%
        </p>
      </div>
    </ArcanePane>
  );
}
