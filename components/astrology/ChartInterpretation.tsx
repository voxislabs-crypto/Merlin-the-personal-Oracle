'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ChartInterpretationProps {
  summary: string;
  planetInterpretations: Array<{
    planet: string;
    interpretation: string;
  }>;
  aspectInterpretations: Array<{
    planets: string;
    interpretation: string;
  }>;
  loading?: boolean;
}

export function ChartInterpretation({
  summary,
  planetInterpretations,
  aspectInterpretations,
  loading = false
}: ChartInterpretationProps) {
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

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Chart Summary */}
      <motion.div
        className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg border border-amber-500/30 backdrop-blur-sm"
        variants={itemVariants}
      >
        <h3 className="text-xl font-bold text-amber-300 mb-3">Your Cosmic Blueprint</h3>
        <p className="text-gray-200 leading-relaxed">{summary}</p>
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
                <p className="text-gray-300 text-sm leading-relaxed">{item.interpretation}</p>
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
                <p className="text-gray-300 text-sm leading-relaxed">{item.interpretation}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
