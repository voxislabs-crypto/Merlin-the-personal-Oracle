'use client';

import { motion } from 'framer-motion';
import { Compass, MessageCircle } from 'lucide-react';
import { DayRatingBadge } from '@/components/dashboard/DayRatingBadge';

interface ChartIdentityBriefProps {
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  mbtiType?: string;
  dayRating?: string;
  headline?: string;
  onAskMerlin?: () => void;
}

export function ChartIdentityBrief({
  sunSign,
  moonSign,
  risingSign,
  mbtiType,
  dayRating,
  headline,
  onAskMerlin,
}: ChartIdentityBriefProps) {
  const placements = [
    sunSign ? `Sun ${sunSign}` : null,
    moonSign ? `Moon ${moonSign}` : null,
    risingSign ? `Rising ${risingSign}` : null,
  ].filter(Boolean);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-violet-950/25 p-5 md:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-amber-400/30 bg-black/20 p-3">
            <Compass className="h-6 w-6 text-amber-200" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-amber-200/75">Chart identity</p>
            <h2 className="mt-1 text-xl md:text-2xl font-bold text-amber-50">Your natal blueprint</h2>
            {placements.length ? (
              <p className="mt-2 text-sm text-slate-300">{placements.join(' · ')}</p>
            ) : null}
            {mbtiType ? (
              <p className="mt-1 text-sm text-violet-200/90">
                Personality lens: <span className="font-semibold">{mbtiType}</span>
              </p>
            ) : null}
            {dayRating ? (
              <div className="mt-2">
                <DayRatingBadge dayRating={dayRating} />
              </div>
            ) : null}
          </div>
        </div>
        {onAskMerlin ? (
          <button
            type="button"
            onClick={onAskMerlin}
            className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-300/35 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
          >
            <MessageCircle className="h-4 w-4" />
            Explain my chart
          </button>
        ) : null}
      </div>
      {headline ? (
        <p className="mt-4 text-sm md:text-base leading-relaxed text-slate-200 border-t border-white/10 pt-4">
          {headline}
        </p>
      ) : null}
    </motion.section>
  );
}