'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, ChevronUp, Flame, X } from 'lucide-react';

interface DashboardDailyRitualPromptProps {
  enabled: boolean;
  streak: number;
  showWeeklyReset: boolean;
  calibrationRecomputing: boolean;
  onDismissForToday: () => void;
  onRefreshOracle: () => void;
  onOpenForecast: () => void;
  onDailyCheckin: () => void;
  onRecomputeCalibration: () => void;
  onWeeklyReset: () => void;
  onDismissWeeklyReset: () => void;
}

export function DashboardDailyRitualPrompt({
  enabled,
  streak,
  showWeeklyReset,
  calibrationRecomputing,
  onDismissForToday,
  onRefreshOracle,
  onOpenForecast,
  onDailyCheckin,
  onRecomputeCalibration,
  onWeeklyReset,
  onDismissWeeklyReset,
}: DashboardDailyRitualPromptProps) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      setOpen(false);
      return;
    }

    setOpen(true);
    const timer = window.setTimeout(() => setVisible(true), 2800);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  if (!enabled || !visible) {
    return null;
  }

  const showPanel = open || pinned;

  return (
    <div
      className="fixed bottom-6 left-6 z-[55] flex flex-col items-start"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!pinned) setOpen(false);
      }}
    >
      <AnimatePresence initial={false}>
        {showPanel ? (
          <motion.div
            key="daily-ritual-panel"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="mb-2 w-[min(92vw,340px)] overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">Welcome back</p>
                <h3 className="text-sm font-semibold text-slate-50">Your daily ritual</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPinned(false);
                  setOpen(false);
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                aria-label="Minimize daily ritual"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-cyan-100">
                <Flame className="h-4 w-4 text-orange-300" />
                <span>
                  Day {streak} of your streak
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                One fresh oracle read and one focused question today keeps your timing reads sharp.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 px-4 pb-3">
              <button
                type="button"
                onClick={onRefreshOracle}
                className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25"
              >
                Refresh oracle
              </button>
              <button
                type="button"
                onClick={onOpenForecast}
                className="rounded-full border border-indigo-300/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/25"
              >
                Open forecast
              </button>
              <button
                type="button"
                onClick={onDailyCheckin}
                className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/25"
              >
                Ask daily check-in
              </button>
            </div>

            {showWeeklyReset ? (
              <div className="mx-4 mb-3 rounded-xl border border-amber-300/25 bg-amber-500/10 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Fresh start</p>
                <p className="mt-1 text-sm text-amber-50">
                  Your streak reset — want a one-step plan to rebuild momentum this week?
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onWeeklyReset}
                    className="rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
                  >
                    Start fresh week
                  </button>
                  <button
                    type="button"
                    onClick={onDismissWeeklyReset}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-white/10"
                  >
                    Not now
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5">
              <button
                type="button"
                onClick={onDismissForToday}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-200"
              >
                Got it — hide for today
              </button>
              <button
                type="button"
                onClick={onRecomputeCalibration}
                disabled={calibrationRecomputing}
                className="text-[11px] font-medium text-emerald-200/90 hover:text-emerald-100 disabled:opacity-60"
              >
                {calibrationRecomputing ? 'Recalibrating...' : 'Recalibrate'}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setPinned((prev) => !prev);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-cyan-500/35 bg-slate-950/90 px-3.5 py-2 text-sm font-semibold text-slate-100 shadow-lg shadow-black/30 backdrop-blur-md transition hover:border-cyan-400/45 hover:bg-slate-900"
        aria-expanded={showPanel}
        aria-label="Open daily ritual"
      >
        <CalendarCheck className="h-4 w-4 text-cyan-300" />
        <span>Daily ritual</span>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
          {streak}d
        </span>
        {!showPanel ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
      </button>
    </div>
  );
}