'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LifeBeat } from '@/lib/astrology/life-arc';

interface LifeArcProps {
  beats: LifeBeat[];
  summary: string;
  currentPhase: string;
  loading?: boolean;
}

export function LifeArc({
  beats,
  summary,
  currentPhase,
  loading = false
}: LifeArcProps) {
  const [expandedBeat, setExpandedBeat] = useState<number | null>(null);

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
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  const getIntensityColor = (intensity: LifeBeat['intensity']) => {
    switch (intensity) {
      case 'break':
        return {
          bg: 'from-red-900/40 to-red-900/10',
          border: 'border-red-500/40',
          text: 'text-red-300',
          icon: '💥',
          glow: 'shadow-red-500/20'
        };
      case 'burn':
        return {
          bg: 'from-orange-900/40 to-orange-900/10',
          border: 'border-orange-500/40',
          text: 'text-orange-300',
          icon: '🔥',
          glow: 'shadow-orange-500/20'
        };
      case 'build':
        return {
          bg: 'from-green-900/40 to-green-900/10',
          border: 'border-green-500/40',
          text: 'text-green-300',
          icon: '🏗️',
          glow: 'shadow-green-500/20'
        };
      case 'shift':
        return {
          bg: 'from-blue-900/40 to-blue-900/10',
          border: 'border-blue-500/40',
          text: 'text-blue-300',
          icon: '🌊',
          glow: 'shadow-blue-500/20'
        };
    }
  };

  // Determine current age from beats (approximate from most recent)
  const getCurrentAge = () => {
    const today = new Date().getFullYear();
    if (beats.length > 0) {
      const mostRecent = beats.reduce((prev, curr) => 
        curr.year <= today ? curr : prev
      );
      return mostRecent.age + (today - mostRecent.year);
    }
    return 30; // fallback
  };

  const currentAge = getCurrentAge();

  return (
    <motion.div
      className="space-y-8 z-10 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Current Phase Banner */}
      <motion.div
        variants={itemVariants}
        className="p-6 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 rounded-lg border-2 border-purple-400/50 shadow-lg shadow-purple-500/20"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">✨</span>
          <h3 className="text-2xl font-bold text-purple-200">Current Chapter</h3>
        </div>
        <p className="text-purple-100 text-lg leading-relaxed">
          {currentPhase}
        </p>
      </motion.div>

      {/* Timeline Visualization */}
      <motion.div variants={itemVariants} className="py-8">
        <h3 className="text-2xl font-bold text-amber-300 mb-6 text-center">Your Timeline</h3>
        <div className="relative">
          {/* Timeline bar */}
          <div className="absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-red-500/30 via-orange-500/30 via-green-500/30 to-blue-500/30"></div>
          
          {/* Beat markers */}
          <div className="flex justify-between items-start relative">
            {beats.map((beat, idx) => {
              const colors = getIntensityColor(beat.intensity);
              const isCurrent = beat.age <= currentAge && (idx === beats.length - 1 || beats[idx + 1].age > currentAge);
              const isPast = beat.age < currentAge;
              const isFuture = beat.age > currentAge;
              
              return (
                <div
                  key={`${beat.transit}-${beat.age}`}
                  className="flex flex-col items-center flex-1"
                >
                  {/* Icon marker */}
                  <motion.div
                    className={`relative mb-4 text-4xl cursor-pointer ${isCurrent ? 'scale-125' : 'scale-100'} hover:scale-110 transition-transform`}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    onClick={() => setExpandedBeat(expandedBeat === idx ? null : idx)}
                  >
                    <div className={`absolute inset-0 blur-xl ${colors.glow} ${isCurrent ? 'animate-pulse' : ''}`}></div>
                    <div className="relative">{colors.icon}</div>
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                    )}
                  </motion.div>
                  
                  {/* Age label */}
                  <div className={`text-sm font-bold mb-1 ${isPast ? 'text-slate-400' : isFuture ? 'text-slate-300' : 'text-amber-300'}`}>
                    Age {beat.age}
                  </div>
                  <div className="text-xs text-slate-500">{beat.year}</div>
                  
                  {/* Mini title */}
                  <div className={`text-xs text-center mt-2 ${colors.text} font-semibold max-w-[100px]`}>
                    {beat.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Life Arc Summary */}
      <motion.div
        variants={itemVariants}
        className="p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg border border-slate-600/50"
      >
        <h3 className="text-xl font-bold text-amber-300 mb-3 flex items-center gap-2">
          📖 Your Story Arc
        </h3>
        <p className="text-slate-200 text-lg leading-relaxed italic">
          {summary}
        </p>
      </motion.div>

      {/* The Three Beats - Detailed Cards */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-amber-300 mb-4">The Three Beats</h3>
        
        {beats.map((beat, idx) => {
          const colors = getIntensityColor(beat.intensity);
          const isCurrent = beat.age <= currentAge && (idx === beats.length - 1 || beats[idx + 1].age > currentAge);
          const isPast = beat.age < currentAge;
          const isExpanded = expandedBeat === idx;
          
          return (
            <motion.div
              key={`${beat.transit}-${beat.age}`}
              variants={itemVariants}
              className={`p-6 bg-gradient-to-br ${colors.bg} rounded-lg border-2 ${
                isCurrent ? 'border-amber-400 shadow-xl shadow-amber-500/20' : colors.border
              } relative overflow-hidden cursor-pointer transition-all ${
                isExpanded ? 'scale-[1.02]' : ''
              }`}
              onClick={() => setExpandedBeat(isExpanded ? null : idx)}
              whileHover={{ scale: 1.01 }}
            >
              {/* Current indicator */}
              {isCurrent && (
                <div className="absolute top-2 right-2">
                  <span className="px-3 py-1 bg-amber-400 text-slate-900 text-xs font-bold rounded-full uppercase tracking-wide animate-pulse">
                    You Are Here
                  </span>
                </div>
              )}

              {/* Beat number */}
              <div className="absolute top-4 left-4 text-6xl opacity-5 font-bold">
                {idx + 1}
              </div>

              {/* Header */}
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-4xl">{colors.icon}</span>
                    <h4 className={`text-2xl font-bold ${colors.text}`}>
                      {beat.title}
                    </h4>
                  </div>
                  <div className="text-sm text-slate-300/70">
                    <span className="font-semibold">Age {beat.age}</span> • {beat.year} • {beat.transit}
                  </div>
                  {isPast && !isCurrent && (
                    <div className="text-xs text-slate-500 mt-1">
                      ✓ Already walked through
                    </div>
                  )}
                  {!isPast && (
                    <div className="text-xs text-amber-400 mt-1">
                      ⏳ {beat.age - currentAge} years ahead
                    </div>
                  )}
                </div>
              </div>

              {/* Narrative */}
              <div className={`text-slate-100 text-lg leading-relaxed whitespace-pre-line transition-all ${
                isExpanded ? 'max-h-[1000px]' : 'max-h-[100px] overflow-hidden'
              }`}>
                {beat.narrative}
              </div>

              {/* Expand/Collapse hint */}
              <div className="mt-4 text-xs text-slate-400 text-center">
                {isExpanded ? '▲ Click to collapse' : '▼ Click to expand'}
              </div>

              {/* Intensity badge */}
              <div className="mt-4 inline-block">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${colors.bg} ${colors.border} ${colors.text}`}>
                  {beat.intensity}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Note */}
      <motion.div
        variants={itemVariants}
        className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-center"
      >
        <p className="text-slate-400 text-sm italic">
          The stars give the dates. You give the meaning. This is your myth in the making.
        </p>
      </motion.div>
    </motion.div>
  );
}
