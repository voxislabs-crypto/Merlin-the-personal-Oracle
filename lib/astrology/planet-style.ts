/**
 * Planetary elemental styling — classical dignity elements + modern outer-planet mapping.
 * Used for colored planet names and hover cards across life weather / risk UI.
 */

import { PLANET_GLYPHS } from '@/lib/astrology/planetaryData';
import type { ZodiacElement } from '@/lib/astrology/zodiac';
import { ELEMENT_COLORS } from '@/lib/astrology/zodiac';

export type PlanetElement = ZodiacElement;

/** Classical elemental rulers + standard modern outer-planet assignments */
export const PLANET_ELEMENTS: Record<string, PlanetElement> = {
  sun: 'Fire',
  moon: 'Water',
  mercury: 'Air',
  venus: 'Earth',
  mars: 'Fire',
  jupiter: 'Fire',
  saturn: 'Earth',
  uranus: 'Air',
  neptune: 'Water',
  pluto: 'Water',
  chiron: 'Earth',
  lilith: 'Water',
  'north node': 'Fire',
  'true node': 'Fire',
  'south node': 'Earth',
  ascendant: 'Fire',
  rising: 'Fire',
  midheaven: 'Earth',
  mc: 'Earth',
};

/** Richer element tokens for text, glow, and tooltip chrome */
export const ELEMENT_STYLE: Record<
  PlanetElement,
  {
    text: string;
    textStrong: string;
    bg: string;
    border: string;
    glow: string;
    hex: string;
    /** Fully opaque popup fill — readable over any UI behind it */
    popupBg: string;
    popupBorder: string;
    label: string;
  }
> = {
  Fire: {
    text: 'text-orange-300',
    textStrong: 'text-orange-200',
    bg: 'bg-orange-500/15',
    border: 'border-orange-400/45',
    glow: 'shadow-orange-500/25',
    hex: '#fb923c',
    popupBg: '#1a1008',
    popupBorder: '#ea580c',
    label: 'Fire',
  },
  Earth: {
    text: 'text-emerald-300',
    textStrong: 'text-emerald-200',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-400/45',
    glow: 'shadow-emerald-500/20',
    hex: '#34d399',
    popupBg: '#071a12',
    popupBorder: '#059669',
    label: 'Earth',
  },
  Air: {
    text: 'text-sky-300',
    textStrong: 'text-sky-200',
    bg: 'bg-sky-500/15',
    border: 'border-sky-400/45',
    glow: 'shadow-sky-500/20',
    hex: '#38bdf8',
    popupBg: '#07141f',
    popupBorder: '#0284c7',
    label: 'Air',
  },
  Water: {
    text: 'text-violet-300',
    textStrong: 'text-violet-200',
    bg: 'bg-violet-500/15',
    border: 'border-violet-400/45',
    glow: 'shadow-violet-500/25',
    hex: '#a78bfa',
    popupBg: '#12081f',
    popupBorder: '#7c3aed',
    label: 'Water',
  },
};

export const ASPECT_GLYPHS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  square: '□',
  trine: '△',
  sextile: '⚹',
  quincunx: '⚻',
  inconjunct: '⚻',
};

export interface PlanetStyleInfo {
  name: string;
  key: string;
  glyph: string;
  element: PlanetElement;
  elementLabel: string;
  textClass: string;
  textStrongClass: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
  hex: string;
  popupBg: string;
  popupBorder: string;
  /** Accessible tooltip: "Saturn ♄ · Earth" */
  tooltip: string;
}

function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function resolvePlanetStyle(planetName: string): PlanetStyleInfo | null {
  if (!planetName?.trim()) return null;
  const key = normalizeKey(planetName);
  const element = PLANET_ELEMENTS[key];
  if (!element) {
    // Unknown body — still show glyph if we have one, Air as neutral-ish fallback
    const glyph =
      PLANET_GLYPHS[planetName] ||
      PLANET_GLYPHS[planetName.replace(/\b\w/g, (c) => c.toUpperCase())] ||
      '•';
    const display = planetName.trim();
    return {
      name: display,
      key,
      glyph,
      element: 'Air',
      elementLabel: 'Unknown',
      textClass: 'text-slate-300',
      textStrongClass: 'text-slate-200',
      bgClass: 'bg-slate-500/15',
      borderClass: 'border-slate-400/40',
      glowClass: 'shadow-slate-500/10',
      hex: '#94a3b8',
      popupBg: '#0f172a',
      popupBorder: '#64748b',
      tooltip: `${display} ${glyph}`,
    };
  }

  const style = ELEMENT_STYLE[element];
  const display =
    planetName.trim().charAt(0).toUpperCase() + planetName.trim().slice(1);
  // Prefer canonical casing from PLANET_GLYPHS keys when possible
  const canonical =
    Object.keys(PLANET_GLYPHS).find((k) => k.toLowerCase() === key) || display;
  const glyph = PLANET_GLYPHS[canonical] || PLANET_GLYPHS[display] || '•';

  return {
    name: canonical,
    key,
    glyph,
    element,
    elementLabel: style.label,
    textClass: style.text,
    textStrongClass: style.textStrong,
    bgClass: style.bg,
    borderClass: style.border,
    glowClass: style.glow,
    hex: style.hex,
    popupBg: style.popupBg,
    popupBorder: style.popupBorder,
    tooltip: `${canonical} ${glyph} · ${style.label}`,
  };
}

export function resolveAspectGlyph(aspect: string): string {
  const key = aspect.trim().toLowerCase();
  return ASPECT_GLYPHS[key] || aspect;
}

/**
 * Parse titles like "Saturn Square Moon" / "Mars opposition natal Sun"
 */
export function parseTransitPhrase(phrase: string): {
  transiting?: string;
  aspect?: string;
  natal?: string;
  rest?: string;
} | null {
  const cleaned = phrase.replace(/\s+/g, ' ').replace(/\bnatal\b/gi, '').trim();
  const match = cleaned.match(
    /^([A-Za-z][A-Za-z\s]*?)\s+(Conjunction|Opposition|Square|Trine|Sextile|Quincunx|Inconjunct)\s+([A-Za-z][A-Za-z\s]*?)$/i,
  );
  if (!match) return null;
  return {
    transiting: match[1].trim(),
    aspect: match[2].trim(),
    natal: match[3].trim(),
  };
}

/** Re-export element palette used by signs for consistency */
export { ELEMENT_COLORS };
