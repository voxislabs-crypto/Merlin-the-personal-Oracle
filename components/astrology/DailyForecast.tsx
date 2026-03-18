'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Lightbulb, Sparkles, Heart, Briefcase, MessageSquare, Waves } from 'lucide-react';
import ThumbsFeedback from './ThumbsFeedback';

interface DailyForecastProps {
  date: string;
  summary: string;
  planetaryHighlights: string[];
  moonPhase: string;
  moonSign?: string;
  sunSign?: string;
  transits?: string[];
  advice: string;
  day_rating?: 'Very Positive' | 'Positive' | 'Neutral' | 'Challenging' | 'Very Challenging';
  focusAreas?: {
    love: string;
    career: string;
    mind: string;
    mood: string;
  };
  loading?: boolean;
  userId?: string;
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
  loading = false,
  userId
}: DailyForecastProps) {
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

  const hasRealData = transits.length > 0 || planetaryHighlights.length > 0;

  return (
    <motion.div
      className="space-y-5 z-10 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header: Date + Moon + Sun ─────────────────────────────────────── */}
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

      {/* ── Main Horoscope Summary ────────────────────────────────────────── */}
      <motion.div
        className="p-6 bg-slate-900/60 rounded-lg border border-amber-500/20 backdrop-blur-sm"
        variants={itemVariants}
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
            />
            <FocusCard
              icon={<Briefcase className="w-4 h-4 text-blue-400" />}
              label="Career & Ambition"
              color="blue"
              text={focusAreas.career}
            />
            <FocusCard
              icon={<MessageSquare className="w-4 h-4 text-purple-400" />}
              label="Mind & Communication"
              color="purple"
              text={focusAreas.mind}
            />
            <FocusCard
              icon={<Waves className="w-4 h-4 text-teal-400" />}
              label="Emotional Weather"
              color="teal"
              text={focusAreas.mood}
            />
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
                className="flex items-start gap-3 p-3 bg-purple-500/10 rounded border border-purple-400/20"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
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
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
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
        className="p-6 bg-gradient-to-r from-amber-900/20 to-amber-900/10 rounded-lg border border-amber-500/40"
        variants={itemVariants}
      >
        <h4 className="text-lg font-bold text-amber-200 mb-3">✨ Merlin's Word</h4>
        <p className="text-white leading-relaxed">{advice || 'The cosmos trusts your instincts today.'}</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Focus area card ──────────────────────────────────────────────────────────
function FocusCard({
  icon, label, color, text
}: { icon: React.ReactNode; label: string; color: string; text: string }) {
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
    <div className={`p-4 rounded-lg border ${borderMap[color] || 'border-slate-500/30 bg-slate-900/30'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-xs font-bold uppercase tracking-wider ${labelMap[color] || 'text-slate-300'}`}>
          {label}
        </span>
      </div>
      <p className="text-white text-sm leading-relaxed">{text}</p>
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