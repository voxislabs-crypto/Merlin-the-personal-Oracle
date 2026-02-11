'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TransitData {
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  exact: boolean;
}

interface TransitSummary {
  total: number;
  exact: number;
  approaching: number;
}

interface ActiveTransitsProps {
  significant: TransitData[];
  approaching: TransitData[];
  summary: TransitSummary;
  loading?: boolean;
}

export function ActiveTransits({
  significant,
  approaching,
  summary,
  loading = false
}: ActiveTransitsProps) {
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
      className="space-y-6 z-10 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >

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
                    {transit.transitingPlanet} {transit.aspect} {transit.natalPlanet}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    transit.exact ? 'bg-red-600 text-red-100' : 'bg-orange-600 text-orange-100'
                  }`}>
                    {transit.exact ? 'EXACT' : `${transit.orb.toFixed(1)}° orb`}
                  </span>
                </div>
                <p className="text-red-200/70 text-sm">
                  This is a powerful time for {describeAspect(transit.aspect)} between your {transit.natalPlanet} and {transit.transitingPlanet}.
                </p>
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
                    {transit.transitingPlanet} {transit.aspect} {transit.natalPlanet}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-600 text-amber-100">
                    {transit.orb.toFixed(1)}° orb
                  </span>
                </div>
                <p className="text-amber-200/70 text-sm">
                  This transit is coming into focus. Pay attention to emerging patterns around {transit.natalPlanet}.
                </p>
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
    'Opposition': 'awareness and balance'
  };
  return descriptions[aspect] || 'astrological influence';
}
