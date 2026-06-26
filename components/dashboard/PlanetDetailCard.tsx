'use client';

import { motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import type { PlanetPosition } from '@/types/astrology';
import { PLANET_GLYPHS } from '@/lib/astrology/planetaryData';
import { ELEMENT_COLORS, getSignMeta } from '@/lib/astrology/zodiac';
import { getPlanetPlacementInterpretation, ordinalHouse } from '@/lib/astrology/planet-placement';

interface PlanetDetailCardProps {
  planet: PlanetPosition;
  interpretation?: string | null;
  onClear: () => void;
  onAskContext?: (label: string, prompt: string) => void;
}

export function PlanetDetailCard({
  planet,
  interpretation,
  onClear,
  onAskContext,
}: PlanetDetailCardProps) {
  const signMeta = getSignMeta(planet.sign);
  const element = signMeta?.element ?? 'Fire';
  const colors = ELEMENT_COLORS[element];
  const glyph = PLANET_GLYPHS[planet.name] ?? '●';
  const summary =
    interpretation?.trim() ||
    getPlanetPlacementInterpretation(planet.name, planet.sign, planet.house);
  const contextLabel = `${planet.name} in ${planet.sign}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-xl border p-5 shadow-lg ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-4xl leading-none ${colors.text}`} aria-hidden>
            {glyph}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Planet</p>
            <h4 className={`text-2xl font-bold truncate ${colors.text}`}>{planet.name}</h4>
            <span
              className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.border} ${colors.text}`}
            >
              {element} · {signMeta?.glyph} {planet.sign}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg border border-slate-600/50 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          aria-label="Clear planet selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Sign" value={`${signMeta?.glyph ?? ''} ${planet.sign}`} />
        <Stat
          label="House"
          value={planet.house ? ordinalHouse(planet.house) : '—'}
        />
        <Stat
          label="Degree"
          value={`${Math.floor(planet.degree)}°${planet.minute ? ` ${planet.minute}'` : ''}${planet.retrograde ? ' ℞' : ''}`}
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-200">{summary}</p>

      {interpretation ? (
        <p className="mt-2 text-[11px] uppercase tracking-wider text-amber-300/70">
          Merlin reading
        </p>
      ) : null}

      {onAskContext ? (
        <button
          type="button"
          onClick={() =>
            onAskContext(
              contextLabel,
              `What does ${planet.name} in ${planet.sign}${planet.house ? ` in the ${ordinalHouse(planet.house)} house` : ''} mean for me in practical terms?`
            )
          }
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20 transition"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Ask Merlin about {planet.name}
        </button>
      ) : null}
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}