'use client';

import { AlertCircle, CloudOff, Lock, MapPin, RefreshCw, CloudSun } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArcanePane, type ArcaneTone } from '@/components/dashboard/ArcanePane';

type StatusTone = 'error' | 'empty' | 'locked' | 'soft';

interface StatusPanelProps {
  tone?: StatusTone;
  title: string;
  message: string;
  /** Optional secondary line */
  hint?: string;
  onRetry?: () => void;
  retryLabel?: string;
  primaryHref?: string;
  primaryLabel?: string;
  className?: string;
  compact?: boolean;
}

const TONE: Record<
  StatusTone,
  {
    icon: typeof AlertCircle;
    border: string;
    bg: string;
    iconClass: string;
    titleClass: string;
    arcane: ArcaneTone;
  }
> = {
  error: {
    icon: CloudOff,
    border: 'border-rose-400/35',
    bg: 'bg-gradient-to-br from-rose-950/40 via-slate-950/80 to-slate-900/60',
    iconClass: 'text-rose-300',
    titleClass: 'text-rose-50',
    arcane: 'storm',
  },
  empty: {
    icon: CloudSun,
    border: 'border-sky-400/30',
    bg: 'bg-gradient-to-br from-sky-950/35 via-slate-950/80 to-slate-900/60',
    iconClass: 'text-sky-300',
    titleClass: 'text-sky-50',
    arcane: 'sky',
  },
  locked: {
    icon: Lock,
    border: 'border-amber-400/35',
    bg: 'bg-gradient-to-br from-amber-950/40 via-slate-950/80 to-violet-950/30',
    iconClass: 'text-amber-300',
    titleClass: 'text-amber-50',
    arcane: 'amber',
  },
  soft: {
    icon: AlertCircle,
    border: 'border-slate-600/50',
    bg: 'bg-slate-950/60',
    iconClass: 'text-slate-300',
    titleClass: 'text-slate-100',
    arcane: 'neutral',
  },
};

/**
 * Calm production status panel for empty / error / locked life-weather states.
 */
export function StatusPanel({
  tone = 'soft',
  title,
  message,
  hint,
  onRetry,
  retryLabel = 'Try again',
  primaryHref,
  primaryLabel,
  className = '',
  compact = false,
}: StatusPanelProps) {
  const cfg = TONE[tone];
  const Icon = cfg.icon;

  return (
    <ArcanePane
      tone={cfg.arcane}
      as="div"
      static
      shellClassName={`${cfg.border} ${cfg.bg} ${className}`}
      padding={compact ? 'p-4' : 'p-5 md:p-6'}
      orbs
    >
      <div
        className={`flex ${
          compact
            ? 'items-start gap-3'
            : 'flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left'
        }`}
        role="status"
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl border ${cfg.border} bg-black/25 ${
            compact ? 'h-10 w-10' : 'h-12 w-12'
          }`}
        >
          <Icon className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} ${cfg.iconClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold ${cfg.titleClass} ${compact ? 'text-base' : 'text-lg'}`}>
            {title}
          </h3>
          <p className={`mt-1 text-sm leading-relaxed text-slate-300 ${compact ? '' : 'max-w-xl'}`}>
            {message}
          </p>
          {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
          {(onRetry || primaryHref) && (
            <div
              className={`mt-3 flex flex-wrap gap-2 ${compact ? '' : 'justify-center sm:justify-start'}`}
            >
              {onRetry ? (
                <Button
                  type="button"
                  onClick={onRetry}
                  className="bg-sky-600 text-white hover:bg-sky-500"
                  size="sm"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  {retryLabel}
                </Button>
              ) : null}
              {primaryHref && primaryLabel ? (
                <Link href={primaryHref}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-sky-400/35 text-sky-100 hover:bg-sky-500/10"
                  >
                    {primaryLabel}
                  </Button>
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </ArcanePane>
  );
}

export function LocationEmptyHint({ query }: { query: string }) {
  if (!query || query.length < 2) return null;
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-slate-600/40 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
      <span>
        No places matched “{query}”. Try city + state/country (e.g. Austin, TX or London, UK).
      </span>
    </div>
  );
}
