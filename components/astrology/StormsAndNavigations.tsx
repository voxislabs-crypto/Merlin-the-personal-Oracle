'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CloudLightning,
  Heart,
  HeartPulse,
  ListChecks,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import { TransitAspectLabel } from '@/components/astrology/PlanetLabel';
import {
  buildStormDayMarkers,
  HorizonDateStrip,
} from '@/components/dashboard/HorizonDateStrip';
import {
  applyDualStormPlaybook,
  STORM_CATEGORY_META,
  STORM_CATEGORY_ORDER,
  type StormLifeCategory,
} from '@/lib/astrology/storm-playbook';
import type { AstroStorm, StormsReport } from '@/hooks/useStorms';

interface StormsAndNavigationsProps {
  report: StormsReport | null;
  loading?: boolean;
  mbtiType?: string;
  /** Core (firmware) — playbook moves soothe this */
  coreType?: string;
  /** Mask (hardware) — playbook moves coach this */
  maskType?: string;
  /** Controlled date (YYYY-MM-DD) or 'all' — shared with timeline */
  selectedDate?: string;
  onSelectedDateChange?: (dateOrAll: string) => void;
  /** Hide internal header when embedded under a shared radar title */
  embedded?: boolean;
}

/** Collapse same transit listed on multiple days → one card + related dates */
function dedupeStormsBySignature(storms: AstroStorm[]): Array<
  AstroStorm & { relatedDates: string[] }
> {
  const groups = new Map<string, AstroStorm[]>();
  for (const s of storms) {
    const key = `${s.transitingPlanet}|${s.aspect}|${s.natalPlanet}`.toLowerCase();
    const list = groups.get(key) || [];
    list.push(s);
    groups.set(key, list);
  }

  const rank = (s: AstroStorm) => {
    const i = s.intensity === 'severe' ? 30 : s.intensity === 'moderate' ? 20 : 10;
    return i + (s.confidence || 0) + (s.phase === 'peak' ? 5 : 0);
  };

  const out: Array<AstroStorm & { relatedDates: string[] }> = [];
  Array.from(groups.values()).forEach((list) => {
    const sorted = [...list].sort((a, b) => rank(b) - rank(a));
    const primary = sorted[0];
    const relatedDates = Array.from(new Set(list.map((x: AstroStorm) => x.date))).sort();
    out.push({ ...primary, relatedDates });
  });

  // Soonest first among primaries
  out.sort((a, b) => {
    const da = a.when?.daysUntil ?? 99;
    const db = b.when?.daysUntil ?? 99;
    if (da !== db) return da - db;
    return (b.confidence || 0) - (a.confidence || 0);
  });
  return out;
}

function localTodayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

const INTENSITY_BADGE: Record<
  AstroStorm['intensity'],
  { label: string; className: string }
> = {
  severe: {
    label: 'High',
    className: 'border-rose-400/45 bg-rose-500/20 text-rose-100',
  },
  moderate: {
    label: 'Elevated',
    className: 'border-amber-400/45 bg-amber-500/20 text-amber-100',
  },
  mild: {
    label: 'Mild',
    className: 'border-sky-400/40 bg-sky-500/15 text-sky-100',
  },
};

const CATEGORY_ICON: Record<StormLifeCategory, React.ReactNode> = {
  social: <Heart className="h-4 w-4" />,
  work: <Briefcase className="h-4 w-4" />,
  financial: <Wallet className="h-4 w-4" />,
  health: <HeartPulse className="h-4 w-4" />,
};

function SignalStrengthMeter({ value, hex }: { value: number; hex: string }) {
  return (
    <div className="min-w-[7.5rem]">
      <div className="mb-0.5 flex items-center justify-between text-[10px] uppercase tracking-[0.12em]">
        <span className="text-slate-500" title="How solid this window read is — not a fate score">
          Signal strength
        </span>
        <span className="font-semibold tabular-nums" style={{ color: hex }}>
          {Math.round(value)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.max(6, Math.min(100, value))}%`,
            backgroundColor: hex,
          }}
        />
      </div>
    </div>
  );
}

function StormPlaybookCard({
  storm,
  index,
  defaultOpen,
  relatedDates,
}: {
  storm: AstroStorm;
  index: number;
  defaultOpen?: boolean;
  relatedDates?: string[];
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const meta = STORM_CATEGORY_META[storm.category] || STORM_CATEGORY_META.work;
  const intensity = INTENSITY_BADGE[storm.intensity];
  const when = storm.when;
  const steps = storm.actionableSteps || [];
  const avoids = storm.avoidSteps || [];
  const extraDates = (relatedDates || []).filter((d) => d !== storm.date);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`overflow-hidden rounded-2xl border ${meta.borderClass} ${meta.bgClass} shadow-lg shadow-black/20`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <div className="mt-0.5 shrink-0 rounded-lg border border-white/10 bg-black/30 p-2" style={{ color: meta.hex }}>
          {CATEGORY_ICON[storm.category]}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-50 sm:text-base">
              {storm.plainTitle || storm.title}
            </h4>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${intensity.className}`}>
              {intensity.label}
            </span>
            {storm.secondaryCategory ? (
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                also {STORM_CATEGORY_META[storm.secondaryCategory].shortLabel}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="inline-flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-medium text-slate-100">
                {when?.relativeLabel || storm.dayName}
              </span>
              <span className="text-slate-500">·</span>
              <span>{when?.dateLabel || storm.date}</span>
              {when?.phase && when.phase !== 'unknown' ? (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="capitalize text-slate-400">{when.phase}</span>
                </>
              ) : null}
              {extraDates.length > 0 ? (
                <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-slate-400">
                  also {extraDates.length} other day{extraDates.length === 1 ? '' : 's'}
                </span>
              ) : null}
            </p>
            <SignalStrengthMeter value={storm.confidence ?? 55} hex={meta.hex} />
          </div>

          <p className="text-xs leading-relaxed text-slate-300 line-clamp-2">
            {storm.plainExpect || storm.description}
          </p>
          {steps[0] ? (
            <p className="text-xs font-medium text-emerald-200/90 line-clamp-1">
              <span className="text-emerald-400/80">Move · </span>
              {steps[0]}
            </p>
          ) : null}
        </div>

        <span className="mt-1 shrink-0 text-slate-500">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="space-y-4 px-4 py-4">
              {/* When detail */}
              <div className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  When
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  {when?.summary || `${storm.dayName} ${storm.date}`}
                </p>
                {when?.windowLabel ? (
                  <p className="mt-1 text-xs text-slate-400">{when.windowLabel}</p>
                ) : null}
                {extraDates.length > 0 ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Same pressure also scores on:{' '}
                    <span className="text-slate-200">
                      {extraDates
                        .map((d) =>
                          new Date(`${d}T12:00:00`).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })
                        )
                        .join(' · ')}
                    </span>
                  </p>
                ) : null}
              </div>

              {/* Driver + expect */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    What this feels like
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-100">
                    {storm.plainExpect || storm.description}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Weather window — not a verdict on you. Prefer reversible moves.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Sky driver · optional depth
                  </p>
                  <div className="mt-1.5 text-sm">
                    <TransitAspectLabel
                      label={storm.title}
                      transiting={storm.transitingPlanet}
                      aspect={storm.aspect}
                      natal={storm.natalPlanet}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    orb {storm.orb}° · {storm.lifeArea}
                  </p>
                </div>
              </div>

              {/* Action steps */}
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/25 px-3.5 py-3">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
                  <ListChecks className="h-3.5 w-3.5" />
                  How to navigate
                </p>
                <ol className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-slate-100">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{ backgroundColor: `${meta.hex}33`, color: meta.hex }}
                      >
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
                {storm.personalityReaction ? (
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    <span className="font-semibold text-slate-300">Likely reaction: </span>
                    {storm.personalityReaction}
                  </p>
                ) : null}
              </div>

              {/* Avoid */}
              {avoids.length > 0 ? (
                <div className="rounded-xl border border-rose-400/20 bg-rose-950/20 px-3.5 py-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-300/80">
                    <XCircle className="h-3.5 w-3.5" />
                    Skip this
                  </p>
                  <ul className="space-y-1.5">
                    {avoids.map((line, i) => (
                      <li key={i} className="flex gap-2 text-sm text-rose-50/90">
                        <span className="text-rose-400/80">•</span>
                        <span className="leading-relaxed">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function CategorySection({
  category,
  storms,
  startIndex,
}: {
  category: StormLifeCategory;
  storms: Array<AstroStorm & { relatedDates?: string[] }>;
  startIndex: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!storms.length) return null;
  const meta = STORM_CATEGORY_META[category];
  const topSignal = Math.max(...storms.map((s) => s.confidence || 0));
  const INITIAL = 2;
  const shown = expanded ? storms : storms.slice(0, INITIAL);
  const hidden = Math.max(0, storms.length - INITIAL);

  return (
    <section className="space-y-3" id={`storm-cat-${category}`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2" style={{ color: meta.hex }}>
            {CATEGORY_ICON[category]}
            <h3 className="text-lg font-bold tracking-tight">{meta.label}</h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{meta.blurb}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${meta.badgeClass}`}>
            {storms.length} window{storms.length === 1 ? '' : 's'}
          </span>
          <span className="tabular-nums" title="Strongest signal in this category">
            top signal {topSignal}%
          </span>
        </div>
      </div>
      <div className="space-y-2.5">
        {shown.map((storm, i) => (
          <StormPlaybookCard
            key={storm.id}
            storm={storm}
            index={startIndex + i}
            relatedDates={storm.relatedDates}
            defaultOpen={false}
          />
        ))}
      </div>
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-sky-300 underline-offset-2 hover:underline"
        >
          {expanded ? 'Show fewer' : `Show ${hidden} more in ${meta.shortLabel || meta.label}`}
        </button>
      ) : null}
    </section>
  );
}

function StormsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-700/30" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-slate-700/25 border border-slate-600/20" />
      ))}
    </div>
  );
}

/**
 * Storm Playbook UI — date strip · category · confidence · when · steps.
 */
export function StormsAndNavigations({
  report,
  loading,
  mbtiType,
  coreType,
  maskType,
  selectedDate: controlledDate,
  onSelectedDateChange,
  embedded = false,
}: StormsAndNavigationsProps) {
  const [filter, setFilter] = useState<StormLifeCategory | 'all'>('all');
  const [internalDate, setInternalDate] = useState<string>('all');

  const selectedDate = controlledDate ?? internalDate;
  const setSelectedDate = (value: string) => {
    if (onSelectedDateChange) onSelectedDateChange(value);
    else setInternalDate(value);
  };

  const core = coreType || mbtiType;
  const storms = useMemo(
    () =>
      (report?.storms || []).map((storm) =>
        applyDualStormPlaybook(storm, core, maskType || core),
      ),
    [core, maskType, report?.storms],
  );
  const horizon = report?.horizonDays ?? 30;

  const dayMarkers = useMemo(
    () => buildStormDayMarkers(storms, report?.clearDays || []),
    [storms, report?.clearDays]
  );

  // Default selection: today if it has storms, else first storm day
  useEffect(() => {
    if (controlledDate !== undefined) return;
    if (internalDate !== 'all') return;
    if (dayMarkers.length === 0) return;
    const today = localTodayIso();
    const todayHas = dayMarkers.some((d) => d.date === today && (d.count || 0) > 0);
    if (todayHas) setInternalDate(today);
  }, [controlledDate, dayMarkers, internalDate]);

  /** Date-filtered list (or all), then dedupe multi-day repeats when viewing All */
  const visibleStorms = useMemo(() => {
    const forDate =
      selectedDate === 'all' ? storms : storms.filter((s) => s.date === selectedDate);

    if (selectedDate === 'all') {
      return dedupeStormsBySignature(forDate);
    }
    // Single day: still collapse exact same signature if engine double-fired
    return dedupeStormsBySignature(forDate);
  }, [storms, selectedDate]);

  const byCategory = useMemo(() => {
    const empty: Record<StormLifeCategory, Array<AstroStorm & { relatedDates?: string[] }>> = {
      social: [],
      work: [],
      financial: [],
      health: [],
    };
    for (const s of visibleStorms) {
      const cat = s.category || 'work';
      if (empty[cat]) empty[cat].push(s);
    }
    return empty;
  }, [visibleStorms]);

  const counts = useMemo(
    () =>
      STORM_CATEGORY_ORDER.map((cat) => ({
        cat,
        count: byCategory[cat]?.length || 0,
        meta: STORM_CATEGORY_META[cat],
      })),
    [byCategory]
  );

  const visibleCategories = useMemo(() => {
    if (filter === 'all') {
      return STORM_CATEGORY_ORDER.filter((c) => (byCategory[c]?.length || 0) > 0);
    }
    return (byCategory[filter]?.length || 0) > 0 ? [filter] : [];
  }, [filter, byCategory]);

  if (loading) {
    return (
      <div className="space-y-4">
        {!embedded ? (
          <div className="flex items-center gap-2">
            <CloudLightning className="h-5 w-5 text-amber-400" />
            <h3 className="text-xl font-bold text-amber-300">Storm playbook</h3>
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
              Scanning horizon…
            </span>
          </div>
        ) : null}
        <StormsSkeleton />
      </div>
    );
  }

  if (!report) return null;

  const severeCount = visibleStorms.filter((s) => s.intensity === 'severe').length;
  const rawCount = storms.length;
  const uniqueCount = visibleStorms.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {!embedded ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CloudLightning className="h-5 w-5 text-amber-400" />
              <h3 className="text-xl font-bold text-amber-300">Storm playbook</h3>
              {severeCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-100">
                  <AlertTriangle className="h-3 w-3" />
                  {severeCount} high-intensity
                </span>
              ) : null}
            </div>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Next {horizon} days · pick a day to focus · same transit across days is merged
              {mbtiType ? (
                <>
                  {' '}
                  · tuned for <span className="font-semibold text-amber-300/90">{mbtiType}</span>
                </>
              ) : null}
              .
            </p>
          </div>
        </div>
      ) : null}

      {/* Clickable dates */}
      {dayMarkers.length > 0 ? (
        <HorizonDateStrip
          days={dayMarkers}
          selected={selectedDate}
          onSelect={setSelectedDate}
          showAll
        />
      ) : null}

      {/* Category chips (counts for current date filter) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-xl border px-3 py-2.5 text-left transition ${
            filter === 'all'
              ? 'border-amber-400/45 bg-amber-500/15 text-amber-100'
              : 'border-white/10 bg-slate-900/50 text-slate-300 hover:border-white/20'
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {selectedDate === 'all' ? 'Unique' : 'This day'}
          </p>
          <p className="text-lg font-bold tabular-nums">{uniqueCount}</p>
          {selectedDate === 'all' && rawCount !== uniqueCount ? (
            <p className="text-[10px] text-slate-500">{rawCount} raw hits</p>
          ) : null}
        </button>
        {counts.map(({ cat, count, meta }) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(filter === cat ? 'all' : cat)}
            className={`rounded-xl border px-3 py-2.5 text-left transition ${
              filter === cat
                ? meta.badgeClass
                : 'border-white/10 bg-slate-900/50 text-slate-300 hover:border-white/20'
            }`}
            style={filter === cat ? { boxShadow: `0 0 0 1px ${meta.hex}44` } : undefined}
          >
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] opacity-80">
              <span style={{ color: meta.hex }}>{CATEGORY_ICON[cat]}</span>
              {meta.shortLabel}
            </p>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: count ? meta.hex : undefined }}
            >
              {count}
            </p>
          </button>
        ))}
      </div>

      {report.weekSummary && selectedDate === 'all' ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-sm leading-relaxed text-slate-300">
          {report.weekSummary}
        </div>
      ) : null}

      {selectedDate !== 'all' ? (
        <p className="text-xs text-slate-400">
          Showing storms for{' '}
          <span className="font-semibold text-slate-200">
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          {' · '}
          <button
            type="button"
            className="text-sky-300 underline-offset-2 hover:underline"
            onClick={() => setSelectedDate('all')}
          >
            Show all dates
          </button>
        </p>
      ) : null}

      {storms.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
          <ShieldCheck className="h-12 w-12 text-emerald-500/50" />
          <p className="text-sm text-slate-300">No significant storms on this horizon.</p>
          <p className="text-xs">
            Use the calm — ship one meaningful thing before the next weather system.
          </p>
        </div>
      ) : null}

      {visibleStorms.length === 0 && storms.length > 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-6 text-center">
          <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-emerald-400/70" />
          <p className="text-sm text-emerald-100">Clear on this day</p>
          <p className="mt-1 text-xs text-slate-400">No storm scores for the selected date.</p>
        </div>
      ) : null}

      {visibleCategories.length === 0 && visibleStorms.length > 0 ? (
        <p className="text-sm text-slate-400">No storms in this category for the selection.</p>
      ) : null}

      <div className="space-y-8">
        {visibleCategories.map((cat, sectionIdx) => (
          <CategorySection
            key={cat}
            category={cat}
            storms={byCategory[cat] || []}
            startIndex={sectionIdx * 3}
          />
        ))}
      </div>
    </motion.div>
  );
}
