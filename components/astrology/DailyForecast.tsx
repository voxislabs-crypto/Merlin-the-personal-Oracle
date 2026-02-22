'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Lightbulb, Sparkles } from 'lucide-react';

interface DailyForecastProps {
  date: string;
  summary: string;
  planetaryHighlights: string[];
  moonPhase: string;
  transits?: string[];
  advice: string;
  day_rating?: 'Very Positive' | 'Positive' | 'Neutral' | 'Challenging' | 'Very Challenging';
  loading?: boolean;
}

export function DailyForecast({
  date,
  summary,
  planetaryHighlights,
  moonPhase,
  transits = [],
  advice,
  day_rating = 'Neutral',
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
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-amber-300">Today's Cosmic Forecast</h3>
            <p className="text-slate-400 text-sm mt-1">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <span className="text-4xl">{getMoonEmoji(moonPhase)}</span>
            <p className="text-amber-200 text-sm mt-1 font-semibold">{moonPhase}</p>
          </div>
        </div>
        
        {/* Day Rating */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-amber-500/20">
          {getDayRatingIcon(day_rating)}
          <span className={`text-sm font-semibold ${getDayRatingColor(day_rating)}`}>
            {day_rating}
          </span>
        </div>
      </motion.div>

      {/* Main Summary */}
      <motion.div
        className="p-6 bg-slate-900/60 rounded-lg border border-amber-500/20 backdrop-blur-sm"
        variants={itemVariants}
      >
        <h4 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          The Cosmic Story
        </h4>
        <p className="text-white text-lg leading-relaxed">
          {summary || 'A day of quiet potential. Use it to build what matters.'}
        </p>
      </motion.div>

      {/* Active Transits (What's actually happening) */}
      {transits && transits.length > 0 && (
        <motion.div
          className="p-6 bg-gradient-to-br from-purple-900/30 to-slate-900/60 rounded-lg border border-purple-400/30"
          variants={itemVariants}
        >
          <h4 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Active Transits (Swiss Real)
          </h4>
          <div className="space-y-2">
            {transits.slice(0, 3).map((transit, idx) => (
              <motion.div
                key={idx}
                className="flex items-start gap-3 p-3 bg-purple-500/10 rounded border border-purple-400/20"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <span className="text-purple-400 mt-1 font-bold text-lg">→</span>
                <span className="text-purple-100 text-sm">{transit}</span>
              </motion.div>
            ))}
            {transits.length > 3 && (
              <p className="text-xs text-purple-300/60 mt-2">+ {transits.length - 3} more transits</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Planetary Highlights */}
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
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <span className="text-amber-400 mt-1">✦</span>
                <span className="text-white text-sm">{highlight}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* How to Ride It - Actionable Tip */}
      <motion.div
        className="p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/20 rounded-lg border border-green-500/40"
        variants={itemVariants}
      >
        <h4 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          How to Ride It
        </h4>
        <p className="text-white text-lg leading-relaxed italic">{generateActionableTip(advice, day_rating)}</p>
      </motion.div>

      {/* Cosmic Guidance */}
      <motion.div
        className="p-6 bg-gradient-to-r from-amber-900/20 to-amber-900/10 rounded-lg border border-amber-500/40"
        variants={itemVariants}
      >
        <h4 className="text-lg font-bold text-amber-200 mb-3">✨ Final Word</h4>
        <p className="text-white leading-relaxed">{advice || 'The cosmos trusts your instincts today.'}</p>
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
function getDayRatingIcon(rating: string) {
  const icons: Record<string, string> = {
    'Very Positive': '✨✨',
    'Positive': '✨',
    'Neutral': '🔄',
    'Challenging': '⚡',
    'Very Challenging': '⚡⚡',
  };
  return <span className="text-lg">{icons[rating] || '🔮'}</span>;
}

function getDayRatingColor(rating: string): string {
  const colors: Record<string, string> = {
    'Very Positive': 'text-green-300',
    'Positive': 'text-emerald-300',
    'Neutral': 'text-slate-300',
    'Challenging': 'text-orange-300',
    'Very Challenging': 'text-red-300',
  };
  return colors[rating] || 'text-slate-300';
}

function generateActionableTip(advice: string, dayRating: string): string {
  const tips: Record<string, string> = {
    'Very Positive': '🌟 Seize the momentum. Create, plan, initiate. The universe is with you—move forward with confidence.',
    'Positive': '🌱 Build on the flow. Take one meaningful action. This energy supports growth.',
    'Neutral': '⏸️ Breathe and observe. Today is for reflection. Notice what wants to emerge, don\'t force it.',
    'Challenging': '💪 Slow down and ground. This is for learning, not winning. Journal, move, rest—tend to yourself.',
    'Very Challenging': '🔥 Simplify everything. What\'s essential? Focus there. This too shall pass; smaller right now.',
  };
  return tips[dayRating] || 'Trust your instincts. Let them guide you.';
}