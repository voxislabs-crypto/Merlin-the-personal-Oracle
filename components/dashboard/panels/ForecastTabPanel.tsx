'use client';

import type { ReactNode, Ref } from 'react';
import { LifeRiskRadar } from '@/components/dashboard/LifeRiskRadar';
import { WeatherShell } from '@/components/dashboard/shells/WeatherShell';
import { StormsAndNavigations } from '@/components/astrology/StormsAndNavigations';
import { WeeklyCalendar } from '@/components/astrology/WeeklyCalendar';
import QuestLog from '@/components/astrology/QuestLog';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';
import type { StormsReport } from '@/hooks/useStorms';
import type { WeeklyForecast } from '@/hooks/useWeeklyForecast';
import type { DailyForecast } from '@/hooks/useForecast';

export interface ForecastTabPanelProps {
  storySectionRef?: Ref<HTMLDivElement>;
  stormSectionRef?: Ref<HTMLDivElement>;
  weeklySectionRef?: Ref<HTMLDivElement>;
  risk?: LifeRiskPacket | null;
  riskLoading?: boolean;
  onAskAboutRisk: () => void;
  onBackToToday: () => void;
  onAskAboutHorizon: () => void;
  forecastRadarOpen: boolean;
  onForecastRadarOpenChange: (open: boolean) => void;
  stormsReport: StormsReport | null;
  stormsLoading?: boolean;
  mbtiType?: string;
  coreType?: string;
  maskType?: string;
  weeklyCharacter?: {
    title: string;
    strength: string;
    blindSpot: string;
  } | null;
  horizonSelectedDate: string;
  onHorizonSelectedDateChange: (date: string) => void;
  showWeeklyForecast?: boolean;
  weeklyForecast: WeeklyForecast | null;
  weeklyLoading?: boolean;
  weeklyError?: Error | null;
  questLogEnabled?: boolean;
  chartData?: unknown;
  transits?: unknown;
  forecast?: DailyForecast | null;
  userId?: string;
  children?: ReactNode;
}

/**
 * Forecast tab contract: risk radar first, then storm/weekly timeline, then optional depth.
 */
export function ForecastTabPanel({
  storySectionRef,
  stormSectionRef,
  weeklySectionRef,
  risk,
  riskLoading,
  onAskAboutRisk,
  onBackToToday,
  onAskAboutHorizon,
  forecastRadarOpen,
  onForecastRadarOpenChange,
  stormsReport,
  stormsLoading,
  mbtiType,
  coreType,
  maskType,
  weeklyCharacter,
  horizonSelectedDate,
  onHorizonSelectedDateChange,
  showWeeklyForecast = true,
  weeklyForecast,
  weeklyLoading,
  weeklyError,
  questLogEnabled,
  chartData,
  transits,
  forecast,
  userId,
  children,
}: ForecastTabPanelProps) {
  return (
    <WeatherShell className="space-y-5">
      <div ref={storySectionRef}>
        {weeklyCharacter?.title ? (
          <div className="mb-4 rounded-2xl border border-violet-400/25 bg-violet-950/30 px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-200/80">
              This week’s character
            </p>
            <p className="mt-1 text-lg font-semibold text-violet-50">{weeklyCharacter.title}</p>
            <p className="mt-1 text-sm text-slate-200">
              <span className="text-emerald-200/90">Strength:</span> {weeklyCharacter.strength}
            </p>
            <p className="mt-0.5 text-sm text-slate-300">
              <span className="text-amber-200/90">Blind spot:</span> {weeklyCharacter.blindSpot}
            </p>
          </div>
        ) : null}
        <LifeRiskRadar risk={risk} loading={riskLoading} onAskAboutRisk={onAskAboutRisk} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBackToToday}
          className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/20"
        >
          ← Back to Today
        </button>
        <button
          type="button"
          onClick={onAskAboutHorizon}
          className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
        >
          Ask Merlin about the horizon
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-950/30 via-slate-950/55 to-slate-950/60 shadow-lg shadow-rose-950/20 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onForecastRadarOpenChange(!forecastRadarOpen)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-900/50"
          aria-expanded={forecastRadarOpen}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-rose-300/70">Operational</p>
            <p className="text-sm font-semibold text-slate-200">Storm detail &amp; 7-day timeline</p>
            <p className="text-xs text-slate-500">Challenging windows, prep, day-by-day scan</p>
          </div>
          <span className="text-xs font-medium text-slate-400">{forecastRadarOpen ? 'Hide' : 'Show'}</span>
        </button>
        {forecastRadarOpen ? (
          <div className="space-y-5 border-t border-white/5 px-4 pb-5 pt-4">
            <div ref={stormSectionRef} className="rounded-xl border border-rose-400/25 bg-rose-950/20 p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-rose-200">Storm radar</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Hard-aspect pressure windows tied to your chart.
                  </p>
                </div>
              </div>
              <StormsAndNavigations
                report={stormsReport}
                loading={stormsLoading}
                mbtiType={mbtiType}
                coreType={coreType}
                maskType={maskType}
                selectedDate={horizonSelectedDate}
                onSelectedDateChange={onHorizonSelectedDateChange}
              />
            </div>

            {showWeeklyForecast ? (
              <div ref={weeklySectionRef} className="rounded-xl border border-amber-500/15 bg-slate-900/40 p-4">
                <h3 className="mb-3 text-sm font-semibold text-amber-200">7-day timeline</h3>
                <p className="mb-3 text-xs text-slate-500">
                  Linked to the storm date picker above — click a day in either place.
                </p>
                {weeklyError ? (
                  <p className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                    Weekly timeline unavailable: {weeklyError.message}
                  </p>
                ) : null}
                <WeeklyCalendar
                  week={weeklyForecast?.week || []}
                  loading={weeklyLoading}
                  selectedDate={horizonSelectedDate}
                  onSelectDate={onHorizonSelectedDateChange}
                />
                <div className="mt-4">
                  <QuestLog
                    enabled={Boolean(questLogEnabled)}
                    chartData={chartData}
                    transits={transits}
                    forecast={forecast}
                    mbtiType={mbtiType}
                    userId={userId}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {children}
    </WeatherShell>
  );
}
