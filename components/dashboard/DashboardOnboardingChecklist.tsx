'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronUp, Circle, ListTodo, X } from 'lucide-react';
import type { DashboardExperienceTab } from '@/components/dashboard/DashboardExperienceTabs';

export type OnboardingStepId =
  | 'chart'
  | 'explore-chart'
  | 'sky-tone'
  | 'daily-forecast'
  | 'storm-radar'
  | 'ask-merlin';

interface DashboardOnboardingChecklistProps {
  dashboardTab: DashboardExperienceTab;
  hasAskedMerlin: boolean;
  onDismiss: () => void;
  onNavigateToChart: () => void;
  onNavigateToForecast: () => void;
  onNavigateToStormRadar: () => void;
  onNavigateToAskMerlin: () => void;
  onAllStepsComplete?: () => void;
  hasSeenAtmosphere?: boolean;
}

type OnboardingStep = {
  id: OnboardingStepId;
  label: string;
  hint: string;
  complete: boolean;
  onNavigate: () => void;
};

export function DashboardOnboardingChecklist({
  dashboardTab,
  hasAskedMerlin,
  onDismiss,
  onNavigateToChart,
  onNavigateToForecast,
  onNavigateToStormRadar,
  onNavigateToAskMerlin,
  onAllStepsComplete,
  hasSeenAtmosphere = false,
}: DashboardOnboardingChecklistProps) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [visitedChartTab, setVisitedChartTab] = useState(false);
  const [visitedHomeTab, setVisitedHomeTab] = useState(false);
  const [visitedForecastTab, setVisitedForecastTab] = useState(false);
  const completedNotifiedRef = useRef(false);

  useEffect(() => {
    if (dashboardTab === 'chart') setVisitedChartTab(true);
    if (dashboardTab === 'home') setVisitedHomeTab(true);
    if (dashboardTab === 'forecast') setVisitedForecastTab(true);
  }, [dashboardTab]);

  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        id: 'chart',
        label: 'Chart calculated',
        hint: 'Your natal placements are loaded.',
        complete: true,
        onNavigate: onNavigateToChart,
      },
      {
        id: 'explore-chart',
        label: 'Explore your chart',
        hint: 'Open My Chart and scan your wheel.',
        complete: visitedChartTab,
        onNavigate: onNavigateToChart,
      },
      {
        id: 'sky-tone',
        label: 'Your sky tone updates daily',
        hint: 'Home shows intensity, day rating, and what is driving today from your chart.',
        complete: hasSeenAtmosphere || visitedHomeTab,
        onNavigate: onNavigateToForecast,
      },
      {
        id: 'daily-forecast',
        label: "Read today's story",
        hint: 'See what today means for you on Home.',
        complete: visitedHomeTab,
        onNavigate: onNavigateToForecast,
      },
      {
        id: 'storm-radar',
        label: 'Check Storm Radar',
        hint: 'Preview upcoming pressure windows.',
        complete: visitedForecastTab,
        onNavigate: onNavigateToStormRadar,
      },
      {
        id: 'ask-merlin',
        label: 'Ask Merlin one question',
        hint: 'Turn the read into a concrete next move.',
        complete: hasAskedMerlin,
        onNavigate: onNavigateToAskMerlin,
      },
    ],
    [
      hasAskedMerlin,
      onNavigateToAskMerlin,
      onNavigateToChart,
      onNavigateToForecast,
      onNavigateToStormRadar,
      hasSeenAtmosphere,
      visitedChartTab,
      visitedForecastTab,
      visitedHomeTab,
    ]
  );

  const completedCount = steps.filter((step) => step.complete).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const allComplete = completedCount === steps.length;
  const showPanel = open || pinned;
  const nextStep = steps.find((step) => !step.complete);

  useEffect(() => {
    if (!allComplete || completedNotifiedRef.current) return;
    completedNotifiedRef.current = true;
    onAllStepsComplete?.();
  }, [allComplete, onAllStepsComplete]);

  const handleStepClick = (step: OnboardingStep) => {
    if (step.complete) return;
    step.onNavigate();
    setPinned(true);
    setOpen(true);
  };

  return (
    <div
      className="fixed bottom-24 right-6 z-[60] flex flex-col items-end"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!pinned) setOpen(false);
      }}
    >
      <AnimatePresence initial={false}>
        {showPanel ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="mb-2 w-[min(92vw,320px)] overflow-hidden rounded-2xl border border-slate-600/60 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-amber-300/80">First session</p>
                <h3 className="text-sm font-semibold text-slate-50">Getting started</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPinned(false);
                  setOpen(false);
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                aria-label="Minimize checklist"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {completedCount} of {steps.length} complete
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-cyan-400"
                  initial={false}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </div>

            <ul className="max-h-[min(50vh,280px)] space-y-0.5 overflow-y-auto px-2 pb-2">
              {steps.map((step) => {
                const isNext = nextStep?.id === step.id;
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => handleStepClick(step)}
                      disabled={step.complete}
                      className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                        step.complete
                          ? 'cursor-default opacity-80'
                          : 'hover:bg-white/5 cursor-pointer'
                      } ${isNext && !step.complete ? 'bg-amber-500/10 ring-1 ring-amber-400/25' : ''}`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          step.complete
                            ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                            : 'border-slate-500/70 text-slate-500'
                        }`}
                      >
                        {step.complete ? <Check className="h-3 w-3" strokeWidth={3} /> : <Circle className="h-2 w-2 fill-current" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-medium ${step.complete ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                          {step.label}
                        </span>
                        {!step.complete ? (
                          <span className="mt-0.5 block text-[11px] text-slate-400">{step.hint}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5">
              <button
                type="button"
                onClick={onDismiss}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-200"
              >
                Dismiss checklist
              </button>
              <button
                type="button"
                onClick={() => setPinned((prev) => !prev)}
                className="text-[11px] font-medium text-amber-200/90 hover:text-amber-100"
              >
                {pinned ? 'Unpin' : 'Keep open'}
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
        className="inline-flex items-center gap-2 rounded-full border border-slate-600/70 bg-slate-950/90 px-3.5 py-2 text-sm font-semibold text-slate-100 shadow-lg shadow-black/30 backdrop-blur-md transition hover:border-amber-400/40 hover:bg-slate-900"
        aria-expanded={showPanel}
        aria-label="Open getting started checklist"
      >
        <ListTodo className="h-4 w-4 text-amber-300" />
        <span>Getting started</span>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
          {completedCount}/{steps.length}
        </span>
        {!showPanel ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
      </button>
    </div>
  );
}