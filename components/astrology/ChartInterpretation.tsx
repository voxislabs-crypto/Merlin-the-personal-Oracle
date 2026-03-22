'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ThumbsFeedback from './ThumbsFeedback';

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
}

export function ChartInterpretation({
  summary,
  synthesis,
  planetInterpretations,
  aspectInterpretations,
  loading = false,
  interpreter = 'traditional',
  userId
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
