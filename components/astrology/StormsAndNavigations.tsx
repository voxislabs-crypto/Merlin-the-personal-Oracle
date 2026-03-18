'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudLightning, Wind, ShieldCheck, AlertTriangle, Zap,
  Compass, Sun, Brain, Heart, Swords, Leaf, Globe,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { AstroStorm, StormsReport } from '@/hooks/useStorms';

interface StormsAndNavigationsProps {
  report: StormsReport | null;
  loading?: boolean;
  mbtiType?: string;
}

// ─── Intensity visual config ──────────────────────────────────────────────────

const INTENSITY = {
  severe: {
    border: 'border-red-500/50',
    headerBg: 'bg-red-950/60',
    bodyBg: 'bg-red-950/20',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/30',
    navBg: 'bg-red-950/40 border-red-500/30',
    navTitle: 'text-red-300',
    dot: 'bg-red-500',
    glow: 'shadow-lg shadow-red-500/10',
    label: 'Severe',
    icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
    dayDot: 'bg-red-500',
  },
  moderate: {
    border: 'border-amber-500/40',
    headerBg: 'bg-amber-950/50',
    bodyBg: 'bg-amber-950/15',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    navBg: 'bg-amber-950/40 border-amber-500/30',
    navTitle: 'text-amber-300',
    dot: 'bg-amber-500',
    glow: 'shadow-lg shadow-amber-500/10',
    label: 'Moderate',
    icon: <CloudLightning className="w-4 h-4 text-amber-400" />,
    dayDot: 'bg-amber-500',
  },
  mild: {
    border: 'border-blue-500/30',
    headerBg: 'bg-blue-950/40',
    bodyBg: 'bg-blue-950/10',
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
    navBg: 'bg-blue-950/30 border-blue-500/25',
    navTitle: 'text-blue-300',
    dot: 'bg-blue-400',
    glow: 'shadow-lg shadow-blue-500/10',
    label: 'Mild',
    icon: <Wind className="w-4 h-4 text-blue-400" />,
    dayDot: 'bg-blue-400',
  },
};

// ─── Life area icons ──────────────────────────────────────────────────────────

const LIFE_AREA_ICON: Record<string, React.ReactNode> = {
  'Identity & Confidence':  <Zap    className="w-3.5 h-3.5 text-yellow-400" />,
  'Emotional Wellbeing':    <Heart  className="w-3.5 h-3.5 text-pink-400"   />,
  'Communication & Mind':   <Brain  className="w-3.5 h-3.5 text-cyan-400"   />,
  'Love & Relationships':   <Heart  className="w-3.5 h-3.5 text-rose-400"   />,
  'Drive & Conflict':       <Swords className="w-3.5 h-3.5 text-orange-400" />,
  'Growth & Beliefs':       <Leaf   className="w-3.5 h-3.5 text-emerald-400"/>,
  'Discipline & Structure': <Brain  className="w-3.5 h-3.5 text-slate-400"  />,
  'Change & Freedom':       <Wind   className="w-3.5 h-3.5 text-purple-400" />,
  'Intuition & Boundaries': <Sun    className="w-3.5 h-3.5 text-violet-400" />,
  'Power & Transformation': <Zap    className="w-3.5 h-3.5 text-red-400"    />,
  'Self-Presentation':      <Globe  className="w-3.5 h-3.5 text-teal-400"   />,
  'General Life':           <Globe  className="w-3.5 h-3.5 text-slate-400"  />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayDate(dateString: string): string {
  const d = new Date(dateString + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Return worst intensity for a given date across a list of storms */
function worstIntensityForDate(
  storms: AstroStorm[],
  date: string,
): 'severe' | 'moderate' | 'mild' | null {
  const day = storms.filter((s) => s.date === date);
  if (day.length === 0) return null;
  if (day.some((s) => s.intensity === 'severe'))   return 'severe';
  if (day.some((s) => s.intensity === 'moderate')) return 'moderate';
  return 'mild';
}

// ─── 7-day weather strip ──────────────────────────────────────────────────────

function WeekStrip({
  storms,
  selectedDate,
  onSelectDate,
}: {
  storms: AstroStorm[];
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
}) {
  // Build ordered 7-day array starting from the earliest storm date or today
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayStr + 'T12:00:00');
      d.setDate(d.getDate() + i);
      arr.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
    }
    return arr;
  }, [todayStr]);

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((date) => {
        const worst = worstIntensityForDate(storms, date);
        const isToday = date === todayStr;
        const isSelected = date === selectedDate;
        const d = new Date(date + 'T12:00:00');
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = d.getDate();

        return (
          <button
            key={date}
            onClick={() => worst ? onSelectDate(date) : undefined}
            className={[
              'relative flex flex-col items-center gap-1 py-3 rounded-xl border transition-all text-center',
              worst ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default',
              isSelected
                ? `border-amber-400/70 bg-amber-950/40 shadow-amber-500/20 shadow-md`
                : isToday
                ? 'border-purple-500/40 bg-purple-950/20'
                : worst
                ? `border-slate-600/40 bg-slate-800/30 hover:border-slate-500/60`
                : 'border-slate-700/30 bg-slate-900/20',
            ].join(' ')}
          >
            {isToday && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-purple-600 text-[9px] font-bold text-white leading-none">
                TODAY
              </span>
            )}
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isSelected ? 'text-amber-300' : isToday ? 'text-purple-300' : 'text-slate-400'}`}>
              {dayLabel}
            </span>
            <span className={`text-lg font-bold ${isSelected ? 'text-amber-200' : isToday ? 'text-purple-200' : 'text-slate-300'}`}>
              {dayNum}
            </span>
            {/* Storm indicator */}
            {worst ? (
              <span className={`w-2 h-2 rounded-full ${INTENSITY[worst].dayDot}`} />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500/40" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Single storm card ────────────────────────────────────────────────────────

function StormCard({ storm, mbtiType, index }: { storm: AstroStorm; mbtiType?: string; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = INTENSITY[storm.intensity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className={`rounded-2xl border ${cfg.border} overflow-hidden ${cfg.glow}`}
    >
      {/* ── Card header ── */}
      <div className={`${cfg.headerBg} px-5 py-4`}>
        <div className="flex items-start justify-between gap-3">

          {/* Left block */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2">
              {cfg.icon}
              <span className="font-bold text-white text-[15px] leading-snug">{storm.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-400">
              <span className="font-medium text-slate-300">{formatDisplayDate(storm.date)}</span>
              <span className="flex items-center gap-1">
                {LIFE_AREA_ICON[storm.lifeArea] ?? <Globe className="w-3.5 h-3.5" />}
                {storm.lifeArea}
              </span>
              <span>orb {storm.orb}°</span>
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {storm.keywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-full text-[11px] bg-slate-700/50 text-slate-400 border border-slate-600/30">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-600/60 transition-colors text-slate-300"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Expandable detail body ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={`${cfg.bodyBg} px-5 pt-4 pb-5 space-y-4`}>

              {/* What this mean */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  What This Storm Means
                </p>
                <p className="text-[13px] text-slate-300 leading-relaxed">{storm.description}</p>
              </div>

              {/* Transiting vs natal detail */}
              <div className="flex flex-wrap gap-3 text-[12px]">
                <div className="flex-1 min-w-[140px] rounded-lg bg-slate-800/50 border border-slate-700/40 px-3 py-2">
                  <p className="text-slate-500 mb-0.5">Transiting Planet</p>
                  <p className="text-white font-semibold">{storm.transitingPlanet}</p>
                </div>
                <div className="flex items-center text-slate-500 font-bold self-center">{storm.aspect}</div>
                <div className="flex-1 min-w-[140px] rounded-lg bg-slate-800/50 border border-slate-700/40 px-3 py-2">
                  <p className="text-slate-500 mb-0.5">Natal Planet</p>
                  <p className="text-white font-semibold">{storm.natalPlanet}</p>
                </div>
              </div>

              {/* MBTI Navigation — always shown, styled prominently */}
              <div className={`rounded-xl border ${cfg.navBg} px-4 pt-3 pb-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Compass className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.navTitle}`}>
                    {mbtiType ? `${mbtiType} Navigation Strategy` : 'Navigation Strategy'}
                  </span>
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed">{storm.navigation}</p>
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
    <div className="space-y-4 animate-pulse">
      {/* Week strip skeleton */}
      <div className="grid grid-cols-7 gap-1.5">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-700/30" />
        ))}
      </div>
      {/* Cards */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-slate-700/25 border border-slate-600/20" />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StormsAndNavigations({ report, loading, mbtiType }: StormsAndNavigationsProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="mt-8">
        <SectionHeader loading />
        <StormsSkeleton />
      </div>
    );
  }

  if (!report) return null;

  const { storms, clearDays, weekSummary } = report;
  const severeCount  = storms.filter((s) => s.intensity === 'severe').length;
  const moderateCount = storms.filter((s) => s.intensity === 'moderate').length;
  const mildCount    = storms.filter((s) => s.intensity === 'mild').length;

  // Storms to show: if a date is selected, show only those; else show all
  const visibleStorms = selectedDate
    ? storms.filter((s) => s.date === selectedDate)
    : storms;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mt-8 space-y-6"
    >
      {/* ── Header ── */}
      <SectionHeader
        severeCount={severeCount}
        moderateCount={moderateCount}
        mildCount={mildCount}
        mbtiType={mbtiType}
        hasStorms={storms.length > 0}
      />

      {/* ── What this section does ── */}
      <div className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/40 text-[13px] text-slate-400 leading-relaxed">
        <span className="text-slate-300 font-medium">How to read this: </span>
        This section scans the next 7 days of planetary transits against your natal chart to identify
        astrological "storms" — moments when a transiting planet forms a tense angle to one of your
        natal planets. Each storm is rated by intensity, tied to the life area it activates, and
        paired with navigation guidance tailored to your{' '}
        {mbtiType ? <span className="text-amber-300 font-semibold">{mbtiType}</span> : 'personality'}{' '}
        type. Tap a highlighted day to focus its storms.
      </div>

      {/* ── 7-day weather strip ── */}
      <WeekStrip
        storms={storms}
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(selectedDate === d ? null : d)}
      />

      {/* ── Week summary prose ── */}
      {weekSummary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="px-5 py-4 rounded-xl bg-slate-900/60 border border-slate-700/40"
        >
          <p className="text-[13px] text-slate-300 leading-relaxed">{weekSummary}</p>
        </motion.div>
      )}

      {/* ── Selected day header ── */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            key="sel-header"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between"
          >
            <p className="text-sm font-semibold text-amber-300">
              {formatDisplayDate(selectedDate)} — {visibleStorms.length} storm{visibleStorms.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
            >
              Show all
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── No storms ── */}
      {storms.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-12 text-slate-500"
        >
          <ShieldCheck className="w-12 h-12 text-emerald-500/50" />
          <p className="text-sm">No significant storms detected in the week ahead.</p>
          <p className="text-xs text-slate-600">Your chart is in relatively calm waters.</p>
        </motion.div>
      )}

      {/* ── Storm cards ── */}
      {visibleStorms.length > 0 && (
        <div className="space-y-3">
          {visibleStorms.map((storm, i) => (
            <StormCard key={storm.id} storm={storm} mbtiType={mbtiType} index={i} />
          ))}
        </div>
      )}

      {/* ── Clear days footer ── */}
      {clearDays.length > 0 && storms.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-slate-400">Storm-free days:</span>
          {clearDays.map((d) => (
            <span
              key={d}
              className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
            >
              {d}
            </span>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  loading,
  severeCount,
  moderateCount,
  mildCount,
  mbtiType,
  hasStorms,
}: {
  loading?: boolean;
  severeCount?: number;
  moderateCount?: number;
  mildCount?: number;
  mbtiType?: string;
  hasStorms?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-1">
      <CloudLightning className="w-5 h-5 text-amber-400 flex-shrink-0" />
      <h3 className="text-xl font-bold text-amber-300">Storms &amp; Navigation</h3>

      {loading && (
        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Scanning week ahead…
        </span>
      )}

      {!loading && !hasStorms && (
        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          Clear skies
        </span>
      )}

      {!loading && hasStorms && (
        <div className="flex gap-1.5">
          {(severeCount ?? 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-300 border border-red-500/25">
              {severeCount} severe
            </span>
          )}
          {(moderateCount ?? 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-300 border border-amber-500/25">
              {moderateCount} moderate
            </span>
          )}
          {(mildCount ?? 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-300 border border-blue-500/25">
              {mildCount} mild
            </span>
          )}
        </div>
      )}

      {mbtiType && !loading && (
        <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-300 border border-purple-500/25">
          ✦ {mbtiType} navigation
        </span>
      )}
    </div>
  );
}
