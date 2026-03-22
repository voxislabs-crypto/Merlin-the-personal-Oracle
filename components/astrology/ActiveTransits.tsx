'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ThumbsFeedback from './ThumbsFeedback';
import { FeedbackCollector } from './FeedbackCollector';
import { UserContextCard } from './UserContextCard';
import { PredictionTimeline } from './PredictionTimeline';

interface TransitData {
  transitingPlanet: string;
  transitingSign: string;
  natalPlanet: string;
  natalSign?: string;
  aspect: string;
  orb: number;
  exact: boolean;
  shortDescription: string;
  description: string;
}

interface TransitSummary {
  total: number;
  exact: number;
  approaching: number;
}

interface PredictiveEvent {
  eventId: string;
  timing: {
    phase: 'building' | 'peaking' | 'releasing';
    peakAt: string;
    daysToPeak: number;
    hoursToPeak: number;
  };
  scores: {
    intensity: number;
    confidence: number;
    volatility: number;
    learnedAdjustment: number;
  };
  explanation: {
    aspectWeight: number;
    transitPlanetWeight: number;
    natalPointWeight: number;
    orbFactor: number;
    lifeStageBoost: number;
    mbtiModifier: number;
    contextMultiplier: number;
    progressedMoonBoost: number;
    lunarTimingModifier: number;
    learnedAdjustment: number;
    contextSignals: string[];
    lunarSignals: string[];
  };
  transit: {
    transitingPlanet: string;
    aspect: string;
    natalPlanet: string;
  };
  domains: Array<{
    name: 'love' | 'career' | 'money' | 'family' | 'health' | 'self';
    impact: number;
    valence: number;
  }>;
  narrative: {
    whisper: string;
    risk: string;
    opportunity: string;
    vibe: string;
  };
  mbtiLens: {
    likelyPattern: string;
    blindSpot: string;
    bestMove24h: string;
    avoidNow: string;
  };
  lifeStage: {
    tag: string;
    active: boolean;
    note?: string;
  };
}

interface ActiveTransitsProps {
  significant: TransitData[];
  approaching: TransitData[];
  summary: TransitSummary;
  predictive?: {
    generatedAt: string;
    windowDays: number;
    lunarTiming: {
      phase: string;
      illumination: number;
      isVoidOfCourse: boolean;
      hoursToNextSign: number;
      nextSignAt: string;
      actionBias: 'initiate' | 'build' | 'review' | 'release';
      guidance: string;
    };
    progressedMoon: {
      sign: string;
      degree: number;
      yearsProgressed: number;
      emphasis: Array<'love' | 'career' | 'money' | 'family' | 'health' | 'self'>;
    };
    events: PredictiveEvent[];
  };
  confluence?: Array<{
    theme: 'transformation' | 'love' | 'career' | 'inner work' | 'communication' | 'abundance';
    title: string;
    headline: string;
    summary: string;
    score: number;
    signalCount: number;
    dominantPhase: 'building' | 'peak' | 'integrating';
  }>;
  transitWindows?: Array<{
    eventId: string;
    title: string;
    startsAt: string;
    exactAt: string;
    endsAt: string;
    currentPhase: 'building' | 'peak' | 'integrating';
    intensity: number;
  }>;
  resonance?: {
    history: Array<{
      feedbackId: string;
      date: string;
      label: string;
      theme: string;
      resonated: boolean;
      accuracyScore: number;
      planets: string[];
    }>;
    summary?: {
      feedbackCount: number;
      strongestPlanet?: string;
      strongestMultiplier?: number;
    };
  };
  loading?: boolean;
  userId?: string;
  mbtiType?: string | null;
  onContextSaved?: () => void;
}

export function ActiveTransits({
  significant,
  approaching,
  summary,
  predictive,
  confluence,
  transitWindows,
  resonance,
  loading = false,
  userId,
  mbtiType,
  onContextSaved
}: ActiveTransitsProps) {
  const STORAGE_KEY = 'merlin:transit-details:active-transits';
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const transitId = (prefix: string, transit: TransitData) =>
    `${prefix}-${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspect}-${transit.orb.toFixed(2)}`;

  const allTransitIds = React.useMemo(
    () => [
      ...significant.map((transit) => transitId('sig', transit)),
      ...approaching.map((transit) => transitId('app', transit)),
    ],
    [significant, approaching]
  );

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    allTransitIds.forEach((id) => {
      next[id] = true;
    });
    setExpandedItems(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    allTransitIds.forEach((id) => {
      next[id] = false;
    });
    setExpandedItems(next);
  };

  React.useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
    const defaults: Record<string, boolean> = {};

    significant.forEach((transit) => {
      defaults[transitId('sig', transit)] = isDesktop;
    });

    approaching.forEach((transit) => {
      defaults[transitId('app', transit)] = isDesktop;
    });

    if (typeof window === 'undefined') {
      setExpandedItems(defaults);
      return;
    }

    try {
      const savedRaw = window.localStorage.getItem(STORAGE_KEY);
      if (!savedRaw) {
        setExpandedItems(defaults);
        return;
      }

      const saved = JSON.parse(savedRaw) as Record<string, boolean>;
      const merged: Record<string, boolean> = {};
      Object.keys(defaults).forEach((key) => {
        merged[key] = typeof saved[key] === 'boolean' ? saved[key] : defaults[key];
      });
      setExpandedItems(merged);
    } catch {
      setExpandedItems(defaults);
    }
  }, [significant, approaching]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedItems));
    } catch {
      // no-op
    }
  }, [expandedItems]);

  if (loading) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-lg border border-amber-500/20">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const getActionSignal = (event: PredictiveEvent) => {
    const isHardAspect = event.transit.aspect === 'Square' || event.transit.aspect === 'Opposition';
    const hasVofCaution = event.explanation.lunarSignals?.some((signal) =>
      signal.toLowerCase().includes('void-of-course')
    );

    const delayNow =
      hasVofCaution ||
      (isHardAspect && event.scores.volatility >= 0.65) ||
      event.scores.confidence < 0.78;

    if (delayNow) {
      return {
        label: 'Delay Now',
        reason: hasVofCaution
          ? 'Moon timing caution active'
          : event.scores.confidence < 0.78
          ? 'Signal confidence still building'
          : 'High volatility—wait for cleaner timing',
        className: 'bg-amber-500/20 text-amber-200 border border-amber-400/40',
      };
    }

    return {
      label: 'Do Now',
      reason: event.scores.intensity >= 65 ? 'Momentum window is open' : 'Actionable with low friction',
      className: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40',
    };
  };

  return (
    <motion.div
      className="space-y-6 z-10 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <UserContextCard userId={userId} onSaved={onContextSaved} />
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        variants={itemVariants}
      >
        <div className="p-4 bg-gradient-to-br from-red-900/40 to-red-900/10 rounded-lg border border-red-500/30">
          <p className="text-red-300 text-sm mb-1">Exact Transits</p>
          <p className="text-3xl font-bold text-red-200">{summary.exact}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-900/40 to-amber-900/10 rounded-lg border border-amber-500/30">
          <p className="text-amber-300 text-sm mb-1">Approaching</p>
          <p className="text-3xl font-bold text-amber-200">{summary.approaching}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-900/40 to-blue-900/10 rounded-lg border border-blue-500/30">
          <p className="text-blue-300 text-sm mb-1">Total Active</p>
          <p className="text-3xl font-bold text-blue-200">{summary.total}</p>
        </div>
      </motion.div>

      {allTransitIds.length > 0 && (
        <motion.div variants={itemVariants} className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs text-amber-300 hover:text-amber-200 underline"
            title="Expand all transit interpretations"
          >
            Expand all interpretations
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs text-slate-400 hover:text-slate-300 underline"
            title="Collapse all transit interpretations"
          >
            Collapse all interpretations
          </button>
        </motion.div>
      )}

      {confluence?.length ? (
        <motion.div variants={itemVariants} className="p-4 rounded-lg border border-indigo-500/30 bg-indigo-950/20">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-lg font-bold text-indigo-100">Confluence Themes</h3>
            <span className="text-xs text-indigo-300/80">Only themes with 3+ aligned signals</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {confluence.slice(0, 4).map((theme) => (
              <div key={theme.theme} className="rounded-md border border-indigo-400/20 bg-slate-900/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-indigo-100">{theme.title}</p>
                  <span className="text-xs text-indigo-300">{theme.score}/100</span>
                </div>
                <p className="text-xs text-indigo-300 mt-1">{theme.signalCount} aligned signals · {theme.dominantPhase}</p>
                <p className="text-sm text-slate-200 mt-2">{theme.headline}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      {transitWindows?.length ? (
        <motion.div variants={itemVariants} className="p-4 rounded-lg border border-sky-500/30 bg-sky-950/20">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-lg font-bold text-sky-100">Transit Windows Timeline</h3>
            <span className="text-xs text-sky-300/80">Building, peak, and integrating phases</span>
          </div>
          <div className="space-y-2">
            {transitWindows.slice(0, 6).map((window) => (
              <div key={window.eventId} className="rounded-md border border-sky-400/20 bg-slate-900/45 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-sky-100">{window.title}</p>
                  <span className="text-xs text-sky-300">{window.intensity}/100</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Building {new Date(window.startsAt).toLocaleDateString()} · Peak {new Date(window.exactAt).toLocaleDateString()} · Integrating {new Date(window.endsAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-sky-300 mt-1">Current phase: {window.currentPhase}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      <motion.div variants={itemVariants}>
        <PredictionTimeline
          entries={resonance?.history || []}
          loading={loading && !resonance}
        />
        {resonance?.summary?.feedbackCount ? (
          <p className="text-xs text-slate-400 mt-2">
            Personalized from {resonance.summary.feedbackCount} feedback ratings
            {resonance.summary.strongestPlanet ? ` · strongest signal: ${resonance.summary.strongestPlanet}` : ''}
            {typeof resonance.summary.strongestMultiplier === 'number' ? ` (${resonance.summary.strongestMultiplier.toFixed(2)}x)` : ''}
          </p>
        ) : null}
      </motion.div>

      {predictive?.events?.length ? (
        <motion.div variants={itemVariants} className="p-4 rounded-lg border border-violet-500/30 bg-violet-950/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-violet-200">🔮 7-Day Clairvoyance Forecast</h3>
            <span className="text-xs text-violet-300/80">Top {Math.min(3, predictive.events.length)} signals</span>
          </div>
          <div className="mb-3 rounded-md border border-violet-400/20 bg-slate-900/40 p-3">
            <p className="text-sm text-violet-100 font-medium">
              Lunar Timing: {predictive.lunarTiming.phase} · {predictive.lunarTiming.illumination}% illuminated
            </p>
            <p className="text-xs text-violet-300/90 mt-1">
              Bias: {predictive.lunarTiming.actionBias.toUpperCase()} · Progressed Moon: {predictive.progressedMoon.sign} {predictive.progressedMoon.degree.toFixed(1)}°
            </p>
            <p className="text-xs text-slate-300 mt-1">{predictive.lunarTiming.guidance}</p>
            {predictive.lunarTiming.isVoidOfCourse && (
              <p className="text-xs text-amber-300 mt-1">
                Moon is near sign change ({predictive.lunarTiming.hoursToNextSign}h). Favor review/maintenance before major launches.
              </p>
            )}
          </div>
          <div className="space-y-3">
            {predictive.events.slice(0, 3).map((event) => (
              <div key={event.eventId} className="rounded-md border border-violet-400/20 bg-slate-900/40 p-3">
                {(() => {
                  const actionSignal = getActionSignal(event);
                  return (
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${actionSignal.className}`}>
                        {actionSignal.label}
                      </span>
                      <span className="text-[11px] text-slate-300">{actionSignal.reason}</span>
                    </div>
                  );
                })()}
                <p className="text-sm font-semibold text-violet-100">
                  {event.transit.transitingPlanet} {event.transit.aspect} {event.transit.natalPlanet}
                </p>
                <p className="text-xs text-violet-300/80 mt-1">
                  {event.timing.phase.toUpperCase()} · peaks {new Date(event.timing.peakAt).toLocaleDateString()} ({event.timing.hoursToPeak}h) · intensity {event.scores.intensity}/100
                </p>
                {event.scores.learnedAdjustment !== 0 && (
                  <p className="text-xs text-violet-400/80 mt-1">
                    Learned adjustment: {event.scores.learnedAdjustment > 0 ? '+' : ''}{event.scores.learnedAdjustment.toFixed(2)}
                  </p>
                )}
                <p className="text-sm text-slate-200 mt-2">{event.narrative.whisper}</p>
                <p className="text-xs text-slate-300 mt-1">{event.narrative.vibe}</p>
                {event.explanation.contextSignals.length > 0 && (
                  <p className="text-xs text-cyan-300 mt-1">
                    Context read: {event.explanation.contextSignals.join(', ')}
                  </p>
                )}
                {event.explanation.lunarSignals?.length > 0 && (
                  <p className="text-xs text-indigo-300 mt-1">
                    Lunar read: {event.explanation.lunarSignals.join(', ')}
                  </p>
                )}
                <p className="text-xs text-slate-300 mt-1">Best move (24h): {event.mbtiLens.bestMove24h}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Risk: {event.narrative.risk}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Opportunity: {event.narrative.opportunity}
                </p>
                <details className="mt-2 rounded border border-violet-500/20 bg-slate-950/40 p-2">
                  <summary className="cursor-pointer text-xs text-violet-200">Why this score changed</summary>
                  <div className="mt-2 space-y-1 text-xs text-slate-300">
                    <p>Aspect weight: {event.explanation.aspectWeight}</p>
                    <p>Transit planet weight: {event.explanation.transitPlanetWeight}</p>
                    <p>Natal point weight: {event.explanation.natalPointWeight}</p>
                    <p>Orb factor: {event.explanation.orbFactor}</p>
                    <p>Life-stage boost: {event.explanation.lifeStageBoost}</p>
                    <p>MBTI modifier: {event.explanation.mbtiModifier}</p>
                    <p>Context multiplier: {event.explanation.contextMultiplier}</p>
                    <p>Progressed Moon boost: {event.explanation.progressedMoonBoost}</p>
                    <p>Lunar timing modifier: {event.explanation.lunarTimingModifier}</p>
                    <p>Learned adjustment: {event.explanation.learnedAdjustment > 0 ? '+' : ''}{event.explanation.learnedAdjustment}</p>
                    <p>Blind spot: {event.mbtiLens.blindSpot}</p>
                    <p>Avoid now: {event.mbtiLens.avoidNow}</p>
                  </div>
                </details>
                {event.lifeStage.active && (
                  <p className="text-xs text-amber-300 mt-2">Life stage active: {event.lifeStage.tag}{event.lifeStage.note ? ` — ${event.lifeStage.note}` : ''}</p>
                )}
                {userId && (
                  <div className="mt-3">
                    <FeedbackCollector
                      aspectId={event.eventId}
                      theme={event.domains[0]?.name || 'predictive'}
                      userId={userId}
                      mbtiType={mbtiType || undefined}
                      transitDescription={event.narrative.whisper}
                      promptText="Did this happen in your life?"
                      compact
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Significant Transits */}
      {significant.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-bold text-red-300 mb-4">⚡ Exact & Powerful Transits</h3>
          <div className="space-y-3">
            {significant.map((transit, idx) => (
              <motion.div
                key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspect}`}
                className="p-4 bg-red-900/20 rounded-lg border border-red-500/40 hover:border-red-400/60 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-red-200">
                    {transit.transitingPlanet} ({transit.transitingSign}) {transit.aspect} {transit.natalPlanet}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    transit.exact ? 'bg-red-600 text-red-100' : 'bg-orange-600 text-orange-100'
                  }`}>
                    {transit.exact ? 'EXACT' : `${transit.orb.toFixed(1)}° orb`}
                  </span>
                </div>
                <p className="text-red-200/70 text-sm">
                  {transit.shortDescription || `This is a powerful time for ${describeAspect(transit.aspect)} between your ${transit.natalPlanet} and ${transit.transitingPlanet}.`}
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
                  onClick={() => toggleExpanded(transitId('sig', transit))}
                  aria-expanded={Boolean(expandedItems[transitId('sig', transit)])}
                  aria-controls={`${transitId('sig', transit)}-detail`}
                  title={expandedItems[transitId('sig', transit)] ? 'Hide full interpretation' : 'Read full interpretation'}
                >
                  {expandedItems[transitId('sig', transit)] ? 'Hide full interpretation' : 'Read full interpretation'}
                </button>
                {expandedItems[transitId('sig', transit)] && (
                  <p id={`${transitId('sig', transit)}-detail`} className="mt-2 text-red-100/80 text-sm">
                    {transit.description || `This is a powerful time for ${describeAspect(transit.aspect)} between your ${transit.natalPlanet} and ${transit.transitingPlanet}.`}
                  </p>
                )}
                <div className="mt-2">
                  <ThumbsFeedback itemId={`transit-sig-${transit.transitingPlanet}-${transit.natalPlanet}`} label="transit" userId={userId} theme="transits" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Approaching Transits */}
      {approaching.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-bold text-amber-300 mb-4">📈 Approaching Transits</h3>
          <div className="space-y-3">
            {approaching.map((transit, idx) => (
              <motion.div
                key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspect}`}
                className="p-4 bg-amber-900/20 rounded-lg border border-amber-500/40 hover:border-amber-400/60 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-amber-200">
                    {transit.transitingPlanet} ({transit.transitingSign}) {transit.aspect} {transit.natalPlanet}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-600 text-amber-100">
                    {transit.orb.toFixed(1)}° orb
                  </span>
                </div>
                <p className="text-amber-200/70 text-sm">
                  {transit.shortDescription || `This transit is coming into focus. Pay attention to emerging patterns around ${transit.natalPlanet}.`}
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs text-amber-300 hover:text-amber-200 underline"
                  onClick={() => toggleExpanded(transitId('app', transit))}
                  aria-expanded={Boolean(expandedItems[transitId('app', transit)])}
                  aria-controls={`${transitId('app', transit)}-detail`}
                  title={expandedItems[transitId('app', transit)] ? 'Hide full interpretation' : 'Read full interpretation'}
                >
                  {expandedItems[transitId('app', transit)] ? 'Hide full interpretation' : 'Read full interpretation'}
                </button>
                {expandedItems[transitId('app', transit)] && (
                  <p id={`${transitId('app', transit)}-detail`} className="mt-2 text-amber-100/80 text-sm">
                    {transit.description || `This transit is coming into focus. Pay attention to emerging patterns around ${transit.natalPlanet}.`}
                  </p>
                )}
                <div className="mt-2">
                  <ThumbsFeedback itemId={`transit-app-${transit.transitingPlanet}-${transit.natalPlanet}`} label="transit" userId={userId} theme="transits" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {significant.length === 0 && approaching.length === 0 && (
        <motion.div
          className="p-8 bg-slate-900/40 rounded-lg border border-slate-500/30 text-center"
          variants={itemVariants}
        >
          <p className="text-gray-400">No significant transits at this moment.</p>
          <p className="text-gray-500 text-sm mt-2">The cosmic wheel turns slowly—check back soon.</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function describeAspect(aspect: string): string {
  const descriptions: Record<string, string> = {
    'Conjunction': 'synthesis and unified energy',
    'Sextile': 'harmonious opportunity',
    'Square': 'dynamic tension and growth',
    'Trine': 'flowing support and ease',
    'Opposition': 'awareness and balance',
    'Quincunx': 'adjustment and realignment pressure',
    'Sesquiquadrate': 'irritating friction requiring release',
    'Semisquare': 'subtle tension demanding action',
    'Semisextile': 'small openings through steady integration'
  };
  return descriptions[aspect] || 'astrological influence';
}
