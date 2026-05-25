interface CalibrationMasteryCardProps {
  streak: number;
  calibrationScore: number;
  trendDelta: number | null;
  stabilityLabel: 'Stable' | 'Settling' | 'Volatile';
}

function formatDelta(delta: number | null): string {
  if (delta === null) return 'No prior baseline';
  if (Math.abs(delta) < 0.01) return 'No change';
  const direction = delta > 0 ? '+' : '';
  return `${direction}${delta.toFixed(2)} vs prior`;
}

function getStabilityClasses(label: CalibrationMasteryCardProps['stabilityLabel']): string {
  if (label === 'Stable') return 'border-emerald-400/50 bg-emerald-600/20 text-emerald-100';
  if (label === 'Settling') return 'border-amber-400/50 bg-amber-600/20 text-amber-100';
  return 'border-rose-400/50 bg-rose-600/20 text-rose-100';
}

export function CalibrationMasteryCard({
  streak,
  calibrationScore,
  trendDelta,
  stabilityLabel,
}: CalibrationMasteryCardProps) {
  const level = Math.max(1, Math.min(10, Math.round(calibrationScore / 10)));

  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-950/55 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300/80">Calibration</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-50">Forecast Mastery</h3>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getStabilityClasses(stabilityLabel)}`}>
          {stabilityLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Calibration Score</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-200">{calibrationScore.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Daily Streak</p>
          <p className="mt-1 text-2xl font-semibold text-cyan-200">{streak} days</p>
        </div>
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Mastery Level</p>
          <p className="mt-1 text-2xl font-semibold text-violet-200">L{level}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-300">Trend: {formatDelta(trendDelta)}</p>
      <p className="mt-1 text-xs text-slate-300">
        Keep check-ins consistent to unlock better forecast precision and stronger domain guidance.
      </p>
    </section>
  );
}
