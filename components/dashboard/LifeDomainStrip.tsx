'use client';

import type { DomainStripItem } from '@/lib/atmosphere/domain-strip';

export interface LifeDomainStripProps {
  items: DomainStripItem[];
  riskPercent?: number | null;
  className?: string;
}

function trendClass(trend: DomainStripItem['trend']): string {
  if (trend === 'up') return 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10';
  if (trend === 'down') return 'text-rose-300 border-rose-400/30 bg-rose-500/10';
  return 'text-slate-300 border-white/10 bg-white/5';
}

/**
 * Glanceable domain clarity: Relationships ▲ · Career ▬ · Friction 12%
 */
export function LifeDomainStrip({ items, riskPercent, className = '' }: LifeDomainStripProps) {
  if (!items.length && riskPercent == null) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 ${className}`}>
      {items.map((item) => (
        <span
          key={item.id}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium sm:text-xs ${trendClass(item.trend)}`}
          title={`${item.label}: friction ${item.friction}, support ${item.support}`}
        >
          <span className="text-slate-400">{item.label}</span>
          <span className="font-semibold tabular-nums" aria-label={`${item.label} ${item.trend}`}>
            {item.arrow}
          </span>
        </span>
      ))}
      {typeof riskPercent === 'number' ? (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-100 sm:text-xs"
          title="Hard-aspect load for this window — not the Storm Watch alarm"
        >
          <span className="text-sky-300/80 font-medium">Friction</span>
          <span className="tabular-nums">{riskPercent}%</span>
        </span>
      ) : null}
    </div>
  );
}
