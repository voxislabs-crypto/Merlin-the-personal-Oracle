'use client';

import type { BirthData } from '@/components/astrology/BirthChartCalculator';
import { useLiveOracle } from '@/hooks/useLiveOracle';

interface LiveOraclePanelProps {
  birthData: BirthData | null;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LiveOraclePanel({ birthData }: LiveOraclePanelProps) {
  const {
    isRunning,
    isChecking,
    intervalMinutes,
    powerProfile,
    proactiveNotifications,
    backgroundChecks,
    snapshot,
    error,
    start,
    stop,
    setIntervalMinutes,
    setPowerProfile,
    setProactiveNotifications,
    setBackgroundChecks,
    profiles,
    intervalRange,
  } = useLiveOracle();

  const disabled = !birthData;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-emerald-300">Live Oracle GPS</h3>
          <p className="text-sm text-emerald-100/80">
            Poll location every {intervalMinutes} minute{intervalMinutes === 1 ? '' : 's'} and generate local transit advice.
          </p>
        </div>

        {!isRunning ? (
          <button
            type="button"
            disabled={disabled || isChecking}
            onClick={() => {
              if (birthData) {
                void start(birthData);
              }
            }}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isChecking ? 'Starting...' : 'Start Live Oracle'}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100"
          >
            Stop Live Oracle
          </button>
        )}
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-xs uppercase tracking-wide text-emerald-200/80">
          Check Interval ({intervalRange.min}-{intervalRange.max} minutes)
        </label>
        <input
          type="range"
          min={intervalRange.min}
          max={intervalRange.max}
          value={intervalMinutes}
          onChange={(event) => setIntervalMinutes(Number(event.target.value))}
          className="w-full"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => setPowerProfile(profile.id)}
            className={`rounded-md border px-2 py-2 text-xs transition ${
              powerProfile === profile.id
                ? 'border-emerald-300 bg-emerald-500/20 text-emerald-200'
                : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-emerald-500/50'
            }`}
          >
            <div className="font-semibold">{profile.label}</div>
            <div className="opacity-80">{profile.minutes}m</div>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2 rounded-lg border border-emerald-500/20 bg-slate-900/40 p-3 text-sm text-slate-200">
        <label className="flex items-center justify-between gap-3">
          <span>Proactive notifications</span>
          <input
            type="checkbox"
            checked={proactiveNotifications}
            onChange={(event) => setProactiveNotifications(event.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span>Background checks (Android)</span>
          <input
            type="checkbox"
            checked={backgroundChecks}
            onChange={(event) => setBackgroundChecks(event.target.checked)}
          />
        </label>
        <p className="text-xs text-slate-400">
          Background task cadence is OS-managed. Foreground cadence uses your exact selected interval.
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {snapshot && (
        <div className="mt-4 space-y-2 rounded-lg border border-emerald-400/30 bg-slate-950/40 p-4">
          <p className="text-sm text-slate-200">
            Last check: <span className="font-medium text-emerald-300">{formatTime(snapshot.timestamp)}</span>
          </p>
          <p className="text-sm text-slate-200">
            Location: {snapshot.location.latitude.toFixed(3)}, {snapshot.location.longitude.toFixed(3)}
            {typeof snapshot.location.accuracy === 'number' ? ` (±${Math.round(snapshot.location.accuracy)}m)` : ''}
          </p>
          <p className="text-sm text-slate-200">
            Transit pulse: {snapshot.transitSummary.exact} exact / {snapshot.transitSummary.approaching} approaching
          </p>
          <p className="text-sm text-emerald-100">{snapshot.advice}</p>
        </div>
      )}

      {!birthData && (
        <p className="mt-3 text-sm text-amber-200">
          Calculate a birth chart first to enable location-based advice.
        </p>
      )}
    </div>
  );
}
