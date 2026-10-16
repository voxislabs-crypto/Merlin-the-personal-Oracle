'use client';

import { TodaySignalFeedback } from '@/components/dashboard/TodaySignalFeedback';
import {
  FUTURE_SIGHT_CLARITY,
  FUTURE_SIGHT_HORIZON_LABEL,
  futureSightFromRisk,
} from '@/lib/atmosphere/future-sight';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';

/**
 * Collapsed near-term themes. The Today brief stays the primary view.
 * Resonance and usefulness sit here. Accuracy waits for a stored observable.
 */
export function FutureSightSection({
  risk,
  userId,
  date,
}: {
  risk?: LifeRiskPacket | null;
  userId?: string | null;
  date?: string;
}) {
  const items = futureSightFromRisk(risk);
  if (items.length === 0) return null;

  return (
    <details className="rounded-xl border border-white/10 bg-black/20 px-3.5 py-3">
      <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 hover:text-slate-300">
        Next few days
      </summary>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Possible themes from the near-term signals. Something to watch.
      </p>
      <ul className="mt-3 space-y-4">
        {items.map((item) => (
          <li key={item.horizon} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              {FUTURE_SIGHT_HORIZON_LABEL[item.horizon]} · {item.domain}
            </p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Possible theme
            </p>
            <p className="mt-1 text-sm leading-snug text-slate-100">{item.theme}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Signals used
            </p>
            <ul className="mt-1 space-y-0.5">
              {item.evidence.map((line) => (
                <li key={line} className="text-xs leading-snug text-slate-300">
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100/80">
              Something to watch
            </p>
            <p className="mt-1 text-sm leading-snug text-slate-200">{item.watchFor}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              One optional step
            </p>
            <p className="mt-1 text-sm leading-snug text-slate-300">{item.prepare}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Another reading
            </p>
            <p className="mt-1 text-sm leading-snug text-slate-400">{item.alternative}</p>
            <p className="mt-2 text-xs text-slate-500">{FUTURE_SIGHT_CLARITY[item.uncertainty]}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <TodaySignalFeedback
          userId={userId}
          itemId={`future-sight-${date || 'today'}`}
          theme="future-sight"
        />
      </div>
    </details>
  );
}
