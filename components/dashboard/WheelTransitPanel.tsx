'use client';

import { ArrowRight, Zap } from 'lucide-react';
import { AtmosphereHeader } from '@/components/dashboard/AtmosphereHeader';
import type { DayRating } from '@/lib/dashboard/cosmic-rating';

interface TransitAlert {
  transitingPlanet: string;
  transitingSign: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  exact: boolean;
  shortDescription?: string;
}

interface WheelTransitPanelProps {
  intensity?: number;
  dayRating?: DayRating | string;
  driverLabel?: string;
  moonPhase?: string;
  moonSign?: string;
  significant: TransitAlert[];
  approaching: TransitAlert[];
  loading?: boolean;
  transitsLoading?: boolean;
  onAskContext?: (label: string, prompt: string) => void;
  onOpenHomeForecast?: () => void;
}

export function WheelTransitPanel({
  intensity,
  dayRating,
  driverLabel,
  moonPhase,
  moonSign,
  significant,
  approaching,
  loading,
  transitsLoading,
  onAskContext,
  onOpenHomeForecast,
}: WheelTransitPanelProps) {
  const alerts = [...significant, ...approaching].slice(0, 5);
  const atmosphereLoading = loading && !intensity;

  if (loading || transitsLoading) {
    return (
      <div className="space-y-3">
        <AtmosphereHeader loading variant="compact" />
        <div className="space-y-2 animate-pulse">
          <div className="h-20 rounded-xl bg-slate-800/40" />
          <div className="h-20 rounded-xl bg-slate-800/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-purple-200">Transit alerts</h3>
          <p className="text-xs text-slate-400 mt-0.5">Active pressure on your chart right now</p>
        </div>
        {onOpenHomeForecast ? (
          <button
            type="button"
            onClick={onOpenHomeForecast}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200/90 hover:text-amber-100 transition"
          >
            Full daily story on Home
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <AtmosphereHeader
        intensity={intensity}
        dayRating={dayRating}
        driverLabel={driverLabel}
        moonPhase={moonPhase}
        moonSign={moonSign}
        variant="compact"
        loading={atmosphereLoading}
      />

      {alerts.length ? (
        <div className="space-y-2">
          {alerts.map((transit) => {
            const label = `${transit.transitingPlanet} ${transit.aspect} ${transit.natalPlanet}`;
            return (
              <button
                key={`${label}-${transit.orb}`}
                type="button"
                onClick={() =>
                  onAskContext?.(
                    label,
                    `What should I do with this transit today: ${transit.transitingPlanet} ${transit.aspect} natal ${transit.natalPlanet}?`
                  )
                }
                className="w-full text-left rounded-xl border border-red-500/25 bg-red-950/20 px-4 py-3 hover:border-red-400/40 hover:bg-red-950/30 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap className="h-3.5 w-3.5 shrink-0 text-red-300" />
                    <p className="text-sm font-semibold text-red-100 truncate">
                      {transit.transitingPlanet} {transit.aspect} {transit.natalPlanet}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-red-200/80">
                    {transit.exact ? 'Exact' : `${transit.orb.toFixed(1)}°`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                  {transit.shortDescription ||
                    `${transit.transitingPlanet} in ${transit.transitingSign} ${transit.aspect.toLowerCase()} your natal ${transit.natalPlanet}.`}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-5 text-center">
          <p className="text-sm text-emerald-100">No major transit alerts right now.</p>
          <p className="mt-1 text-xs text-slate-400">Open Home for the full daily story and timing windows.</p>
        </div>
      )}
    </div>
  );
}