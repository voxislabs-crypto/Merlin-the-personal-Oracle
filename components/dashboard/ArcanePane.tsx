'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ArcaneTone = 'sky' | 'amber' | 'violet' | 'storm' | 'neutral';

interface ArcanePaneProps {
  children: ReactNode;
  className?: string;
  /** Outer shell classes (border / gradient from atmosphere) */
  shellClassName?: string;
  tone?: ArcaneTone;
  /** Subtle corner glow orbs */
  orbs?: boolean;
  /** Soft grid texture */
  grid?: boolean;
  /** Glass + blur on content shell */
  glass?: boolean;
  padding?: string;
  /** Use div instead of motion.section (for nested layouts) */
  as?: 'section' | 'div';
  /** Disable enter animation */
  static?: boolean;
}

const TONE_GLOW: Record<ArcaneTone, string> = {
  sky: 'shadow-sky-500/20',
  amber: 'shadow-amber-500/15',
  violet: 'shadow-violet-500/20',
  storm: 'shadow-rose-500/20',
  neutral: 'shadow-slate-900/40',
};

const TONE_ORB: Record<ArcaneTone, { a: string; b: string }> = {
  sky: { a: 'bg-sky-400/18', b: 'bg-cyan-300/12' },
  amber: { a: 'bg-amber-400/16', b: 'bg-violet-400/10' },
  violet: { a: 'bg-violet-400/18', b: 'bg-fuchsia-400/10' },
  storm: { a: 'bg-rose-400/16', b: 'bg-fuchsia-400/10' },
  neutral: { a: 'bg-slate-400/10', b: 'bg-sky-400/8' },
};

const TONE_EDGE: Record<ArcaneTone, string> = {
  sky: 'rgba(56,189,248,0.14)',
  amber: 'rgba(251,191,36,0.12)',
  violet: 'rgba(167,139,250,0.14)',
  storm: 'rgba(251,113,133,0.14)',
  neutral: 'rgba(148,163,184,0.1)',
};

/**
 * Mystical high-tech floating pane: glass, ambient orbs, soft grid.
 * No scan sweep — calm chrome for life-weather surfaces.
 */
export function ArcanePane({
  children,
  className = '',
  shellClassName = '',
  tone = 'sky',
  orbs = true,
  grid = true,
  glass = true,
  padding = 'p-5 md:p-6',
  as = 'section',
  static: isStatic = false,
}: ArcanePaneProps) {
  const orbsTone = TONE_ORB[tone];
  const edge = TONE_EDGE[tone];

  const shell = cn(
    'relative overflow-hidden rounded-2xl border backdrop-blur-md',
    glass && 'bg-slate-950/45',
    TONE_GLOW[tone],
    shellClassName,
    padding,
    className,
  );

  const body = (
    <>
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-90"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 30%, transparent 70%, ${edge} 100%)`,
        }}
      />
      {grid ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      ) : null}
      {orbs ? (
        <>
          <div
            className={cn(
              'pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full blur-3xl',
              orbsTone.a,
            )}
          />
          <div
            className={cn(
              'pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full blur-3xl',
              orbsTone.b,
            )}
          />
        </>
      ) : null}
      <div className="relative z-10">{children}</div>
    </>
  );

  if (isStatic || as === 'div') {
    return <div className={shell}>{body}</div>;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={shell}
    >
      {body}
    </motion.section>
  );
}

/** Shared glass chrome classes for sticky chrome (tabs, status) without full pane. */
export function arcaneChromeClass(tone: ArcaneTone = 'neutral'): string {
  return cn(
    'border border-slate-600/50 bg-slate-950/80 backdrop-blur-md shadow-lg',
    TONE_GLOW[tone],
  );
}
