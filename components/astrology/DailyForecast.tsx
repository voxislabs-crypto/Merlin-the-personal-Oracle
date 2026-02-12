'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DailyForecastProps {
  date: string;
  summary: string;
  planetaryHighlights: string[];
  moonPhase: string;
  advice: string;
  loading?: boolean;
}

export function DailyForecast({
  date,
  summary,
  planetaryHighlights,
  moonPhase,
  advice,
  loading = false
}: DailyForecastProps) {
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
      className="space-y-6 z-10 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Date and Moon Phase */}
      <motion.div
        className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg border border-amber-500/30 backdrop-blur-sm"
        variants={itemVariants}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-amber-300">Today's Cosmic Forecast</h3>
          <span className="text-4xl">{getMoonEmoji(moonPhase)}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Date</p>
            <p className="text-amber-200 font-semibold">{new Date(date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Moon Phase</p>
            <p className="text-amber-200 font-semibold">{moonPhase}</p>
          </div>
        </div>
      </motion.div>

      {/* Daily Summary */}
      <motion.div
        className="p-6 bg-slate-900/60 rounded-lg border border-amber-500/20 backdrop-blur-sm"
        variants={itemVariants}
      >
        <h4 className="text-lg font-bold text-amber-300 mb-3">Summary</h4>
        <p className="text-white text-lg leading-relaxed">{summary}</p>
      </motion.div>

      {/* Planetary Highlights */}
      {planetaryHighlights.length > 0 && (
        <motion.div
          className="p-6 bg-slate-900/60 rounded-lg border border-amber-500/20"
          variants={itemVariants}
        >
          <h4 className="text-lg font-bold text-amber-300 mb-3">Planetary Highlights</h4>
          <div className="space-y-2">
            {planetaryHighlights.map((highlight, idx) => (
              <motion.div
                key={idx}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <span className="text-amber-400 mt-1">→</span>
                <span className="text-white">{highlight}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Daily Advice */}
      <motion.div
        className="p-6 bg-gradient-to-r from-amber-900/20 to-amber-900/10 rounded-lg border border-amber-500/40"
        variants={itemVariants}
      >
        <h4 className="text-lg font-bold text-amber-200 mb-3">✨ Cosmic Guidance</h4>
        <p className="text-white text-lg leading-relaxed italic">{advice}</p>
      </motion.div>
    </motion.div>
  );
}

function getMoonEmoji(phase: string): string {
  const phaseMap: Record<string, string> = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘'
  };
  return phaseMap[phase] || '🌙';
}
