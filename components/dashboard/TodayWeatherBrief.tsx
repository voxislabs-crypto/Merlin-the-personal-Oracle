'use client';

import { motion } from 'framer-motion';
import { Compass, Lightbulb, MessageCircle } from 'lucide-react';
import ThumbsFeedback from '@/components/astrology/ThumbsFeedback';
import {
  AtmosphereHeader,
  getAtmosphereShellClassName,
} from '@/components/dashboard/AtmosphereHeader';
import type { DayRating } from '@/lib/dashboard/cosmic-rating';

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
}: TodayWeatherBriefProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-sky-500/20 bg-slate-900/50 p-6 animate-pulse">
        <AtmosphereHeader loading variant="hero" barLabel="Life weather" />
        <div className="mt-5 space-y-2">
          <div className="h-3 w-full bg-slate-700/50 rounded" />
          <div className="h-3 w-5/6 bg-slate-700/50 rounded" />
          <div className="h-10 w-full bg-emerald-900/20 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${getAtmosphereShellClassName(intensity, dayRating)} p-5 md:p-7`}
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

        {/* Three-beat brief: story · why · move */}
        <div className="rounded-xl border border-white/10 bg-black/25 p-4 md:p-5 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 mb-1.5">How it feels</p>
            <p className="text-base md:text-lg leading-relaxed text-white/95 font-medium">{story}</p>
          </div>

          {whyLine ? (
            <div className="border-t border-white/10 pt-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 mb-1.5">Why</p>
              <p className="text-sm md:text-[15px] text-slate-200/95 leading-relaxed">{whyLine}</p>
            </div>
          ) : null}

          {todayMove ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-3">
              <Lightbulb className="h-5 w-5 text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/80 font-semibold">
                  Today&apos;s move
                </p>
                <p className="mt-0.5 text-sm md:text-[15px] text-emerald-50 leading-relaxed">{todayMove}</p>
              </div>
            </div>
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
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2.5 text-sm font-semibold text-sky-50 hover:bg-sky-500/25 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              {askLabel}
            </button>
          ) : null}
          {onExploreSelf ? (
            <button
              type="button"
              onClick={onExploreSelf}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/35 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-500/20 transition-colors"
            >
              <Compass className="h-4 w-4" />
              Who you are · Self
            </button>
          ) : null}
          {selfChips.length ? (
            <p className="text-xs text-slate-400 sm:ml-auto">
              {selfChips.join(' · ')}
            </p>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
