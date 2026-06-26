'use client';

import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import type { LunarEmotionalTone, LunarReturnWeather } from '@/lib/astrology/returns-types';

interface LunarReturnWeatherCardProps {
  weather?: LunarReturnWeather | null;
  loading?: boolean;
}

const TONE_STYLES: Record<LunarEmotionalTone, string> = {
  supportive: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
  volatile: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
  reflective: 'border-violet-400/30 bg-violet-500/10 text-violet-100',
  open: 'border-sky-400/30 bg-sky-500/10 text-sky-100',
};

export function LunarReturnWeatherCard({ weather, loading = false }: LunarReturnWeatherCardProps) {
  if (loading) {
    return <div className="h-28 rounded-2xl border border-slate-700/50 bg-slate-900/50 animate-pulse" />;
  }

  if (!weather) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 md:p-5 ${TONE_STYLES[weather.emotionalTone]}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg border border-white/15 bg-black/20 p-2">
            <Moon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] opacity-80">Lunar return weather</p>
            <p className="text-sm font-semibold">
              Moon in {weather.moonSign} · day {weather.daysIntoCycle} of cycle
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-wider">
          {weather.emotionalTone}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed">{weather.headline}</p>
      <p className="mt-2 text-xs opacity-85">{weather.guidance}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {weather.highlights.map((highlight) => (
          <span
            key={highlight}
            className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-[11px]"
          >
            {highlight}
          </span>
        ))}
      </div>

      <p className="mt-3 text-[11px] opacity-70">
        Next lunar return around {weather.nextReturnDate} ({weather.daysUntilNextReturn} days)
      </p>
    </motion.section>
  );
}