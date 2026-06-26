'use client';

import { motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import type { PlanetPosition } from '@/types/astrology';
import { PLANET_GLYPHS } from '@/lib/astrology/planetaryData';
import {
  ELEMENT_COLORS,
  getSignMeta,
  SIGN_TRAITS,
  type ZodiacSignName,
} from '@/lib/astrology/zodiac';
import { ordinalHouse } from '@/lib/astrology/planet-placement';

interface SignDetailCardProps {
  signName: ZodiacSignName;
  planets: PlanetPosition[];
  onClear: () => void;
  onPlanetSelect?: (name: string) => void;
  onAskContext?: (label: string, prompt: string) => void;
}

export function SignDetailCard({
  signName,
  planets,
  onClear,
  onPlanetSelect,
  onAskContext,
}: SignDetailCardProps) {
  const signMeta = getSignMeta(signName);
  const traits = SIGN_TRAITS[signName];
  const element = signMeta?.element ?? 'Fire';
  const colors = ELEMENT_COLORS[element];
  const planetsInSign = planets.filter((p) => p.sign === signName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-xl border p-5 shadow-lg ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Zodiac sign</p>
          <h4 className={`text-2xl font-bold ${colors.text}`}>
            {signMeta?.glyph} {signName}
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge label={element} colors={colors} />
            {signMeta?.modality ? <Badge label={signMeta.modality} colors={colors} /> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg border border-slate-600/50 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          aria-label="Clear sign selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {traits.keywords.map((keyword) => (
          <span
            key={keyword}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.border} ${colors.text}`}
          >
            {keyword}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-200">{traits.summary}</p>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Planets in {signName}</p>
        {planetsInSign.length ? (
          <div className="flex flex-wrap gap-2">
            {planetsInSign.map((planet) => (
              <button
                key={planet.name}
                type="button"
                onClick={() => onPlanetSelect?.(planet.name)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${colors.border} bg-black/20 text-slate-100 hover:bg-black/35`}
              >
                <span>{PLANET_GLYPHS[planet.name] ?? '●'}</span>
                <span>{planet.name}</span>
                {planet.house ? (
                  <span className="text-slate-400">· {ordinalHouse(planet.house)}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic rounded-lg border border-dashed border-white/10 bg-black/15 px-3 py-2">
            No natal planets here — this sign colors your chart through house cusps and transits, not personal placements.
          </p>
        )}
      </div>

      {onAskContext ? (
        <button
          type="button"
          onClick={() =>
            onAskContext(
              `${signName} sign`,
              `What does ${signName} energy mean in my chart${planetsInSign.length ? ` with ${planetsInSign.map((p) => p.name).join(', ')} placed here` : ''}?`
            )
          }
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20 transition"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Ask Merlin about {signName}
        </button>
      ) : null}
    </motion.div>
  );
}

function Badge({
  label,
  colors,
}: {
  label: string;
  colors: { border: string; text: string };
}) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.border} ${colors.text}`}
    >
      {label}
    </span>
  );
}