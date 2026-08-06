'use client';

import { Brain, MessageSquare, Battery, AlertTriangle, Sparkles, Scale } from 'lucide-react';
import type { IdentityOperatingTrait } from '@/lib/self/types';

const ICONS: Record<string, typeof Brain> = {
  decision: Scale,
  stress: AlertTriangle,
  communication: MessageSquare,
  recharge: Battery,
  blind_spots: AlertTriangle,
  strengths: Sparkles,
};

export interface DefaultOperatingSystemProps {
  traits: IdentityOperatingTrait[];
  className?: string;
}

/**
 * Evergreen identity OS — does not change with daily transits.
 */
export function DefaultOperatingSystem({ traits, className = '' }: DefaultOperatingSystemProps) {
  if (!traits.length) return null;

  return (
    <section
      className={`rounded-2xl border border-amber-400/25 bg-gradient-to-br from-slate-950/80 via-amber-950/20 to-slate-950/80 p-4 md:p-5 ${className}`}
      aria-labelledby="default-os-heading"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300/80">
            Stable · not weather
          </p>
          <h3 id="default-os-heading" className="mt-0.5 text-lg font-bold text-amber-50">
            Your default operating system
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            How you decide, stress, talk, and recharge — evergreen. Transits change intensity, not this map.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {traits.map((trait) => {
          const Icon = ICONS[trait.id] || Brain;
          return (
            <li
              key={trait.id}
              className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-3"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 rounded-lg border border-amber-400/20 bg-amber-500/10 p-1.5">
                  <Icon className="h-3.5 w-3.5 text-amber-200" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {trait.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-100">{trait.value}</p>
                  {trait.detail ? (
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{trait.detail}</p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
