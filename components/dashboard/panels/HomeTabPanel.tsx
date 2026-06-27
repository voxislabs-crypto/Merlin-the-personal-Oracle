'use client';

import type { Ref } from 'react';
import { motion } from 'framer-motion';
import { DailyOraclePulse } from '@/components/astrology/DailyOraclePulse';
import { AnnualBriefingCard } from '@/components/dashboard/AnnualBriefingCard';
import { CosmicStoryCard } from '@/components/dashboard/CosmicStoryCard';
import { ForecastDetailsSection } from '@/components/dashboard/ForecastDetailsSection';
import { LunarReturnWeatherCard } from '@/components/dashboard/LunarReturnWeatherCard';
import { RealityCheckJournal } from '@/components/dashboard/RealityCheckJournal';
import { PremiumUpgradeBanner } from '@/components/dashboard/PremiumUpgradeBanner';
import type { LunarReturnWeather, SolarReturnBriefing } from '@/lib/astrology/returns-types';

interface PredictiveSnapshot {
  lunarPhase?: string;
  lunarActionBias?: string;
  progressedMoonSign?: string;
  progressedMoonDegree?: number;
  topSignal?: string;
  actionHint?: {
    label: string;
    reason: string;
    className: string;
  };
}

interface HomeTabPanelProps {
  storyRef?: Ref<HTMLDivElement>;
  oracleRef?: Ref<HTMLDivElement>;
  detailsRef?: Ref<HTMLDivElement>;
  ritualRef?: Ref<HTMLDivElement>;
  intensity: number;
  feltIntensity?: number;
  sentimentScore?: number | null;
  dayRating?: string;
  date?: string;
  story: string;
  whyLine?: string;
  todayMove?: string;
  mbtiType?: string;
  mbtiGuidance?: string;
  moonPhase?: string;
  moonSign?: string;
  streak: number;
  forecastLoading: boolean;
  userId?: string;
  onAskMerlin: () => void;
  dailyOracleMessage?: string;
  dailyOracleRating?: string;
  dailyOracleLoading: boolean;
  onRefreshOracle: () => void;
  onOracleFeedback: (signal: 'hit' | 'missed') => void;
  homeForecastExpanded: boolean;
  onHomeForecastExpandedChange: (expanded: boolean) => void;
  forecast: {
    date?: string;
    planetaryHighlights?: string[];
    moonPhase?: string;
    moonSign?: string;
    sunSign?: string;
    transits?: unknown[];
    day_rating?: string;
    focusAreas?: unknown;
    timingWindows?: unknown;
    futureSignals?: unknown;
    conversationalPrompts?: unknown;
    advice?: string;
  } | null;
  onAskContext: (label: string, prompt: string) => void;
  askDraftLabel?: string;
  explainability?: unknown;
  domainScores?: unknown;
  insightLoading?: boolean;
  insightError?: string;
  predictiveSnapshot?: PredictiveSnapshot;
  showDailyRitual: boolean;
  calibrationRecomputing: boolean;
  onDailyRitualRefreshOracle: () => void;
  onDailyCheckin: () => void;
  onRecalibrate: () => void;
  showDevDiagnostics: boolean;
  onToggleDevDiagnostics: () => void;
  dashboardEvents: Array<{ eventName: string; at: string }>;
  atmosphereProvenance?: string[];
  confluenceAligned?: boolean;
  confluenceThemes?: string[];
  solarReturnBriefing?: SolarReturnBriefing | null;
  lunarReturnWeather?: LunarReturnWeather | null;
  returnsLoading?: boolean;
  showAnnualBriefing?: boolean;
  onAskSolarYear?: () => void;
  journalOptIn?: boolean;
  journalText?: string;
  onJournalOptInChange?: (enabled: boolean) => void;
  onJournalTextChange?: (text: string) => void;
  premiumLocked?: boolean;
  tier?: string;
}

export function HomeTabPanel({
  storyRef,
  oracleRef,
  detailsRef,
  ritualRef,
  intensity,
  feltIntensity,
  sentimentScore,
  dayRating,
  date,
  story,
  whyLine,
  todayMove,
  mbtiType,
  mbtiGuidance,
  moonPhase,
  moonSign,
  streak,
  forecastLoading,
  userId,
  onAskMerlin,
  dailyOracleMessage,
  dailyOracleRating,
  dailyOracleLoading,
  onRefreshOracle,
  onOracleFeedback,
  homeForecastExpanded,
  onHomeForecastExpandedChange,
  forecast,
  onAskContext,
  askDraftLabel,
  explainability,
  domainScores,
  insightLoading,
  insightError,
  predictiveSnapshot,
  showDailyRitual,
  calibrationRecomputing,
  onDailyRitualRefreshOracle,
  onDailyCheckin,
  onRecalibrate,
  showDevDiagnostics,
  onToggleDevDiagnostics,
  dashboardEvents,
  atmosphereProvenance,
  confluenceAligned,
  confluenceThemes,
  solarReturnBriefing,
  lunarReturnWeather,
  returnsLoading = false,
  showAnnualBriefing = false,
  onAskSolarYear,
  journalOptIn = false,
  journalText = '',
  onJournalOptInChange,
  onJournalTextChange,
  premiumLocked = false,
  tier,
}: HomeTabPanelProps) {
  return (
    <div className="space-y-6">
      {premiumLocked ? <PremiumUpgradeBanner tier={tier} /> : null}

      <div ref={storyRef}>
        <CosmicStoryCard
          intensity={intensity}
          feltIntensity={feltIntensity}
          sentimentScore={sentimentScore}
          dayRating={dayRating}
          date={date}
          story={story}
          whyLine={whyLine}
          todayMove={todayMove}
          mbtiType={mbtiType}
          mbtiGuidance={mbtiGuidance}
          moonPhase={moonPhase}
          moonSign={moonSign}
          streak={streak}
          loading={forecastLoading && !forecast}
          userId={userId}
          onAskMerlin={onAskMerlin}
          confluenceAligned={confluenceAligned}
          confluenceThemes={confluenceThemes}
        />
      </div>

      {showAnnualBriefing ? (
        <AnnualBriefingCard
          briefing={solarReturnBriefing}
          loading={returnsLoading}
          onAskMerlin={onAskSolarYear}
        />
      ) : null}

      <LunarReturnWeatherCard weather={lunarReturnWeather} loading={returnsLoading} />

      {onJournalOptInChange && onJournalTextChange ? (
        <RealityCheckJournal
          optIn={journalOptIn}
          text={journalText}
          onOptInChange={onJournalOptInChange}
          onTextChange={onJournalTextChange}
        />
      ) : null}

      <div ref={oracleRef} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-violet-200/70">Merlin adds</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefreshOracle}
              className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
            >
              Refresh oracle
            </button>
          </div>
        </div>
        <DailyOraclePulse
          message={dailyOracleMessage}
          dayRating={dailyOracleRating}
          loading={dailyOracleLoading}
          onTruthBomb={onRefreshOracle}
          onFeedback={onOracleFeedback}
        />
      </div>

      <motion.div
        ref={detailsRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <ForecastDetailsSection
          expanded={homeForecastExpanded}
          onExpandedChange={onHomeForecastExpandedChange}
          date={forecast?.date || new Date().toISOString()}
          summary={story}
          planetaryHighlights={forecast?.planetaryHighlights || []}
          moonPhase={forecast?.moonPhase || 'Unknown'}
          moonSign={forecast?.moonSign}
          sunSign={forecast?.sunSign}
          transits={forecast?.transits || []}
          day_rating={forecast?.day_rating}
          focusAreas={forecast?.focusAreas}
          timingWindows={forecast?.timingWindows}
          futureSignals={forecast?.futureSignals}
          conversationalPrompts={forecast?.conversationalPrompts}
          advice={forecast?.advice || ''}
          loading={forecastLoading}
          userId={userId}
          onAskContext={onAskContext}
          selectedContextLabel={askDraftLabel}
          explainability={explainability}
          domainScores={domainScores}
          insightLoading={insightLoading}
          insightError={insightError}
          predictiveSnapshot={predictiveSnapshot}
        />
      </motion.div>

      {showDailyRitual ? (
        <motion.div
          ref={ritualRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="rounded-xl border border-cyan-400/15 bg-gradient-to-r from-slate-950/80 via-cyan-950/20 to-slate-950/80 p-4 md:p-5"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Before you go</p>
              <h3 className="mt-1 text-lg font-semibold text-cyan-50">Come back tomorrow sharper.</h3>
              <p className="mt-1 text-sm text-slate-300/90">
                Day {streak} on your streak. A quick oracle refresh tonight makes tomorrow&apos;s read land cleaner.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onDailyRitualRefreshOracle}
                className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
              >
                Refresh oracle
              </button>
              <button
                type="button"
                onClick={onDailyCheckin}
                className="rounded-full border border-amber-300/35 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/20"
              >
                Daily check-in
              </button>
              <button
                type="button"
                onClick={onRecalibrate}
                disabled={calibrationRecomputing}
                className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
              >
                {calibrationRecomputing ? 'Recalibrating...' : 'Recalibrate'}
              </button>
            </div>
          </div>

          {process.env.NODE_ENV !== 'production' ? (
            <div className="mt-4 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={onToggleDevDiagnostics}
                className="text-xs text-slate-300 underline-offset-2 hover:text-white hover:underline"
              >
                {showDevDiagnostics ? 'Hide' : 'Show'} dashboard event diagnostics
              </button>
              {showDevDiagnostics ? (
                <div className="mt-2 max-h-44 overflow-y-auto space-y-1 rounded-lg border border-white/10 bg-slate-950/55 p-2">
                  {dashboardEvents.length ? (
                    dashboardEvents
                      .slice(-10)
                      .reverse()
                      .map((event, idx) => (
                        <div key={`${event.at}-${idx}`} className="text-[11px] text-slate-200/85">
                          <span className="text-cyan-200">{event.eventName}</span>
                          <span className="text-slate-400"> • {new Date(event.at).toLocaleString()}</span>
                        </div>
                      ))
                  ) : (
                    <p className="text-[11px] text-slate-400">No events yet.</p>
                  )}
                  {atmosphereProvenance?.length ? (
                    <div className="mt-2 rounded border border-cyan-400/20 bg-cyan-500/5 p-2">
                      <p className="text-[10px] uppercase tracking-wider text-cyan-200/80">Atmosphere provenance</p>
                      <p className="mt-1 text-[11px] text-slate-300">{atmosphereProvenance.join(' · ')}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  );
}