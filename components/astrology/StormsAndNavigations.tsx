'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudLightning, Wind, ShieldCheck, ChevronDown, ChevronUp,
  AlertTriangle, Info, Zap, Calendar, Compass
} from 'lucide-react';
import { AstroStorm, StormsReport } from '@/hooks/useStorms';

interface StormsAndNavigationsProps {
  report: StormsReport | null;
  loading?: boolean;
  mbtiType?: string;
}

// ─── Colour palette per intensity ────────────────────────────────────────────

const INTENSITY_CONFIG = {
  severe: {
    border: 'border-red-500/40',
    bg: 'bg-red-900/20',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/40',
    icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
    glow: 'shadow-red-900/30',
    label: 'Severe',
  },
  moderate: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-900/20',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    icon: <CloudLightning className="w-4 h-4 text-amber-400" />,
    glow: 'shadow-amber-900/30',
    label: 'Moderate',
  },
  mild: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-900/10',
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    icon: <Wind className="w-4 h-4 text-blue-400" />,
    glow: 'shadow-blue-900/20',
    label: 'Mild',
  },
};

const LIFE_AREA_ICON: Record<string, React.ReactNode> = {
  'Identity & Confidence': <Zap className="w-3.5 h-3.5" />,
  'Emotional Wellbeing': <Info className="w-3.5 h-3.5" />,
  'Communication & Mind': <Info className="w-3.5 h-3.5" />,
  'Love & Relationships': <Info className="w-3.5 h-3.5" />,
  'Drive & Conflict': <AlertTriangle className="w-3.5 h-3.5" />,
  'General Life': <Info className="w-3.5 h-3.5" />,
};

// ─── Single storm card ────────────────────────────────────────────────────────

function StormCard({ storm, index }: { storm: AstroStorm; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = INTENSITY_CONFIG[storm.intensity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} shadow-lg ${cfg.glow} overflow-hidden`}
    >
      {/* Card header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        {/* Left: title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {cfg.icon}
            <span className="font-bold text-white text-base">{storm.title}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {storm.dayName} · {storm.date}
            </span>
            <span className="flex items-center gap-1">
              {LIFE_AREA_ICON[storm.lifeArea] ?? <Info className="w-3.5 h-3.5" />}
              {storm.lifeArea}
            </span>
            <span className="text-slate-500">orb {storm.orb}°</span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 mt-1 p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-600/60 transition-colors text-slate-300"
          aria-label={expanded ? 'Collapse storm details' : 'Expand storm details'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Keywords strip */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {storm.keywords.map((kw) => (
          <span
            key={kw}
            className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-400 border border-slate-600/40"
          >
            {kw}
          </span>
        ))}
      </div>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-slate-700/50 pt-4">
              {/* Description */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  What This Means
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{storm.description}</p>
              </div>

              {/* Navigation */}
              <div className={`rounded-lg p-4 border ${cfg.border} bg-slate-900/60`}>
                <div className="flex items-center gap-2 mb-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Navigate the Storm
                  </p>
                </div>
                <p className="text-sm text-amber-100/80 leading-relaxed">{storm.navigation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function StormsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-slate-700/40 border border-slate-600/30" />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StormsAndNavigations({ report, loading, mbtiType }: StormsAndNavigationsProps) {
  if (loading) {
    return (
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <CloudLightning className="w-6 h-6 text-amber-400" />
          <h3 className="text-xl font-bold text-amber-300">Storms &amp; Navigations</h3>
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Scanning week ahead…
          </span>
        </div>
        <StormsSkeleton />
      </div>
    );
  }

  if (!report) return null;

  const { storms, clearDays, weekSummary } = report;
  const severeCount = storms.filter((s) => s.intensity === 'severe').length;
  const moderateCount = storms.filter((s) => s.intensity === 'moderate').length;
  const mildCount = storms.filter((s) => s.intensity === 'mild').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8"
    >
      {/* Section header */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <CloudLightning className="w-6 h-6 text-amber-400" />
        <h3 className="text-xl font-bold text-amber-300">Storms &amp; Navigations</h3>
        {storms.length === 0 ? (
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Clear skies this week
          </span>
        ) : (
          <div className="flex gap-2">
            {severeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-300 border border-red-500/30">
                {severeCount} severe
              </span>
            )}
            {moderateCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {moderateCount} moderate
              </span>
            )}
            {mildCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-300 border border-blue-500/30">
                {mildCount} mild
              </span>
            )}
          </div>
        )}
        {mbtiType && (
          <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30">
            {mbtiType} advice
          </span>
        )}
      </div>

      {/* Week summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-5 px-5 py-4 rounded-xl bg-slate-900/60 border border-slate-700/50"
      >
        <p className="text-sm text-slate-300 leading-relaxed">{weekSummary}</p>
      </motion.div>

      {/* No storms */}
      {storms.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500"
        >
          <ShieldCheck className="w-12 h-12 text-emerald-500/60" />
          <p className="text-sm">No significant storms detected in the week ahead.</p>
          <p className="text-xs text-slate-600">Your chart is in relatively calm waters.</p>
        </motion.div>
      )}

      {/* Storm cards */}
      {storms.length > 0 && (
        <div className="space-y-3">
          {storms.map((storm, i) => (
            <StormCard key={storm.id} storm={storm} index={i} />
          ))}
        </div>
      )}

      {/* Clear days */}
      {clearDays.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 flex flex-wrap items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-slate-400">Clear days:</span>
          {clearDays.map((d) => (
            <span
              key={d}
              className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
            >
              {d}
            </span>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
