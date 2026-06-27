'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';

interface PremiumUpgradeBannerProps {
  tier?: string;
  compact?: boolean;
}

const PREMIUM_FEATURES = [
  'Daily forecasts & transit intelligence',
  'Chart readings & life timeline',
  'Oracle chat & atmosphere engine',
  'Storm radar & weekly whispers',
];

export function PremiumUpgradeBanner({ tier, compact = false }: PremiumUpgradeBannerProps) {
  if (tier === 'lifetime') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-violet-950/50 p-4 md:p-5 shadow-lg shadow-amber-950/20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_45%)]" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-200">
            <Crown className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">Unlock Merlin Premium</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-50">
            {compact ? 'Premium insights are locked' : 'Your chart is ready — unlock the full Oracle'}
          </h3>
          {!compact ? (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-300/80" />
                  {feature}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300">
              Start a 7-day free trial, then $9.99/month. Or grab lifetime access for $50.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
          <Link
            href="/checkout-subscription"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/50 bg-amber-500/25 px-4 py-2.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-500/35"
          >
            Start 7-day free trial
          </Link>
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-xl border border-slate-500/50 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700/70"
          >
            Lifetime — $50
          </Link>
        </div>
      </div>
    </motion.div>
  );
}