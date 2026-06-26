'use client';

import { motion } from 'framer-motion';
import { Lightbulb, MessageCircle } from 'lucide-react';
import ThumbsFeedback from '@/components/astrology/ThumbsFeedback';
import {
  AtmosphereHeader,
  getAtmosphereShellClassName,
} from '@/components/dashboard/AtmosphereHeader';
import type { DayRating } from '@/lib/dashboard/cosmic-rating';

interface CosmicStoryCardProps {
  intensity: number;
  feltIntensity?: number;
  sentimentScore?: number | null;
  dayRating?: DayRating | string;
  date?: string;
  story: string;
  whyLine?: string;
  todayMove?: string;
  mbtiType?: string;
  mbtiGuidance?: string;
  moonPhase?: string;
  moonSign?: string;
  streak?: number;
  loading?: boolean;
  userId?: string;
  onAskMerlin?: () => void;
  eyebrow?: string;
  askLabel?: string;
  confluenceAligned?: boolean;
  confluenceThemes?: string[];
}

export function CosmicStoryCard({
  intensity,
  feltIntensity,
  sentimentScore,
  dayRating,
  date,
  story,
  whyLine,
  todayMove,
  mbtiType,
  mbtiGuidance,
  moonPhase,
  moonSign,
  streak,
  loading = false,
  userId,
  onAskMerlin,
  eyebrow = "Today's cosmic story",
  askLabel = 'Ask Merlin about today',
  confluenceAligned,
  confluenceThemes,
}: CosmicStoryCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 animate-pulse">
        <AtmosphereHeader loading variant="hero" />
        <div className="mt-5 space-y-2">
          <div className="h-3 w-full bg-slate-700/50 rounded" />
          <div className="h-3 w-5/6 bg-slate-700/50 rounded" />
          <div className="h-3 w-2/3 bg-slate-700/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${getAtmosphereShellClassName(intensity, dayRating)} p-5 md:p-6`}
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
          confluenceAligned={confluenceAligned}
          confluenceThemes={confluenceThemes}
        />

        <div className="rounded-xl border border-white/10 bg-black/20 p-4 md:p-5">
          <p className="text-base md:text-lg leading-relaxed text-white/95">{story}</p>
          {whyLine ? (
            <p className="mt-3 text-sm text-slate-300/90 border-t border-white/10 pt-3">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-2">Why</span>
              {whyLine}
            </p>
          ) : null}
          {todayMove ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2.5">
              <Lightbulb className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-50">
                <span className="font-semibold text-emerald-200">Today&apos;s move: </span>
                {todayMove}
              </p>
            </div>
          ) : null}
          {mbtiType && mbtiGuidance ? (
            <p className="mt-3 text-sm italic text-violet-200/90 border-t border-white/10 pt-3">
              As {mbtiType}, {mbtiGuidance.replace(/^As an? [A-Z]{4},?\s*/i, '')}
            </p>
          ) : null}
          <div className="mt-3">
            <ThumbsFeedback
              itemId={`cosmic-story-${date || 'today'}`}
              label="today's story"
              userId={userId}
              theme="forecast"
            />
          </div>
        </div>

        {onAskMerlin ? (
          <button
            type="button"
            onClick={onAskMerlin}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-amber-300/35 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/20 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {askLabel}
          </button>
        ) : null}
      </div>
    </motion.section>
  );
}