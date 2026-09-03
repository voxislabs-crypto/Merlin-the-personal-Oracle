'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Lightbulb, MessageCircle, Radio } from 'lucide-react';
import ThumbsFeedback from '@/components/astrology/ThumbsFeedback';
import {
  AtmosphereHeader,
  getAtmosphereShellClassName,
} from '@/components/dashboard/AtmosphereHeader';
import { ArcanePane } from '@/components/dashboard/ArcanePane';
import { ShareWeatherButton } from '@/components/dashboard/ShareWeatherButton';
import type { DayRating } from '@/lib/dashboard/cosmic-rating';
import { StatusPanel } from '@/components/ui/status-panel';
import { formatStormWatchScoreLine } from '@/lib/atmosphere/score-labels';
import { resolveAtmosphereIntensity, resolveTone } from '@/lib/atmosphere/tone';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';
import { YesterdayLandCheck } from '@/components/dashboard/YesterdayLandCheck';
import {
  preservePriorWeatherWindow,
  writeWeatherWindowSnapshot,
} from '@/lib/atmosphere/window-land';

/**
 * Day-one / daily hero: one move · intensity · why.
 * Move is the visual headline; score + why support it.
 */
export interface TodayWeatherBriefProps {
  /** Chart intensity 0–100; ignored while loading */
  intensity: number;
  feltIntensity?: number;
  sentimentScore?: number | null;
  dayRating?: DayRating | string;
  date?: string;
  story: string;
  whyLine?: string;
  todayMove?: string;
  whyToday?: string;
  usuallyBrings?: string;
  navigate?: string;
  watchFor?: string;
  supportingSignals?: Array<{ id: string; label: string; hint: string; polarity?: string }>;
  leadFact?: string;
  leadFactDisplay?: string;
  chartWhy?: string;
  operationalTension?: string | null;
  doNot?: string;
  personalHook?: string | null;
  confidenceWhy?: string;
  domainJob?: string;
  coreNotices?: string;
  maskWants?: string;
  tensionLine?: string;
  resolution?: string;
  whyThisPerson?: string;
  behaviorTell?: string;
  chartConfidence?: number;
  readConfidence?: number;
  chartConfidenceLabel?: 'High' | 'Steady' | 'Tentative';
  readConfidenceLabel?: 'High' | 'Steady' | 'Tentative';
  moveConfidence?: number;
  confidenceLabel?: 'High' | 'Steady' | 'Tentative';
  mixedSignals?: boolean;
  themeLabel?: string;
  heldFromYesterday?: boolean;
  weatherPrinciple?: string;
  /** Optional dominant driver label for Why pills when risk is thin */
  driverLabel?: string | null;
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
  /** Optional risk packet for share text + Why pills + domain strip */
  risk?: LifeRiskPacket | null;
  /** First name for hero greeting */
  firstName?: string | null;
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

/** Soft ambient wash by band — screenshot-friendly, no heavy FX. */
function ambientWashClass(tone: 'sky' | 'amber' | 'violet' | 'storm'): string {
  switch (tone) {
    case 'storm':
      return 'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_rgba(251,113,133,0.14),_transparent_55%)] before:content-[""]';
    case 'amber':
      return 'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.12),_transparent_55%)] before:content-[""]';
    case 'sky':
      return 'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.1),_transparent_55%)] before:content-[""]';
    default:
      return 'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.1),_transparent_55%)] before:content-[""]';
  }
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
  whyToday,
  watchFor,
  leadFact,
  leadFactDisplay,
  chartWhy,
  doNot,
  personalHook,
  confidenceWhy,
  domainJob,
  coreNotices,
  maskWants,
  tensionLine,
  resolution,
  whyThisPerson,
  behaviorTell,
  chartConfidence,
  readConfidence,
  chartConfidenceLabel,
  readConfidenceLabel,
  moveConfidence,
  themeLabel,
  heldFromYesterday = false,
  driverLabel = null,
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
  isError = false,
  onRetry,
  isEmpty = false,
  emptyTitle = 'No life weather yet',
  emptyMessage = "Build your chart from birth details and Merlin will assemble today's personal forecast.",
  risk = null,
  firstName = null,
}: TodayWeatherBriefProps) {
  useEffect(() => {
    if (loading || isError || isEmpty || !date || !todayMove) return;
    preservePriorWeatherWindow(date, userId);
    writeWeatherWindowSnapshot(
      {
        date,
        move: todayMove,
        themeLabel,
        intensity,
        behaviorTell,
      },
      userId,
    );
  }, [behaviorTell, date, intensity, isEmpty, isError, loading, themeLabel, todayMove, userId]);

  if (loading) {
    return (
      <ArcanePane
        tone="sky"
        shellClassName="border-sky-500/25 bg-slate-950/50"
        orbs
      >
        <AtmosphereHeader
          loading
          variant="hero"
          barLabel="Life weather"
          showGreeting
          firstName={firstName}
        />
        <div className="mt-5 space-y-3">
          <div className="h-20 w-full animate-pulse rounded-xl bg-emerald-900/25" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-700/50" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-700/50" />
        </div>
        {/* Signal lock progress — feels like computation, not a dead wait */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs tracking-wide text-sky-300/75">
            <Radio className="h-3.5 w-3.5 animate-pulse text-sky-300" aria-hidden />
            <span>Station locking signals…</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full border border-sky-400/20 bg-slate-900/80"
            role="progressbar"
            aria-label="Reading life weather"
            aria-valuetext="In progress"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-500"
              initial={{ x: '-100%', width: '45%' }}
              animate={{ x: ['-100%', '160%'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
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
  const moveEdge =
    arcaneTone === 'storm'
      ? 'border-rose-300/55 bg-gradient-to-br from-rose-500/25 via-rose-600/15 to-black/40 shadow-[0_0_36px_rgba(251,113,133,0.18)]'
      : arcaneTone === 'amber'
        ? 'border-amber-300/55 bg-gradient-to-br from-amber-400/30 via-amber-500/15 to-black/40 shadow-[0_0_36px_rgba(251,191,36,0.16)]'
        : 'border-emerald-300/55 bg-gradient-to-br from-emerald-400/28 via-emerald-500/12 to-black/40 shadow-[0_0_36px_rgba(52,211,153,0.16)]';
  const moveIcon =
    arcaneTone === 'storm'
      ? 'text-rose-200'
      : arcaneTone === 'amber'
        ? 'text-amber-200'
        : 'text-emerald-200';
  const moveLabel =
    arcaneTone === 'storm'
      ? 'text-rose-100/90'
      : arcaneTone === 'amber'
        ? 'text-amber-100/90'
        : 'text-emerald-100/90';
  const moveText = 'text-white';

  return (
    <ArcanePane
      tone={arcaneTone}
      shellClassName={`${getAtmosphereShellClassName(intensity, dayRating)} ${ambientWashClass(arcaneTone)}`}
      glass
      orbs
    >
      <div className="relative z-[1] flex flex-col gap-5">
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
          showGreeting
          firstName={firstName}
          risk={risk}
        />

        {/* Three-beat brief — Move is the 2-second headline */}
        <div className="relative space-y-3.5 overflow-hidden rounded-xl border border-white/15 bg-black/30 p-4 shadow-inner shadow-black/40 backdrop-blur-sm md:p-5">
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

          {todayMove ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`flex items-start gap-3.5 rounded-2xl border-2 px-4 py-4 md:px-5 md:py-5 ${moveEdge}`}
            >
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/25 ${moveIcon}`}
              >
                <Lightbulb className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${moveLabel}`}>
                  Today&apos;s move
                </p>
                <p
                  className={`mt-1.5 text-xl font-bold leading-snug tracking-tight md:text-2xl ${moveText}`}
                >
                  {todayMove}
                </p>
                {whyThisPerson || coreNotices || leadFactDisplay || chartWhy || watchFor || doNot || behaviorTell ? (
                  <dl className="mt-3 space-y-2.5 border-t border-white/10 pt-3">
                    {whyThisPerson ? (
                      <div>
                        <dt className={`text-[10px] font-bold uppercase tracking-[0.22em] ${moveLabel}`}>
                          Why this happens to you
                        </dt>
                        <dd className="mt-1 text-sm font-medium leading-relaxed text-white/85">
                          {whyThisPerson}
                        </dd>
                      </div>
                    ) : chartWhy ? (
                      <div>
                        <dt className={`text-[10px] font-bold uppercase tracking-[0.22em] ${moveLabel}`}>
                          Why this happens to you
                        </dt>
                        <dd className="mt-1 text-sm font-medium leading-relaxed text-white/85">
                          {chartWhy}
                        </dd>
                      </div>
                    ) : null}
                    {coreNotices || maskWants || tensionLine || resolution ? (
                      <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                        {coreNotices ? (
                          <p className="text-sm leading-snug text-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200/80">
                              Core notices{' '}
                            </span>
                            {coreNotices}
                          </p>
                        ) : null}
                        {maskWants ? (
                          <p className="text-sm leading-snug text-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/80">
                              Mask wants{' '}
                            </span>
                            {maskWants}
                          </p>
                        ) : null}
                        {tensionLine ? (
                          <p className="text-sm leading-snug text-slate-200">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-200/75">
                              Tension{' '}
                            </span>
                            {tensionLine}
                          </p>
                        ) : null}
                        {resolution ? (
                          <p className="text-sm leading-snug text-slate-200">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/80">
                              Resolution{' '}
                            </span>
                            {resolution}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {doNot ? (
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-100/80">
                          Avoid
                        </dt>
                        <dd className="mt-1 text-sm leading-snug text-slate-200/85">{doNot}</dd>
                      </div>
                    ) : null}
                    {behaviorTell ? (
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100/80">
                          What to watch
                        </dt>
                        <dd className="mt-1 text-sm leading-snug text-slate-200/85">{behaviorTell}</dd>
                      </div>
                    ) : watchFor ? (
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100/80">
                          What to watch
                        </dt>
                        <dd className="mt-1 text-sm leading-snug text-slate-200/85">{watchFor}</dd>
                      </div>
                    ) : null}
                    {leadFactDisplay?.trim() ? (
                      leadFact || whyToday ? (
                        <details className="group">
                          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 hover:text-slate-300">
                            <span>Sky mechanic</span>
                            <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-0.5 font-mono text-[11px] font-semibold normal-case tracking-normal text-white/90">
                              {leadFactDisplay}
                            </span>
                            {heldFromYesterday ? (
                              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-100">
                                Still applies
                              </span>
                            ) : null}
                          </summary>
                          {leadFact ? (
                            <p className="mt-1.5 text-xs leading-snug text-slate-400">{leadFact}</p>
                          ) : null}
                          {whyToday ? (
                            <p className="mt-1 text-xs leading-snug text-slate-500">{whyToday}</p>
                          ) : null}
                        </details>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                            Sky mechanic
                          </span>
                          <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white/90">
                            {leadFactDisplay}
                          </span>
                          {heldFromYesterday ? (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-100">
                              Still applies
                            </span>
                          ) : null}
                        </div>
                      )
                    ) : null}
                    {confidenceWhy ? (
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          Confidence
                        </dt>
                        <dd className="mt-1 text-sm leading-snug text-slate-300/90">{confidenceWhy}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </div>
            </motion.div>
          ) : null}

          {!chartWhy && story ? (
            <div className="border-t border-white/10 pt-3">
              <p className="text-sm leading-relaxed text-slate-300/90 md:text-[15px]">{story}</p>
            </div>
          ) : null}

          <YesterdayLandCheck userId={userId} today={date} />

          <div className="pt-0.5">
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
              elevatedDisruption: risk?.elevatedDisruption,
              confidence: moveConfidence ?? risk?.confidence,
              story: personalHook || chartWhy || story,
              why: whyToday || whyLine,
              move: todayMove,
              driver: leadFactDisplay || risk?.topDrivers?.[0]?.label || driverLabel || undefined,
            }}
          />
        </div>

        <p className="text-center font-mono text-[10px] tracking-[0.2em] text-slate-500/80">
          MERLIN · {formatStormWatchScoreLine(
            tone.label,
            resolveAtmosphereIntensity(intensity, dayRating),
            risk?.overallFriction,
          ).toUpperCase()}
        </p>
      </div>
    </ArcanePane>
  );
}
