'use client';

import { Eye, Theater, Sparkles, Orbit } from 'lucide-react';
import type { DualOverlay } from '@/lib/personality/dual-overlay';
import {
  getPlanetPersonalityInsight,
  type PersonalityLens,
} from '@/lib/astrology/planet-personality-bridge';

interface PlanetPersonalityHintProps {
  planetName: string;
  dualOverlay?: DualOverlay | null;
}

const LENS_STYLES: Record<
  PersonalityLens,
  { icon: typeof Theater; border: string; bg: string; text: string }
> = {
  mask: {
    icon: Theater,
    border: 'border-orange-400/35',
    bg: 'bg-orange-500/10',
    text: 'text-orange-100',
  },
  core: {
    icon: Eye,
    border: 'border-violet-400/35',
    bg: 'bg-violet-500/10',
    text: 'text-violet-100',
  },
  bridge: {
    icon: Sparkles,
    border: 'border-rose-400/35',
    bg: 'bg-rose-500/10',
    text: 'text-rose-100',
  },
  outer: {
    icon: Orbit,
    border: 'border-cyan-400/35',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-100',
  },
};

export function PlanetPersonalityHint({ planetName, dualOverlay }: PlanetPersonalityHintProps) {
  const insight = getPlanetPersonalityInsight(planetName, dualOverlay);
  const style = LENS_STYLES[insight.lens];
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border px-4 py-3 ${style.border} ${style.bg}`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.text}`} />
        <div>
          <p className={`text-sm font-semibold ${style.text}`}>{insight.headline}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{insight.detail}</p>
        </div>
      </div>
    </div>
  );
}