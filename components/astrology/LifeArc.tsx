'use client';

import React from 'react';
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
          icon: '💥'
        };
      case 'burn':
        return {
          bg: 'from-orange-900/40 to-orange-900/10',
          border: 'border-orange-500/40',
          text: 'text-orange-300',
          icon: '🔥'
        };
      case 'build':
        return {
          bg: 'from-green-900/40 to-green-900/10',
          border: 'border-green-500/40',
          text: 'text-green-300',
          icon: '🏗️'
        };
      case 'shift':
        return {
          bg: 'from-blue-900/40 to-blue-900/10',
          border: 'border-blue-500/40',
          text: 'text-blue-300',
          icon: '🌊'
        };
    }
  };

  return (
    <motion.div
      className="space-y-8 z-10 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Summary Section */}
      <motion.div
        variants={itemVariants}
        className="p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-lg border border-purple-500/30"
      >
        <h3 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-2">
          ✨ Your Life Arc
        </h3>
        <p className="text-purple-100 text-lg leading-relaxed mb-4">
          {summary}
        </p>
        <div className="text-sm text-purple-300/70 italic">
          Current Phase: {currentPhase}
        </div>
      </motion.div>

      {/* Timeline - Story Beats */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-amber-300 mb-4">The Three Beats</h3>
        
        {beats.map((beat, idx) => {
          const colors = getIntensityColor(beat.intensity);
          
          return (
            <motion.div
              key={`${beat.transit}-${beat.age}`}
              variants={itemVariants}
              className={`p-6 bg-gradient-to-br ${colors.bg} rounded-lg border ${colors.border} relative overflow-hidden`}
            >
              {/* Beat number */}
              <div className="absolute top-4 right-4 text-5xl opacity-10 font-bold">
                {idx + 1}
              </div>

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{colors.icon}</span>
                    <h4 className={`text-2xl font-bold ${colors.text}`}>
                      {beat.title}
                    </h4>
                  </div>
                  <div className="text-sm text-slate-300/70">
                    <span className="font-semibold">Age {beat.age}</span> • {beat.year} • {beat.transit}
                  </div>
                </div>
              </div>

              {/* Narrative */}
              <div className="text-slate-100 text-lg leading-relaxed whitespace-pre-line">
                {beat.narrative}
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
          The stars give the dates. You give the meaning.
        </p>
      </motion.div>
    </motion.div>
  );
}
