'use client';

import type { Ref } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { DailyOraclePulse } from '@/components/astrology/DailyOraclePulse';
import { AnnualBriefingCard } from '@/components/dashboard/AnnualBriefingCard';
import { TodayWeatherBrief } from '@/components/dashboard/TodayWeatherBrief';
import { ForecastDetailsSection } from '@/components/dashboard/ForecastDetailsSection';
import { LunarReturnWeatherCard } from '@/components/dashboard/LunarReturnWeatherCard';
import { RealityCheckJournal } from '@/components/dashboard/RealityCheckJournal';
import { PremiumUpgradeBanner } from '@/components/dashboard/PremiumUpgradeBanner';
import type { LunarReturnWeather, SolarReturnBriefing } from '@/lib/astrology/returns-types';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';

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
  whyToday?: string;
  usuallyBrings?: string;
  navigate?: string;
  watchFor?: string;
  supportingSignals?: Array<{ id: string; label: string; hint: string; polarity?: string }>;
  chartConfidence?: number;
  readConfidence?: number;
  chartConfidenceLabel?: 'High' | 'Steady' | 'Tentative';
  readConfidenceLabel?: 'High' | 'Steady' | 'Tentative';
  moveConfidence?: number;
  confidenceLabel?: 'High' | 'Steady' | 'Tentative';
  mixedSignals?: boolean;
  themeLabel?: string;
  heldFromYesterday?: boolean;
  weatherPrinciple?: string;
  /** Dominant transit/driver label for Why pills */
  driverLabel?: string | null;
  mbtiType?: string;
  mbtiGuidance?: string;
  moonPhase?: string;
  moonSign?: string;
  streak: number;
  forecastLoading: boolean;
  userId?: string;
  onAskMerlin: () => void;
  /** Jump to Self · You */
  onExploreSelf?: () => void;
  askLabel?: string;
  storyEyebrow?: string;
  selfChips?: string[];
  dailyOracleMessage?: string;
  dailyOracleRating?: string;
  dailyOracleDate?: string;
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
  forecastError?: boolean;
  onRetryForecast?: () => void;
  risk?: LifeRiskPacket | null;
  /** Clerk first name for Today greeting */
  firstName?: string | null;
}

/**
 * Weather · Today shell: one clear brief first, depth on demand.
 */
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
  whyToday,
  usuallyBrings,
  navigate,
  watchFor,
  supportingSignals,
  chartConfidence,
  readConfidence,
  chartConfidenceLabel,
  readConfidenceLabel,
  moveConfidence,
  confidenceLabel,
  mixedSignals,
  themeLabel,
  heldFromYesterday,
  weatherPrinciple,
  driverLabel = null,
  mbtiType,
  moonPhase,
  moonSign,
  streak,
  forecastLoading,
  userId,
  onAskMerlin,
  onExploreSelf,
  askLabel,
  storyEyebrow,
  selfChips = [],
  dailyOracleMessage,
  dailyOracleRating,
  dailyOracleDate,
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
  forecastError = false,
  onRetryForecast,
  risk = null,
  firstName = null,
}: HomeTabPanelProps) {
  const [depthOpen, setDepthOpen] = useState(false);
  const chips =
    selfChips.length > 0
      ? selfChips
      : [mbtiType, moonSign ? `Moon ${moonSign}` : null].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      {premiumLocked ? <PremiumUpgradeBanner tier={tier} /> : null}

      {/* P1: single clear Today card */}
      <div ref={storyRef}>
        <TodayWeatherBrief
          intensity={intensity}
          feltIntensity={feltIntensity}
          sentimentScore={sentimentScore}
          dayRating={dayRating}
          date={date}
          story={story}
          whyLine={whyLine}
          todayMove={todayMove}
          whyToday={whyToday}
          usuallyBrings={usuallyBrings}
          navigate={navigate}
          watchFor={watchFor}
          supportingSignals={supportingSignals}
          chartConfidence={chartConfidence}
          readConfidence={readConfidence}
          chartConfidenceLabel={chartConfidenceLabel}
          readConfidenceLabel={readConfidenceLabel}
          moveConfidence={moveConfidence}
          confidenceLabel={confidenceLabel}
          mixedSignals={mixedSignals}
          themeLabel={themeLabel}
          heldFromYesterday={heldFromYesterday}
          weatherPrinciple={weatherPrinciple}
          driverLabel={driverLabel}
          moonPhase={moonPhase}
          moonSign={moonSign}
          streak={streak}
          // Parent passes todayWeatherStillLoading — do not gate on story
          // (loading brief always sets story, which hid the skeleton and
          // flashed a false Caution tone from partial/legacy intensity).
          loading={Boolean(forecastLoading)}
          userId={userId}
          onAskMerlin={onAskMerlin}
          onExploreSelf={onExploreSelf}
          askLabel={askLabel}
          eyebrow={storyEyebrow}
          selfChips={chips}
          confluenceAligned={confluenceAligned}
          confluenceThemes={confluenceThemes}
          isError={forecastError}
          onRetry={onRetryForecast}
          risk={risk}
          firstName={firstName}
        />
      </div>

      {/* Talk-through + depth — Oracle is the primary pull; rest expands */}
      <div className="overflow-hidden rounded-2xl border border-violet-500/25 bg-slate-950/55 shadow-lg shadow-violet-950/20 backdrop-blur-md">
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setDepthOpen((o) => !o)}
            className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left transition-colors"
            aria-expanded={depthOpen}
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.24em] text-violet-300/80">
                Talk it through
              </p>
              <p className="text-sm font-semibold text-slate-100">
                Oracle · lunar weather · journal
              </p>
              <p className="text-xs text-slate-500">
                Ask Merlin about today, or open more context
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${depthOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {onAskMerlin ? (
            <button
              type="button"
              onClick={onAskMerlin}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-violet-300/45 bg-violet-500/25 px-4 py-2 text-sm font-semibold text-violet-50 shadow-[0_0_18px_rgba(167,139,250,0.18)] transition-all hover:bg-violet-500/35"
            >
              <MessageCircle className="h-4 w-4" />
              Ask Oracle
            </button>
          ) : null}
        </div>

        {depthOpen ? (
          <div className="space-y-5 border-t border-white/5 px-4 pb-5 pt-4">
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
                <button
                  type="button"
                  onClick={onRefreshOracle}
                  className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                >
                  Refresh oracle
                </button>
              </div>
              <DailyOraclePulse
                message={dailyOracleMessage}
                dayRating={dailyOracleRating}
                date={dailyOracleDate}
                loading={dailyOracleLoading}
                onTruthBomb={onRefreshOracle}
                onFeedback={onOracleFeedback}
              />
            </div>

            <motion.div
              ref={detailsRef}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
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
          </div>
        ) : null}
      </div>

      {showDailyRitual ? (
        <motion.div
          ref={ritualRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-cyan-400/15 bg-gradient-to-r from-slate-950/80 via-cyan-950/20 to-slate-950/80 p-4 md:p-5"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Before you go</p>
              <h3 className="mt-1 text-lg font-semibold text-cyan-50">Come back tomorrow sharper.</h3>
              <p className="mt-1 text-sm text-slate-300/90">
                Day {streak} on your streak. A quick check-in makes tomorrow&apos;s life weather land cleaner.
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
                      <p className="text-[10px] uppercase tracking-wider text-cyan-200/80">
                        Atmosphere provenance
                      </p>
                      <p className="mt-1 text-[11px] text-slate-300">
                        {atmosphereProvenance.join(' · ')}
                      </p>
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
