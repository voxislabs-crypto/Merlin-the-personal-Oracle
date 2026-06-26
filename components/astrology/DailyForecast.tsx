'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Zap, Lightbulb, Sparkles, Heart, Briefcase, MessageSquare, Waves } from 'lucide-react';
import ThumbsFeedback from './ThumbsFeedback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DomainScore, ExplainabilityPacket } from '@/types/astrology';
import type { DayRating } from '@/lib/dashboard/cosmic-rating';

// eslint-disable-next-line no-unused-vars
type AskContextFn = (s1: string, s2: string) => void;

interface DailyForecastProps {
  date: string;
  summary: string;
  planetaryHighlights: string[];
  moonPhase: string;
  moonSign?: string;
  sunSign?: string;
  transits?: string[];
  advice: string;
  day_rating?: DayRating;
  focusAreas?: {
    love: string;
    career: string;
    mind: string;
    mood: string;
  };
  timingWindows?: {
    next24Hours: string;
    next72Hours: string;
    weekAhead: string;
  };
  futureSignals?: Array<{
    domain: 'Love' | 'Career' | 'Mind' | 'Mood';
    signal: string;
    probability: number;
    timeframe: '24h' | '72h' | '7d';
    action: string;
    intensity: 'low' | 'medium' | 'high';
  }>;
  conversationalPrompts?: string[];
  loading?: boolean;
  userId?: string;
  onAskContext?: AskContextFn;
  selectedContextLabel?: string;
  explainability?: ExplainabilityPacket;
  domainScores?: DomainScore[];
  insightLoading?: boolean;
  insightError?: string;
  hideHeader?: boolean;
  hideStory?: boolean;
  variant?: 'full' | 'grouped';
  predictiveSnapshot?: {
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
  };
}

export function DailyForecast({
  date,
  summary,
  planetaryHighlights,
  moonPhase,
  moonSign,
  sunSign,
  transits = [],
  advice,
  day_rating = 'Neutral',
  focusAreas,
  timingWindows,
  futureSignals = [],
  conversationalPrompts = [],
  loading = false,
  userId,
  onAskContext,
  selectedContextLabel,
  explainability,
  domainScores,
  insightLoading = false,
  insightError,
  hideHeader = false,
  hideStory = false,
  variant = 'full',
  predictiveSnapshot,
}: DailyForecastProps) {
  const [showAllTransits, setShowAllTransits] = useState(false);

  if (loading) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-lg border border-amber-500/20 z-10 relative">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  function formatForecastDate(value: string): string {
    const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (ymdMatch) {
      const year = Number(ymdMatch[1]);
      const month = Number(ymdMatch[2]);
      const day = Number(ymdMatch[3]);
      // Use local noon to avoid timezone edge cases around midnight.
      const localDate = new Date(year, month - 1, day, 12, 0, 0);
      return localDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const rankedDomains = [...(domainScores?.length ? domainScores : explainability?.domainScores || [])]
    .sort((a, b) => b.pressure - a.pressure)
    .slice(0, 3);
  const showSafety =
    (explainability?.globalPressure || 0) >= 75 ||
    Boolean(explainability?.safety?.grounding?.length) ||
    Boolean(explainability?.safety?.caution?.length) ||
    Boolean(explainability?.safety?.agency?.length);
  const makeInteractiveClasses = (label: string) =>
    onAskContext
      ? `${selectedContextLabel === label ? 'ring-1 ring-cyan-300/40 bg-cyan-500/10' : ''} cursor-pointer transition hover:border-cyan-300/40 hover:bg-cyan-500/5`
      : '';

  const hasOverviewContent =
    Boolean(predictiveSnapshot) ||
    insightLoading ||
    Boolean(explainability) ||
    rankedDomains.length > 0 ||
    showSafety ||
    Boolean(insightError);
  const hasLifeContent = Boolean(focusAreas);
  const hasAheadContent = Boolean(timingWindows) || futureSignals.length > 0;
  const hasSkyContent = planetaryHighlights.length > 0 || transits.length > 0;

  if (variant === 'grouped') {
    const visibleTransits = showAllTransits ? transits : transits.slice(0, 3);

    return (
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-xl border border-purple-400/20 bg-slate-950/70 p-1">
          <TabsTrigger
            value="overview"
            className="rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-wide data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-100"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="life"
            disabled={!hasLifeContent}
            className="rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-wide data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-100 disabled:opacity-40"
          >
            Life
          </TabsTrigger>
          <TabsTrigger
            value="ahead"
            disabled={!hasAheadContent}
            className="rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-wide data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100 disabled:opacity-40"
          >
            Ahead
          </TabsTrigger>
          <TabsTrigger
            value="sky"
            disabled={!hasSkyContent}
            className="rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-wide data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-100 disabled:opacity-40"
          >
            Sky
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-3">
          {predictiveSnapshot ? (
            <div className="rounded-xl border border-violet-400/20 bg-violet-950/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200/80">
                  Predictive snapshot
                </p>
                {predictiveSnapshot.actionHint ? (
                  <span className={`rounded border px-2 py-0.5 text-[11px] ${predictiveSnapshot.actionHint.className}`}>
                    {predictiveSnapshot.actionHint.label.toUpperCase()} · {predictiveSnapshot.actionHint.reason}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {predictiveSnapshot.lunarPhase ? (
                  <SnapshotChip label="Lunar timing" value={`${predictiveSnapshot.lunarPhase}${predictiveSnapshot.lunarActionBias ? ` · ${predictiveSnapshot.lunarActionBias.toUpperCase()}` : ''}`} />
                ) : null}
                {predictiveSnapshot.progressedMoonSign ? (
                  <SnapshotChip
                    label="Progressed Moon"
                    value={`${predictiveSnapshot.progressedMoonSign} ${predictiveSnapshot.progressedMoonDegree?.toFixed(1) ?? ''}°`}
                  />
                ) : null}
                {predictiveSnapshot.topSignal ? (
                  <SnapshotChip label="Top signal" value={predictiveSnapshot.topSignal} />
                ) : null}
              </div>
            </div>
          ) : null}

          {hasOverviewContent ? (
            <div className="rounded-xl border border-cyan-400/20 bg-slate-950/50 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-cyan-200">Why this forecast</h4>
              {insightLoading && !explainability ? (
                <p className="text-xs text-slate-400">Calculating pressure drivers...</p>
              ) : null}
              {explainability ? (
                <>
                  <p className="text-sm text-slate-200">
                    Pressure {explainability.globalPressure}/100 · Confidence {explainability.confidence}/100
                  </p>
                  {explainability.topDrivers?.length ? (
                    <div className="divide-y divide-cyan-400/10 rounded-lg border border-cyan-400/15">
                      {explainability.topDrivers.slice(0, 3).map((driver) => (
                        <div key={driver.transitId} className="px-3 py-2.5">
                          <p className="text-sm font-medium text-cyan-100">{driver.label}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{driver.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
              {rankedDomains.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {rankedDomains.map((domain) => (
                    <span
                      key={domain.domain}
                      className="rounded-full border border-slate-600/50 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300"
                    >
                      {formatDomainLabel(domain.domain)} · {domain.pressure}/100
                    </span>
                  ))}
                </div>
              ) : null}
              {showSafety ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                  <p className="text-xs font-semibold text-amber-200">Grounding</p>
                  {explainability?.safety?.grounding?.length ? (
                    <p className="mt-1 text-xs text-amber-100/90">{explainability.safety.grounding.slice(0, 2).join(' ')}</p>
                  ) : null}
                </div>
              ) : null}
              {insightError ? <p className="text-xs text-rose-300">{insightError}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-slate-400 px-1">No extra rationale yet — check back after transits finish loading.</p>
          )}

          {conversationalPrompts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {conversationalPrompts.slice(0, 3).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={onAskContext ? () => onAskContext(prompt, prompt) : undefined}
                  className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-100 hover:bg-fuchsia-500/20"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="life" className="mt-0">
          {focusAreas ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FocusCard
                icon={<Heart className="w-4 h-4 text-pink-400" />}
                label="Love & Relationships"
                color="pink"
                text={focusAreas.love}
                onAskContext={onAskContext}
                selected={selectedContextLabel === 'Love & Relationships'}
                compact
              />
              <FocusCard
                icon={<Briefcase className="w-4 h-4 text-blue-400" />}
                label="Career & Ambition"
                color="blue"
                text={focusAreas.career}
                onAskContext={onAskContext}
                selected={selectedContextLabel === 'Career & Ambition'}
                compact
              />
              <FocusCard
                icon={<MessageSquare className="w-4 h-4 text-purple-400" />}
                label="Mind & Communication"
                color="purple"
                text={focusAreas.mind}
                onAskContext={onAskContext}
                selected={selectedContextLabel === 'Mind & Communication'}
                compact
              />
              <FocusCard
                icon={<Waves className="w-4 h-4 text-teal-400" />}
                label="Emotional Weather"
                color="teal"
                text={focusAreas.mood}
                onAskContext={onAskContext}
                selected={selectedContextLabel === 'Emotional Weather'}
                compact
              />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="ahead" className="mt-0 space-y-3">
          {timingWindows ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <SnapshotChip label="Next 24h" value={timingWindows.next24Hours} tall />
              <SnapshotChip label="Next 72h" value={timingWindows.next72Hours} tall />
              <SnapshotChip label="Week ahead" value={timingWindows.weekAhead} tall />
            </div>
          ) : null}
          {futureSignals.length > 0 ? (
            <div className="divide-y divide-indigo-400/15 rounded-xl border border-indigo-400/20">
              {futureSignals.slice(0, 3).map((signal, idx) => (
                <div
                  key={`${signal.domain}-${idx}`}
                  className={`px-3 py-3 ${makeInteractiveClasses(`${signal.domain} signal`)}`}
                  onClick={onAskContext ? () => onAskContext(`${signal.domain} signal`, `What does this ${signal.domain.toLowerCase()} signal suggest I should prepare for over the next ${signal.timeframe}?`) : undefined}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-indigo-200/80">
                    <span className="font-semibold text-indigo-100">{signal.domain}</span>
                    <span>{signal.probability}% · {signal.timeframe}</span>
                  </div>
                  <p className="mt-1 text-sm text-white/90">{signal.signal}</p>
                  <p className="mt-1 text-xs text-indigo-100/80">Move: {signal.action}</p>
                </div>
              ))}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="sky" className="mt-0 space-y-3">
          {planetaryHighlights.length > 0 ? (
            <div className="rounded-xl border border-amber-400/20 bg-slate-950/40">
              <div className="border-b border-amber-400/15 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Key energies</p>
              </div>
              <div className="divide-y divide-amber-400/10">
                {planetaryHighlights.slice(0, 4).map((highlight, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 px-3 py-2.5 text-sm text-slate-100 ${makeInteractiveClasses(highlight)}`}
                    onClick={onAskContext ? () => onAskContext(highlight, `How should I work with this energy today: ${highlight}?`) : undefined}
                  >
                    <span className="text-amber-400 shrink-0">✦</span>
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {transits.length > 0 ? (
            <div className="rounded-xl border border-purple-400/20 bg-slate-950/40">
              <div className="flex items-center justify-between border-b border-purple-400/15 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-200/80">
                  Active transits
                </p>
                {transits.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllTransits((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-200/80 hover:text-purple-100"
                  >
                    {showAllTransits ? 'Show fewer' : `+${transits.length - 3} more`}
                    <ChevronDown className={`h-3 w-3 transition-transform ${showAllTransits ? 'rotate-180' : ''}`} />
                  </button>
                ) : null}
              </div>
              <div className="divide-y divide-purple-400/10">
                {visibleTransits.map((transit, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-2.5 text-sm text-purple-100/90 ${makeInteractiveClasses(transit)}`}
                    onClick={onAskContext ? () => onAskContext(transit, `What does this transit mean for me in practical terms today: ${transit}?`) : undefined}
                  >
                    {transit}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <ThumbsFeedback itemId={`forecast-highlights-${date}`} label="sky reading" userId={userId} theme="forecast" />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <motion.div
      className="space-y-5 z-10 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header: Date + Moon + Sun ─────────────────────────────────────── */}
      {!hideHeader ? (
      <motion.div
        className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg border border-amber-500/30 backdrop-blur-sm relative overflow-hidden"
        variants={itemVariants}
      >
        {/* Active Transit Indicator - Pulsing glow */}
        <motion.div
          className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-amber-300">Today's Cosmic Forecast</h3>
              {/* LIVE Badge */}
              <motion.div
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50"
                animate={{
                  boxShadow: [
                    '0 0 0px rgba(168, 85, 247, 0)',
                    '0 0 20px rgba(168, 85, 247, 0.8)',
                    '0 0 0px rgba(168, 85, 247, 0)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.span
                  className="w-2 h-2 rounded-full bg-purple-400"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                  Active Transit
                </span>
              </motion.div>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              {formatForecastDate(date)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl">{getMoonEmoji(moonPhase)}</span>
            <p className="text-amber-200 text-sm mt-1 font-semibold">{moonPhase}</p>
          </div>
        </div>

        {/* Sun + Moon signs row */}
        {(sunSign || moonSign) && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-amber-500/20">
            {sunSign && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-yellow-400 text-base">☀️</span>
                <span className="text-slate-300">Sun in <span className="text-amber-300 font-semibold">{sunSign}</span></span>
              </div>
            )}
            {moonSign && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-blue-300 text-base">🌙</span>
                <span className="text-slate-300">Moon in <span className="text-blue-300 font-semibold">{moonSign}</span></span>
              </div>
            )}
          </div>
        )}

        {/* Day Rating bar */}
        <div className="mt-4 pt-4 border-t border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-widest">Energy Rating</span>
            <span className={`text-sm font-bold ${getDayRatingColor(day_rating)}`}>
              {getDayRatingIcon(day_rating)}&nbsp;{day_rating}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getDayRatingBarColor(day_rating)}`}
              initial={{ width: 0 }}
              animate={{ width: getDayRatingBarWidth(day_rating) }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>
      ) : null}

      {/* ── Main Horoscope Summary ────────────────────────────────────────── */}
      {!hideStory ? (
      <motion.div
        className={`p-6 bg-slate-900/60 rounded-lg border border-amber-500/20 backdrop-blur-sm ${makeInteractiveClasses('Daily cosmic story')}`}
        variants={itemVariants}
        onClick={onAskContext ? () => onAskContext('Daily cosmic story', 'What is the core message in today\'s cosmic story, and how should I apply it?') : undefined}
      >
        <h4 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          The Cosmic Story
        </h4>
        <p className="text-white text-base leading-relaxed">
          {summary || 'A day of quiet potential. Use it to build what matters.'}
        </p>
        <div className="mt-3">
          <ThumbsFeedback itemId={`forecast-summary-${date}`} label="daily reading" userId={userId} theme="forecast" />
        </div>
      </motion.div>
      ) : null}

      {(insightLoading || explainability || rankedDomains.length > 0 || insightError) && (
        <motion.div
          className="p-6 bg-slate-900/60 rounded-lg border border-cyan-500/25"
          variants={itemVariants}
        >
          <h4 className="text-lg font-bold text-cyan-300 mb-3">Why This Forecast</h4>
          {insightLoading && !explainability ? (
            <p className="text-xs text-slate-300">Calculating forecast confidence and pressure drivers...</p>
          ) : null}

          {explainability ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-200">
                Forecast pressure is {explainability.globalPressure}/100 with confidence {explainability.confidence}/100.
              </p>
              <p className="text-xs text-slate-300">
                Confidence is probabilistic, not deterministic. Treat this as guidance that can evolve with context.
              </p>
              {explainability.topDrivers?.length ? (
                <div className="space-y-2">
                  {explainability.topDrivers.slice(0, 3).map((driver) => (
                    <div key={driver.transitId} className="rounded border border-cyan-400/20 bg-slate-950/50 px-3 py-2">
                      <p className="text-sm text-cyan-100 font-medium">{driver.label}</p>
                      <p className="text-xs text-slate-300 mt-1">
                        Strength {driver.strength}/100 · Confidence {driver.confidence}/100
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{driver.reason}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {rankedDomains.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {rankedDomains.map((domain) => (
                <div key={domain.domain} className="rounded border border-slate-600/40 bg-slate-950/45 px-3 py-2">
                  <p className="text-xs text-slate-200">{formatDomainLabel(domain.domain)}</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Pressure {domain.pressure}/100 · Confidence {domain.confidence}/100
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {showSafety ? (
            <div className="mt-3 rounded border border-amber-500/35 bg-amber-500/10 px-3 py-2">
              <p className="text-xs text-amber-200 font-semibold">Grounding Prompt</p>
              {explainability?.safety?.grounding?.length ? (
                <p className="text-xs text-amber-100/90 mt-1">{explainability.safety.grounding.slice(0, 2).join(' ')}</p>
              ) : null}
              {explainability?.safety?.agency?.length ? (
                <p className="text-xs text-amber-100/90 mt-1">{explainability.safety.agency.slice(0, 2).join(' ')}</p>
              ) : null}
            </div>
          ) : null}

          {insightError ? <p className="text-xs text-rose-300 mt-3">{insightError}</p> : null}
        </motion.div>
      )}

      {/* ── Focus Areas (Love / Career / Mind / Mood) ─────────────────────── */}
      {focusAreas && (
        <motion.div variants={itemVariants}>
          <h4 className="text-sm uppercase tracking-widest text-slate-400 mb-3 px-1">Life Area Forecast</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FocusCard
              icon={<Heart className="w-4 h-4 text-pink-400" />}
              label="Love & Relationships"
              color="pink"
              text={focusAreas.love}
              onAskContext={onAskContext}
              selected={selectedContextLabel === 'Love & Relationships'}
            />
            <FocusCard
              icon={<Briefcase className="w-4 h-4 text-blue-400" />}
              label="Career & Ambition"
              color="blue"
              text={focusAreas.career}
              onAskContext={onAskContext}
              selected={selectedContextLabel === 'Career & Ambition'}
            />
            <FocusCard
              icon={<MessageSquare className="w-4 h-4 text-purple-400" />}
              label="Mind & Communication"
              color="purple"
              text={focusAreas.mind}
              onAskContext={onAskContext}
              selected={selectedContextLabel === 'Mind & Communication'}
            />
            <FocusCard
              icon={<Waves className="w-4 h-4 text-teal-400" />}
              label="Emotional Weather"
              color="teal"
              text={focusAreas.mood}
              onAskContext={onAskContext}
              selected={selectedContextLabel === 'Emotional Weather'}
            />
          </div>
        </motion.div>
      )}

      {/* ── Future Timeline ───────────────────────────────────────────────── */}
      {timingWindows && (
        <motion.div
          className="p-6 bg-slate-900/60 rounded-lg border border-cyan-500/25"
          variants={itemVariants}
        >
          <h4 className="text-lg font-bold text-cyan-300 mb-3">Future Weather Timeline</h4>
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-300/80 mb-1">Next 24 Hours</p>
              <p className="text-sm text-white/95">{timingWindows.next24Hours}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-300/80 mb-1">Next 72 Hours</p>
              <p className="text-sm text-white/95">{timingWindows.next72Hours}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-300/80 mb-1">Week Ahead</p>
              <p className="text-sm text-white/95">{timingWindows.weekAhead}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Probability Signals ────────────────────────────────────────────── */}
      {futureSignals.length > 0 && (
        <motion.div
          className="p-6 bg-gradient-to-br from-indigo-900/30 to-slate-900/60 rounded-lg border border-indigo-400/30"
          variants={itemVariants}
        >
          <h4 className="text-lg font-bold text-indigo-300 mb-3">What Merlin Sees Next</h4>
          <div className="space-y-3">
            {futureSignals.slice(0, 4).map((signal, idx) => (
              <div
                key={`${signal.domain}-${idx}`}
                className={`p-3 rounded border border-indigo-400/20 bg-indigo-500/10 ${makeInteractiveClasses(`${signal.domain} signal`)}`}
                onClick={onAskContext ? () => onAskContext(`${signal.domain} signal`, `What does this ${signal.domain.toLowerCase()} signal suggest I should prepare for over the next ${signal.timeframe}?`) : undefined}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-indigo-200">{signal.domain}</p>
                  <p className="text-xs text-indigo-200/80">{signal.probability}% • {signal.timeframe}</p>
                </div>
                <div className="h-1.5 rounded-full bg-indigo-950/70 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${getConfidenceMeterColor(signal.probability)}`}
                    style={{ width: `${signal.probability}%` }}
                  />
                </div>
                <p className="text-sm text-white/95">{signal.signal}</p>
                <p className="text-xs text-indigo-100/85 mt-1">Move: {signal.action}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Active Transits ───────────────────────────────────────────────── */}
      {transits && transits.length > 0 && (
        <motion.div
          className="p-6 bg-gradient-to-br from-purple-900/30 to-slate-900/60 rounded-lg border border-purple-400/30"
          variants={itemVariants}
        >
          <h4 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Active Planetary Transits
          </h4>
          <div className="space-y-2">
            {transits.slice(0, 5).map((transit, idx) => (
              <motion.div
                key={idx}
                className={`flex items-start gap-3 p-3 bg-purple-500/10 rounded border border-purple-400/20 ${makeInteractiveClasses(transit)}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={onAskContext ? () => onAskContext(transit, `What does this transit mean for me in practical terms today: ${transit}?`) : undefined}
              >
                <span className="text-purple-400 mt-0.5 font-bold">→</span>
                <span className="text-purple-100 text-sm">{transit}</span>
              </motion.div>
            ))}
            {transits.length > 5 && (
              <p className="text-xs text-purple-300/60 mt-2">+ {transits.length - 5} more transits active</p>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Planetary Highlights ──────────────────────────────────────────── */}
      {planetaryHighlights.length > 0 && (
        <motion.div
          className="p-6 bg-slate-900/60 rounded-lg border border-amber-500/20"
          variants={itemVariants}
        >
          <h4 className="text-lg font-bold text-amber-300 mb-3">Key Planetary Energies</h4>
          <div className="space-y-2">
            {planetaryHighlights.map((highlight, idx) => (
              <motion.div
                key={idx}
                className={`flex items-start gap-3 rounded-md px-2 py-1 -mx-2 ${makeInteractiveClasses(highlight)}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={onAskContext ? () => onAskContext(highlight, `How should I work with this energy today: ${highlight}?`) : undefined}
              >
                <span className="text-amber-400 mt-1 shrink-0">✦</span>
                <span className="text-white text-sm">{highlight}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-3">
            <ThumbsFeedback itemId={`forecast-highlights-${date}`} label="planetary energies" userId={userId} theme="forecast" />
          </div>
        </motion.div>
      )}

      {/* ── How to Ride It ────────────────────────────────────────────────── */}
      <motion.div
        className="p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/20 rounded-lg border border-green-500/40"
        variants={itemVariants}
      >
        <h4 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          How to Ride It
        </h4>
        <p className="text-white text-base leading-relaxed italic">{generateActionableTip(day_rating)}</p>
      </motion.div>

      {/* ── Merlin's Word ─────────────────────────────────────────────────── */}
      <motion.div
        className={`p-6 bg-gradient-to-r from-amber-900/20 to-amber-900/10 rounded-lg border border-amber-500/40 ${makeInteractiveClasses('Merlin\'s word')}`}
        variants={itemVariants}
        onClick={onAskContext ? () => onAskContext('Merlin\'s word', 'Break down Merlin\'s word for today into one concrete move I should make.') : undefined}
      >
        <h4 className="text-lg font-bold text-amber-200 mb-3">✨ Merlin's Word</h4>
        <p className="text-white leading-relaxed">{advice || 'The cosmos trusts your instincts today.'}</p>
      </motion.div>

      {/* ── Ask Merlin Next ────────────────────────────────────────────────── */}
      {conversationalPrompts.length > 0 && (
        <motion.div
          className="p-6 bg-slate-900/60 rounded-lg border border-fuchsia-500/30"
          variants={itemVariants}
        >
          <h4 className="text-lg font-bold text-fuchsia-300 mb-3">Ask Merlin Next</h4>
          <div className="space-y-2">
            {conversationalPrompts.slice(0, 3).map((prompt, idx) => (
              <p
                key={idx}
                className={`text-sm text-fuchsia-100/90 rounded-md px-2 py-1 -mx-2 ${makeInteractiveClasses(prompt)}`}
                onClick={onAskContext ? () => onAskContext(prompt, prompt) : undefined}
              >
                • {prompt}
              </p>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Focus area card ──────────────────────────────────────────────────────────
function SnapshotChip({ label, value, tall = false }: { label: string; value: string; tall?: boolean }) {
  return (
    <div className={`rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2.5 ${tall ? 'min-h-[88px]' : ''}`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-100 leading-snug">{value}</p>
    </div>
  );
}

function FocusCard({
  icon, label, color, text, onAskContext, selected, compact = false
}: { icon: React.ReactNode; label: string; color: string; text: string; onAskContext?: AskContextFn; selected?: boolean; compact?: boolean }) {
  const borderMap: Record<string, string> = {
    pink:   'border-pink-500/30 bg-pink-900/15',
    blue:   'border-blue-500/30 bg-blue-900/15',
    purple: 'border-purple-500/30 bg-purple-900/15',
    teal:   'border-teal-500/30 bg-teal-900/15',
  };
  const labelMap: Record<string, string> = {
    pink: 'text-pink-300', blue: 'text-blue-300', purple: 'text-purple-300', teal: 'text-teal-300',
  };
  return (
    <div
      className={`${compact ? 'p-3' : 'p-4'} rounded-lg border ${borderMap[color] || 'border-slate-500/30 bg-slate-900/30'} ${onAskContext ? 'cursor-pointer transition hover:border-cyan-300/40 hover:bg-cyan-500/5' : ''} ${selected ? 'ring-1 ring-cyan-300/40 bg-cyan-500/10' : ''}`}
      onClick={onAskContext ? () => onAskContext(label, `What does today's ${label.toLowerCase()} forecast mean for me, and what should I do with it?`) : undefined}
    >
      <div className={`flex items-center gap-2 ${compact ? 'mb-1.5' : 'mb-2'}`}>
        {icon}
        <span className={`text-xs font-bold uppercase tracking-wider ${labelMap[color] || 'text-slate-300'}`}>
          {label}
        </span>
      </div>
      <p className={`text-white ${compact ? 'text-sm leading-snug' : 'text-sm leading-relaxed'}`}>{text}</p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMoonEmoji(phase: string): string {
  const phaseMap: Record<string, string> = {
    'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
    'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
    'Last Quarter': '🌗', 'Waning Crescent': '🌘'
  };
  return phaseMap[phase] || '🌙';
}

function getDayRatingIcon(rating: string): string {
  const icons: Record<string, string> = {
    'Very Positive': '✨✨', 'Positive': '✨', 'Neutral': '🔄',
    'Challenging': '⚡', 'Very Challenging': '⚡⚡',
  };
  return icons[rating] || '🔮';
}

function getDayRatingColor(rating: string): string {
  const colors: Record<string, string> = {
    'Very Positive': 'text-green-300', 'Positive': 'text-emerald-300',
    'Neutral': 'text-slate-300', 'Challenging': 'text-orange-300', 'Very Challenging': 'text-red-300',
  };
  return colors[rating] || 'text-slate-300';
}

function getDayRatingBarColor(rating: string): string {
  const colors: Record<string, string> = {
    'Very Positive': 'bg-green-400', 'Positive': 'bg-emerald-400',
    'Neutral': 'bg-slate-400', 'Challenging': 'bg-orange-400', 'Very Challenging': 'bg-red-400',
  };
  return colors[rating] || 'bg-slate-400';
}

function getDayRatingBarWidth(rating: string): string {
  const widths: Record<string, string> = {
    'Very Positive': '95%', 'Positive': '70%', 'Neutral': '50%',
    'Challenging': '30%', 'Very Challenging': '10%',
  };
  return widths[rating] || '50%';
}

function generateActionableTip(dayRating: string): string {
  const tips: Record<string, string> = {
    'Very Positive':    '🌟 Seize the momentum. Create, plan, initiate. The universe is with you—move forward with confidence.',
    'Positive':         '🌱 Build on the flow. Take one meaningful action. This energy supports growth.',
    'Neutral':          '⏸️ Breathe and observe. Today is for reflection. Notice what wants to emerge, don\'t force it.',
    'Challenging':      '💪 Slow down and ground. This is for learning, not winning. Journal, move, rest—tend to yourself.',
    'Very Challenging': '🔥 Simplify everything. What\'s essential? Focus there. This too shall pass; do less today.',
  };
  return tips[dayRating] || 'Trust your instincts. Let them guide you.';
}

function formatDomainLabel(domain: string): string {
  return domain
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getConfidenceMeterColor(probability: number): string {
  if (probability >= 80) return 'bg-emerald-400';
  if (probability >= 65) return 'bg-cyan-400';
  return 'bg-amber-400';
}