'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ThumbsFeedback from './ThumbsFeedback';
import type { DomainScore, ExplainabilityPacket } from '@/types/astrology';

interface ChartInterpretationProps {
  summary: string;
  synthesis?: {
    dominantThemes: string[];
    timingHighlights: string[];
    resonanceNote: string;
  };
  planetInterpretations: Array<{
    planet: string;
    interpretation: string;
  }>;
  aspectInterpretations: Array<{
    planets: string;
    interpretation: string;
  }>;
  loading?: boolean;
  interpreter?: 'grok' | 'traditional';
  userId?: string;
  explainability?: ExplainabilityPacket;
  domainScores?: DomainScore[];
  insightLoading?: boolean;
  insightError?: string;
}

export function ChartInterpretation({
  summary,
  synthesis,
  planetInterpretations,
  aspectInterpretations,
  loading = false,
  interpreter = 'traditional',
  userId,
  explainability,
  domainScores,
  insightLoading = false,
  insightError,
}: ChartInterpretationProps) {
  if (loading) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-lg border border-amber-500/20 z-10 relative">
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

  const rankedDomains = [...(domainScores?.length ? domainScores : explainability?.domainScores || [])]
    .sort((a, b) => b.pressure - a.pressure)
    .slice(0, 3);
  const showSafety =
    (explainability?.globalPressure || 0) >= 75 ||
    Boolean(explainability?.safety?.grounding?.length) ||
    Boolean(explainability?.safety?.caution?.length) ||
    Boolean(explainability?.safety?.agency?.length);

  return (
    <motion.div
      className="space-y-8 z-10 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Chart Summary */}
      <motion.div
        className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg border border-amber-500/30 backdrop-blur-sm relative"
        variants={itemVariants}
      >
        {interpreter === 'grok' && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-xs text-purple-300 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
            Powered by Grok
          </div>
        )}
        <h3 className="text-xl font-bold text-amber-300 mb-3">Your Cosmic Blueprint</h3>
        <p className="text-white text-lg leading-relaxed">{summary}</p>
        {synthesis && (
          <div className="mt-4 space-y-2">
            {synthesis.dominantThemes.length > 0 && (
              <p className="text-sm text-amber-200/90">
                Dominant themes: {synthesis.dominantThemes.join(', ')}
              </p>
            )}
            {synthesis.timingHighlights.length > 0 && (
              <p className="text-sm text-amber-200/90">
                Timing highlights: {synthesis.timingHighlights.join(' | ')}
              </p>
            )}
            {synthesis.resonanceNote && (
              <p className="text-xs text-amber-100/80">{synthesis.resonanceNote}</p>
            )}
          </div>
        )}
        <div className="mt-3">
          <ThumbsFeedback itemId="chart-summary" label="reading" userId={userId} theme="natal" />
        </div>
      </motion.div>

      {(insightLoading || explainability || rankedDomains.length > 0 || insightError) && (
        <motion.div
          className="p-5 bg-slate-900/60 rounded-lg border border-cyan-500/25"
          variants={itemVariants}
        >
          <h4 className="text-lg font-semibold text-cyan-200">Interpretation Confidence Context</h4>
          {insightLoading && !explainability ? (
            <p className="text-xs text-slate-300 mt-2">Calculating interpretation confidence drivers...</p>
          ) : null}

          {explainability ? (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-slate-100">
                Pressure context {explainability.globalPressure}/100 · Confidence {explainability.confidence}/100.
              </p>
              <p className="text-xs text-slate-300">
                This interpretation is directional and probabilistic rather than certain.
              </p>
              {explainability.topDrivers?.length ? (
                <p className="text-xs text-cyan-100">
                  Top drivers: {explainability.topDrivers.slice(0, 3).map((driver) => driver.label).join(' | ')}
                </p>
              ) : null}
            </div>
          ) : null}

          {rankedDomains.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              {rankedDomains.map((domain) => (
                <div key={domain.domain} className="rounded border border-slate-600/40 bg-slate-950/45 px-3 py-2">
                  <p className="text-xs text-slate-200">{formatDomainLabel(domain.domain)}</p>
                  <p className="text-xs text-slate-300 mt-1">Pressure {domain.pressure}/100 · Confidence {domain.confidence}/100</p>
                </div>
              ))}
            </div>
          ) : null}

          {showSafety ? (
            <div className="mt-3 rounded border border-amber-500/35 bg-amber-500/10 px-3 py-2">
              <p className="text-xs text-amber-200 font-semibold">Grounding cue</p>
              <p className="text-xs text-amber-100/90 mt-1">
                {explainability?.safety?.grounding?.slice(0, 2).join(' ') || 'Take one slow breath and pick the smallest actionable next step.'}
              </p>
            </div>
          ) : null}

          {insightError ? <p className="text-xs text-rose-300 mt-3">{insightError}</p> : null}
        </motion.div>
      )}

      {/* Planet Interpretations */}
      {planetInterpretations.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-bold text-amber-300 mb-4">Planetary Placements</h3>
          <div className="space-y-4">
            {planetInterpretations.map((item, idx) => (
              <motion.div
                key={item.planet}
                className="p-5 bg-slate-900/60 rounded-lg border border-amber-500/20 hover:border-amber-500/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <h4 className="text-lg font-semibold text-amber-200 mb-2">{item.planet}</h4>
                <p className="text-white text-lg leading-relaxed">{item.interpretation}</p>
                <div className="mt-2">
                  <ThumbsFeedback itemId={`planet-${item.planet}`} label="interpretation" userId={userId} theme="natal" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Aspect Interpretations */}
      {aspectInterpretations.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-bold text-amber-300 mb-4">Significant Aspects</h3>
          <div className="space-y-4">
            {aspectInterpretations.map((item, idx) => (
              <motion.div
                key={item.planets}
                className="p-5 bg-slate-900/60 rounded-lg border border-amber-500/20 hover:border-amber-500/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <h4 className="text-lg font-semibold text-amber-200 mb-2">{item.planets}</h4>
                <p className="text-white text-lg leading-relaxed">{item.interpretation}</p>
                <div className="mt-2">
                  <ThumbsFeedback itemId={`aspect-${item.planets.replace(/\s/g, '-')}`} label="aspect" userId={userId} theme="natal" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function formatDomainLabel(domain: string): string {
  return domain
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
