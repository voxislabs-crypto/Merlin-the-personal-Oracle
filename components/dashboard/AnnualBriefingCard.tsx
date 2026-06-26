'use client';

import { motion } from 'framer-motion';
import { CalendarHeart, Sparkles } from 'lucide-react';
import type { SolarReturnBriefing } from '@/lib/astrology/returns-types';

interface AnnualBriefingCardProps {
  briefing?: SolarReturnBriefing | null;
  loading?: boolean;
  onAskMerlin?: () => void;
}

export function AnnualBriefingCard({ briefing, loading = false, onAskMerlin }: AnnualBriefingCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5 animate-pulse">
        <div className="h-4 w-40 bg-amber-300/20 rounded mb-3" />
        <div className="h-3 w-full bg-amber-300/10 rounded mb-2" />
        <div className="h-3 w-5/6 bg-amber-300/10 rounded" />
      </div>
    );
  }

  if (!briefing) return null;

  const countdownLabel =
    briefing.daysToReturn > 0
      ? `${briefing.daysToReturn} day${briefing.daysToReturn === 1 ? '' : 's'} until solar return`
      : `${briefing.daysSinceReturn} day${briefing.daysSinceReturn === 1 ? '' : 's'} into this solar year`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-500/10 via-slate-950/70 to-orange-500/10 p-5 md:p-6 shadow-lg shadow-amber-950/20"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-amber-300/30 bg-black/20 p-3">
          <CalendarHeart className="h-5 w-5 text-amber-200" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-200/80">Annual briefing</p>
          <h3 className="mt-1 text-lg font-bold text-amber-50">
            Solar return {briefing.returnYear} · {briefing.ascendantSign} rising
          </h3>
          <p className="mt-1 text-xs text-amber-100/75">{countdownLabel}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-amber-50/95">{briefing.annualTheme}</p>

      <ul className="mt-3 space-y-1.5">
        {briefing.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-2 text-sm text-amber-100/90">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-amber-100/70 border-t border-amber-300/15 pt-3">
        Profection layer: {briefing.profectionTheme}
      </p>

      {onAskMerlin ? (
        <button
          type="button"
          onClick={onAskMerlin}
          className="mt-4 inline-flex items-center rounded-full border border-amber-300/35 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/20 transition-colors"
        >
          Ask Merlin about this solar year
        </button>
      ) : null}
    </motion.section>
  );
}