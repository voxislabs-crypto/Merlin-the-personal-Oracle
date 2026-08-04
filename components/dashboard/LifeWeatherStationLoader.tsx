'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CloudSun, Radio } from 'lucide-react';

export interface WeatherStationStage {
  id: string;
  /** Short station-code style label */
  code: string;
  /** Human narrative line */
  line: string;
  /** Secondary radar / console line */
  radar: string;
}

const DEFAULT_STAGES: WeatherStationStage[] = [
  {
    id: 'verify',
    code: 'SIG-LOCK',
    line: 'Verifying birth info…',
    radar: 'Coordinates and local time locked',
  },
  {
    id: 'horizon',
    code: 'HORIZON',
    line: 'Scanning the horizon…',
    radar: 'Charting planetary currents',
  },
  {
    id: 'positions',
    code: 'EPHEMERIS',
    line: 'Calculating planetary positions…',
    radar: 'Swiss Ephemeris resolution',
  },
  {
    id: 'transits',
    code: 'CURRENTS',
    line: 'Mapping transit influences…',
    radar: 'Pressure systems forming',
  },
  {
    id: 'weather',
    code: 'FORECAST',
    line: 'Building your life weather…',
    radar: 'Composing personal atmosphere',
  },
  {
    id: 'complete',
    code: 'CLEAR',
    line: 'Forecast complete.',
    radar: 'Life weather station online',
  },
];

export interface LifeWeatherStationLoaderProps {
  /** True while the chart request is in flight (or finishing narrative) */
  active: boolean;
  /** Flip true when calculation succeeded */
  complete?: boolean;
  /** Called after the complete stage has been held briefly */
  onFinished?: () => void;
  /** Override stage list (last stage should be the complete beat) */
  stages?: WeatherStationStage[] | null;
  /** ms to hold each stage while API still running */
  stageIntervalMs?: number;
  /** ms per remaining stage once API is done (fast drain) */
  drainIntervalMs?: number;
  /** ms to hold the final “Forecast complete” beat */
  completeHoldMs?: number;
  className?: string;
  /** Compact embed (e.g. under the form button) */
  compact?: boolean;
}

/**
 * Progressive “weather station” narrative for chart calculation.
 * Makes wait intentional and reinforces life-weather branding.
 * If the API returns early, remaining stages drain quickly so the full story still plays.
 */
export function LifeWeatherStationLoader({
  active,
  complete = false,
  onFinished,
  stages: stagesProp,
  stageIntervalMs = 1150,
  drainIntervalMs = 380,
  completeHoldMs = 950,
  className = '',
  compact = false,
}: LifeWeatherStationLoaderProps) {
  const stages = stagesProp?.length ? stagesProp : DEFAULT_STAGES;
  const lastIndex = stages.length - 1;
  const [stepIndex, setStepIndex] = useState(0);
  const finishedRef = useRef(false);

  // Reset when a new run starts
  useEffect(() => {
    if (active && !complete) {
      setStepIndex(0);
      finishedRef.current = false;
    }
  }, [active, complete]);

  // Advance stages: normal pace while waiting, drain pace after API complete
  useEffect(() => {
    if (!active) return;
    if (stepIndex >= lastIndex) return;

    // Don't enter final "complete" stage until API says complete
    if (!complete && stepIndex >= lastIndex - 1) return;

    const delay = complete ? drainIntervalMs : stageIntervalMs;
    const t = window.setTimeout(() => {
      setStepIndex((i) => Math.min(i + 1, lastIndex));
    }, delay);

    return () => window.clearTimeout(t);
  }, [active, complete, stepIndex, lastIndex, stageIntervalMs, drainIntervalMs]);

  // When on final stage with API complete, hold then finish
  useEffect(() => {
    if (!active || !complete) return;
    if (stepIndex < lastIndex) return;
    if (finishedRef.current) return;

    const t = window.setTimeout(() => {
      finishedRef.current = true;
      onFinished?.();
    }, completeHoldMs);

    return () => window.clearTimeout(t);
  }, [active, complete, stepIndex, lastIndex, completeHoldMs, onFinished]);

  if (!active) return null;

  const current = stages[Math.min(stepIndex, lastIndex)];
  const showComplete = complete && stepIndex >= lastIndex;
  const progress = showComplete
    ? 100
    : Math.round(((stepIndex + 1) / stages.length) * 92);

  const shellPad = compact ? 'p-5 md:p-6' : 'p-6 md:p-10';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!showComplete}
      className={`relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 ${shellPad} shadow-2xl shadow-sky-950/40 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56,189,248,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-sky-400/10 to-transparent"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
      />

      <div className={`relative z-10 ${compact ? 'space-y-5' : 'space-y-8'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/10">
              {showComplete ? (
                <CloudSun className="h-6 w-6 text-amber-300" />
              ) : (
                <Radio className="h-6 w-6 text-sky-300 animate-pulse" />
              )}
              {!showComplete ? (
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
                </span>
              ) : null}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-sky-300/85">
                Life weather station
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-50 md:text-xl">
                {showComplete ? 'Station online' : 'Building your forecast'}
              </h3>
              <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                MERLIN · LW-01 · {current.code}
              </p>
            </div>
          </div>
          <div className="font-mono text-xs text-sky-200/70 sm:text-right">
            <div>{showComplete ? 'STATUS · CLEAR' : 'STATUS · SCAN'}</div>
            <div className="text-slate-500">{progress.toString().padStart(3, '0')}% COMPOSITE</div>
          </div>
        </div>

        {!compact ? (
          <div className="flex justify-center py-2">
            <div className="relative h-36 w-36">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-sky-400/25"
                  style={{ margin: i * 14 }}
                  animate={
                    showComplete
                      ? { opacity: 0.5, scale: 1 }
                      : { opacity: [0.2, 0.65, 0.2], scale: [1, 1.04, 1] }
                  }
                  transition={{
                    duration: 2.2,
                    delay: i * 0.25,
                    repeat: showComplete ? 0 : Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.9)]"
                  animate={showComplete ? { scale: 1.2 } : { scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.2, repeat: showComplete ? 0 : Infinity }}
                />
              </div>
              {!showComplete ? (
                <motion.div
                  className="absolute left-1/2 top-1/2 h-[2px] w-1/2 origin-left bg-gradient-to-r from-sky-300/80 to-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                  style={{ marginTop: -1 }}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-sky-500/20 bg-black/30 px-4 py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-sky-400/80">
                {current.code}
              </p>
              <p className="mt-1 text-base font-medium text-sky-50 md:text-lg">{current.line}</p>
              <p className="mt-1 text-sm text-slate-400">{current.radar}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-300"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        <ol className="space-y-2">
          {stages.map((stage, i) => {
            const done = i < stepIndex || (showComplete && i <= stepIndex);
            const currentStep = i === stepIndex && !showComplete;
            const isFinalLive = showComplete && i === lastIndex;
            const pending = !done && !currentStep && !isFinalLive;

            return (
              <li
                key={stage.id}
                className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  currentStep || isFinalLive
                    ? 'bg-sky-500/10 text-sky-100'
                    : done
                      ? 'text-slate-300'
                      : 'text-slate-600'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono ${
                    done || isFinalLive
                      ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                      : currentStep
                        ? 'border-sky-400/50 bg-sky-500/15 text-sky-200'
                        : 'border-slate-700 text-slate-600'
                  }`}
                >
                  {done || isFinalLive ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    String(i + 1).padStart(2, '0')
                  )}
                </span>
                <span className={pending ? '' : 'font-medium'}>
                  {stage.line.replace(/…$/, '').replace(/\.$/, '')}
                </span>
                {currentStep ? (
                  <span className="ml-auto font-mono text-[10px] text-sky-400/80 animate-pulse">
                    LIVE
                  </span>
                ) : null}
                {isFinalLive ? (
                  <span className="ml-auto font-mono text-[10px] text-emerald-400/90">CLEAR</span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export { DEFAULT_STAGES as LIFE_WEATHER_STATION_STAGES };
