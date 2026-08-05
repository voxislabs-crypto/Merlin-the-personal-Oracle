'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  parseTransitPhrase,
  resolveAspectGlyph,
  resolvePlanetStyle,
  type PlanetStyleInfo,
} from '@/lib/astrology/planet-style';
import { cn } from '@/lib/utils';

function PlanetHoverCard({ info }: { info: PlanetStyleInfo }) {
  return (
    <div
      className="min-w-[10.5rem] rounded-lg px-3 py-2.5 text-left"
      style={{
        // Fully opaque fill — never see UI bleeding through
        backgroundColor: info.popupBg,
        border: `1.5px solid ${info.popupBorder}`,
        color: info.hex,
        boxShadow: '0 12px 40px rgba(0,0,0,0.92), 0 0 0 1px rgba(0,0,0,0.6)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-2xl leading-none" aria-hidden>
          {info.glyph}
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight" style={{ color: info.hex }}>
            {info.name}
          </p>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: info.hex, opacity: 0.92 }}
          >
            {info.elementLabel}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-snug" style={{ color: info.hex, opacity: 0.8 }}>
        {info.glyph} · {info.name} · {info.elementLabel}
      </p>
    </div>
  );
}

export interface PlanetLabelProps {
  name: string;
  className?: string;
  /** Show glyph before name */
  showGlyph?: boolean;
  /** Stronger text color token */
  strong?: boolean;
  /** Disable hover card */
  noTooltip?: boolean;
}

/**
 * Planet name in its elemental color, with hover: name · symbol · element.
 * Self-contained TooltipProvider so it works anywhere without a parent wrap.
 */
export function PlanetLabel({
  name,
  className,
  showGlyph = false,
  strong = false,
  noTooltip = false,
}: PlanetLabelProps) {
  const info = resolvePlanetStyle(name);
  if (!info) {
    return <span className={className}>{name}</span>;
  }

  const textClass = strong ? info.textStrongClass : info.textClass;
  const label = (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold underline-offset-2 decoration-from-font',
        !noTooltip && 'cursor-help hover:underline',
        textClass,
        className,
      )}
      style={{ color: info.hex }}
    >
      {showGlyph ? (
        <span className="text-[1.05em] leading-none" aria-hidden>
          {info.glyph}
        </span>
      ) : null}
      <span>{info.name}</span>
    </span>
  );

  if (noTooltip) return label;

  return (
    <TooltipProvider delayDuration={160}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline border-0 bg-transparent p-0 align-baseline"
            aria-label={info.tooltip}
            onClick={(e) => {
              // Don't steal card-level click handlers (ask Merlin, expand, etc.)
              e.stopPropagation();
            }}
          >
            {label}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={8}
          className="z-[100] border-0 bg-transparent p-0 shadow-none"
          style={{ backgroundColor: 'transparent' }}
        >
          <PlanetHoverCard info={info} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface TransitAspectLabelProps {
  /** e.g. "Saturn Square Moon" or structured parts */
  label?: string;
  transiting?: string;
  aspect?: string;
  natal?: string;
  className?: string;
  showGlyphs?: boolean;
}

/**
 * Colorized transit phrase: Saturn □ Moon with elemental planet colors + tooltips.
 */
export function TransitAspectLabel({
  label,
  transiting,
  aspect,
  natal,
  className,
  showGlyphs = true,
}: TransitAspectLabelProps) {
  let t = transiting;
  let a = aspect;
  let n = natal;

  if ((!t || !a || !n) && label) {
    const parsed = parseTransitPhrase(label);
    if (parsed) {
      t = parsed.transiting;
      a = parsed.aspect;
      n = parsed.natal;
    }
  }

  if (!t || !a || !n) {
    if (label) {
      return <span className={cn('text-slate-200', className)}>{label}</span>;
    }
    return null;
  }

  const aspectGlyph = resolveAspectGlyph(a);

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5', className)}>
      <PlanetLabel name={t} showGlyph={showGlyphs} strong />
      <span className="text-sm font-medium text-slate-400" title={a} aria-label={a}>
        {showGlyphs ? aspectGlyph : a}
      </span>
      <PlanetLabel name={n} showGlyph={showGlyphs} strong />
    </span>
  );
}
