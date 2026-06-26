'use client';

import Link from 'next/link';
import { Flame, Sparkles, VolumeX } from 'lucide-react';

interface DashboardStatusBarProps {
  showHeroTitle: boolean;
  calcSource?: string;
  streak?: number;
  tier?: 'free' | 'premium' | 'lifetime' | string;
  premiumLocked: boolean;
  tierLoading: boolean;
  tierError?: string | null;
  onRefreshTier: () => void;
  onStopVoice: () => void;
  dateLabel?: string;
}

export function DashboardStatusBar({
  showHeroTitle,
  calcSource,
  streak,
  tier,
  premiumLocked,
  tierLoading,
  tierError,
  onRefreshTier,
  onStopVoice,
  dateLabel,
}: DashboardStatusBarProps) {
  const todayLabel =
    dateLabel ||
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="mb-6 space-y-3">
      {showHeroTitle ? (
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
            Your Cosmic Dashboard
          </h1>
          <p className="mt-2 text-slate-400 text-sm md:text-base">One place. Your whole story.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-700/60 bg-slate-950/70 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 font-medium text-amber-100">
            <Sparkles className="h-3.5 w-3.5" />
            {todayLabel}
          </span>
          {typeof streak === 'number' && streak > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-orange-200">
              <Flame className="h-3.5 w-3.5" />
              {streak}-day streak
            </span>
          ) : null}
          {tier === 'lifetime' ? (
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-100">
              Lifetime
            </span>
          ) : premiumLocked ? (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-amber-100">
              Free tier
              <Link href="/checkout-subscription" className="ml-2 underline underline-offset-2 hover:text-amber-50">
                Upgrade
              </Link>
            </span>
          ) : (
            <span className="rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-violet-100">
              Premium
            </span>
          )}
          <span
            className={`rounded-full border px-3 py-1 font-medium ${
              calcSource === 'Swiss real'
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : calcSource
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                  : 'border-slate-500/50 bg-slate-500/10 text-slate-300'
            }`}
          >
            {calcSource || 'Calculating...'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {premiumLocked ? (
            <button
              type="button"
              disabled={tierLoading}
              onClick={onRefreshTier}
              className="text-[11px] text-amber-200 underline underline-offset-2 hover:text-amber-50 disabled:opacity-60"
            >
              {tierLoading ? 'Refreshing...' : 'Refresh access'}
            </button>
          ) : null}
          {tierError ? <span className="text-[10px] text-amber-200/80">{tierError}</span> : null}
          <button
            type="button"
            onClick={onStopVoice}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/20"
            title="Stop all Merlin voice playback"
          >
            <VolumeX className="h-3.5 w-3.5" />
            Mute voice
          </button>
        </div>
      </div>
    </div>
  );
}