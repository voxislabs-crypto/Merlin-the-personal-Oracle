'use client';

import { useMemo, useRef, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HorizonDayMarker = {
  date: string; // YYYY-MM-DD
  /** Storm / event count that day */
  count?: number;
  /** max intensity that day */
  intensity?: 'severe' | 'moderate' | 'mild' | 'clear';
  label?: string;
};

export interface HorizonDateStripProps {
  days: HorizonDayMarker[];
  /** YYYY-MM-DD or 'all' */
  selected: string;
  onSelect: (dateOrAll: string) => void;
  /** Show All chip */
  showAll?: boolean;
  className?: string;
  /** Compact for nested panels */
  compact?: boolean;
}

function localToday(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function weekday(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
}

function dayNum(date: string): string {
  return String(new Date(`${date}T12:00:00`).getDate());
}

function monthShort(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' });
}

const INTENSITY_DOT: Record<string, string> = {
  severe: 'bg-rose-500 shadow-rose-500/40',
  moderate: 'bg-amber-400 shadow-amber-400/30',
  mild: 'bg-sky-400 shadow-sky-400/30',
  clear: 'bg-emerald-500/70',
};

/**
 * Horizontal clickable date navigator for storm / timeline horizons.
 */
export function HorizonDateStrip({
  days,
  selected,
  onSelect,
  showAll = true,
  className = '',
  compact = false,
}: HorizonDateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = localToday();

  const sorted = useMemo(
    () => [...days].sort((a, b) => a.date.localeCompare(b.date)),
    [days]
  );

  // Scroll selected day into view
  useEffect(() => {
    if (!scrollRef.current || selected === 'all') return;
    const el = scrollRef.current.querySelector(`[data-date="${selected}"]`) as HTMLElement | null;
    if (!el) return;
    const container = scrollRef.current;
    const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [selected, sorted.length]);

  if (sorted.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        <CalendarDays className="h-3.5 w-3.5" />
        Pick a day
        {selected !== 'all' ? (
          <span className="normal-case tracking-normal font-medium text-slate-300">
            · {weekday(selected)} {monthShort(selected)} {dayNum(selected)}
          </span>
        ) : (
          <span className="normal-case tracking-normal font-medium text-slate-400">· all dates</span>
        )}
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-slate-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-slate-950 to-transparent" />

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-transparent"
          role="tablist"
          aria-label="Horizon dates"
        >
          {showAll ? (
            <button
              type="button"
              role="tab"
              aria-selected={selected === 'all'}
              onClick={() => onSelect('all')}
              className={cn(
                'shrink-0 rounded-xl border px-3 transition',
                compact ? 'py-1.5' : 'py-2',
                selected === 'all'
                  ? 'border-amber-400/50 bg-amber-500/15 text-amber-100'
                  : 'border-white/10 bg-slate-900/60 text-slate-400 hover:border-white/20 hover:text-slate-200'
              )}
            >
              <p className="text-[10px] uppercase tracking-wide opacity-80">All</p>
              <p className="text-sm font-bold tabular-nums">{sorted.length}d</p>
            </button>
          ) : null}

          {sorted.map((day) => {
            const isSelected = selected === day.date;
            const isToday = day.date === today;
            const intensity = day.intensity || (day.count && day.count > 0 ? 'mild' : 'clear');
            const count = day.count ?? 0;

            return (
              <button
                key={day.date}
                type="button"
                role="tab"
                data-date={day.date}
                aria-selected={isSelected}
                onClick={() => onSelect(day.date)}
                className={cn(
                  'relative shrink-0 rounded-xl border px-2.5 text-center transition min-w-[3.25rem]',
                  compact ? 'py-1.5' : 'py-2',
                  isSelected
                    ? 'border-sky-400/55 bg-sky-500/15 text-sky-50 shadow-md shadow-sky-950/40'
                    : isToday
                      ? 'border-violet-400/35 bg-violet-500/10 text-violet-100 hover:border-violet-400/50'
                      : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:bg-slate-800/70'
                )}
              >
                <p className="text-[10px] uppercase tracking-wide opacity-75">{weekday(day.date)}</p>
                <p className={cn('font-bold tabular-nums leading-tight', compact ? 'text-sm' : 'text-base')}>
                  {dayNum(day.date)}
                </p>
                <p className="text-[9px] text-slate-500">{monthShort(day.date)}</p>

                {/* Intensity / count markers */}
                <div className="mt-1 flex items-center justify-center gap-0.5">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shadow',
                      INTENSITY_DOT[intensity] || INTENSITY_DOT.clear
                    )}
                    title={intensity}
                  />
                  {count > 0 ? (
                    <span className="text-[9px] font-semibold tabular-nums text-slate-400">
                      {count}
                    </span>
                  ) : null}
                </div>

                {isToday ? (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-1 text-[8px] font-bold uppercase text-white">
                    now
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Build markers from storm-like items with a date field */
export function buildStormDayMarkers(
  storms: Array<{
    date: string;
    intensity?: 'severe' | 'moderate' | 'mild';
  }>,
  extraClearDates: string[] = []
): HorizonDayMarker[] {
  const map = new Map<string, HorizonDayMarker>();

  const rank = (i?: string) =>
    i === 'severe' ? 3 : i === 'moderate' ? 2 : i === 'mild' ? 1 : 0;

  for (const s of storms) {
    if (!s.date) continue;
    const prev = map.get(s.date);
    if (!prev) {
      map.set(s.date, {
        date: s.date,
        count: 1,
        intensity: s.intensity || 'mild',
      });
    } else {
      prev.count = (prev.count || 0) + 1;
      if (rank(s.intensity) > rank(prev.intensity)) {
        prev.intensity = s.intensity;
      }
    }
  }

  for (const d of extraClearDates) {
    // clearDays may be day names not ISO — only add ISO dates
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    if (!map.has(d)) {
      map.set(d, { date: d, count: 0, intensity: 'clear' });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
