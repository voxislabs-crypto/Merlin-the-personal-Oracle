'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Check,
  CloudSun,
  MessageCircle,
  Radio,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';

/** What the 7-day trial actually unlocks — life weather product, not old chart laundry list. */
const trialHighlights = [
  {
    title: 'Full life weather',
    detail: 'Daily intensity, tone, and a clear move — not a sun-sign blurb.',
  },
  {
    title: 'Storm radar & pressure windows',
    detail: 'See what’s building ahead, not only how today feels.',
  },
  {
    title: 'Unlimited Oracle chat',
    detail: 'Talk through the day with chart + weather context. Free is capped at 3/day.',
  },
  {
    title: 'Self depth unlocked',
    detail: 'Chart reading, transits, life timeline, returns — the full instrument panel.',
  },
];

const trialFeatures = [
  'Life weather · daily intensity, tone & today’s move',
  'Storm radar · multi-day pressure & risk windows',
  'Weekly horizon · what’s building this week',
  'Active transits & domain pressure reads',
  'Self · birth chart wheel & dual MBTI (Core + Mask)',
  'Chart reading, life timeline & returns',
  'Oracle chat · unlimited (no free-tier daily cap)',
  'Merlin AI interpretations',
  'Reality check · felt mood vs chart weather',
  'Swiss Ephemeris engine · installable PWA',
];

export default function CheckoutSubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      window.location.href =
        '/sign-in?redirect_url=' + encodeURIComponent('/checkout-subscription');
      return;
    }

    setLoading(true);

    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'begin_checkout', {
          currency: 'USD',
          value: 9.99,
          items: [{ item_name: 'Merlin Monthly Subscription' }],
        });
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          birthDate: '',
          birthTime: '',
          birthCity: '',
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed. Please try again.');
      }

      if (!data.url) {
        throw new Error('Stripe checkout URL was not returned.');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Subscription error:', err);
      alert(err instanceof Error ? err.message : 'Subscription failed. Please try again.');
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 text-white">
        <div className="text-center">
          <Radio className="mx-auto mb-4 h-12 w-12 animate-pulse text-sky-400" />
          <p className="text-lg text-slate-300">Opening the station…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 px-4 pb-20 pt-28 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.32em] text-sky-300/80">
            Life weather · 7-day trial
          </p>
          <h1 className="mb-4 bg-gradient-to-r from-sky-200 via-cyan-100 to-amber-200 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Start your 7-day free trial
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300">
            Unlock full life weather, storm radar, unlimited Oracle, and Self depth — then decide if
            Merlin earns a place in your day. Card required; not charged for 7 days. Cancel anytime.
          </p>
        </motion.div>

        {/* Highlight strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {trialHighlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-sky-400/25 bg-slate-950/55 p-4 shadow-lg shadow-sky-950/20 backdrop-blur-md"
            >
              <p className="text-sm font-semibold text-sky-100">{item.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{item.detail}</p>
            </div>
          ))}
        </motion.div>

        <div className="mb-12 grid gap-8 md:grid-cols-2">
          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
          >
            <Card className="border-sky-400/40 bg-gradient-to-br from-sky-950/80 via-slate-950/90 to-indigo-950/70 text-white shadow-2xl shadow-sky-500/10 backdrop-blur-md">
              <CardHeader>
                <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-sky-400/35 bg-sky-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                  <Zap className="h-3.5 w-3.5" />
                  7 days free
                </div>
                <CardTitle className="text-3xl text-sky-100">Monthly</CardTitle>
                <CardDescription className="text-slate-300">
                  Full life weather + Self access after trial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">$9.99</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  <p className="font-semibold text-sky-200">First 7 days free</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Then $9.99/month. Cancel before day 8 and you pay nothing.
                  </p>
                </div>

                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-500 py-6 text-lg font-bold text-white shadow-[0_0_28px_rgba(56,189,248,0.25)] hover:from-sky-500 hover:via-cyan-500 hover:to-sky-400"
                >
                  {loading
                    ? 'Opening checkout…'
                    : isSignedIn
                      ? 'Start free trial'
                      : 'Sign in to continue'}
                </Button>

                <div className="mt-6 space-y-2.5 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Card required · not charged during the trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Cancel anytime from your account</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Secure checkout via Stripe</span>
                  </div>
                </div>

                <p className="mt-5 rounded-xl border border-white/5 bg-slate-950/50 px-3 py-2 text-xs leading-relaxed text-slate-500">
                  Honest note: free already includes a chart peek, dual MBTI, Today sample, and 3
                  Oracle messages/day. Trial unlocks the full weather habit — storms, horizon,
                  unlimited Oracle, and depth modules.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
          >
            <Card className="h-full border-amber-400/30 bg-gradient-to-br from-slate-950/90 via-amber-950/20 to-slate-900/80 text-white shadow-xl backdrop-blur-md">
              <CardHeader>
                <div className="mb-1 flex items-center gap-2 text-amber-200/90">
                  <CloudSun className="h-5 w-5" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.24em]">
                    Trial unlocks
                  </span>
                </div>
                <CardTitle className="text-2xl text-amber-100">What you get</CardTitle>
                <CardDescription className="text-slate-300">
                  The full Merlin station — weather first, Self as depth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {trialFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
                      <span className="text-sm leading-snug text-slate-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-start gap-2 rounded-xl border border-sky-400/20 bg-sky-950/30 px-3 py-2.5 text-xs text-sky-100/90">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                  <span>
                    Chart rebuilds stay capped at <strong>3 per account</strong> for free and
                    paid (first natal + rerolls). Trial is about weather depth and Oracle — not
                    infinite charts for the whole family.
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Lifetime Option */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-center"
        >
          <div className="inline-block rounded-2xl border border-amber-400/35 bg-amber-950/25 px-6 py-6 shadow-lg shadow-amber-950/20 backdrop-blur-md">
            <p className="mb-1 flex items-center justify-center gap-2 font-semibold text-amber-200">
              <Sparkles className="h-4 w-4" />
              Prefer one payment?
            </p>
            <p className="mb-1 text-lg font-bold text-amber-50">Lifetime access · $50</p>
            <p className="mb-4 text-sm text-slate-400">
              Founder pricing while in beta · same full station, pay once
            </p>
            <Button
              asChild
              variant="outline"
              className="border-amber-400/50 bg-transparent text-amber-100 hover:bg-amber-500/15"
            >
              <Link href="/checkout">Get lifetime access</Link>
            </Button>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="mx-auto mt-14 max-w-2xl"
        >
          <h3 className="mb-6 text-center text-2xl font-bold text-sky-100">Quick answers</h3>
          <div className="space-y-3 text-slate-300">
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
              <h4 className="mb-1.5 font-semibold text-white">When will I be charged?</h4>
              <p className="text-sm leading-relaxed text-slate-400">
                Day 8 after you start — $9.99. Cancel anytime before that and you won&apos;t be
                charged.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
              <h4 className="mb-1.5 font-semibold text-white">How is this different from free?</h4>
              <p className="text-sm leading-relaxed text-slate-400">
                Free is a real peek: chart, dual MBTI, Today sample, 3 Oracle messages/day. Trial
                unlocks storms, weekly horizon, full forecast depth, timeline, and unlimited Oracle
                — the daily habit Merlin is built for.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
              <h4 className="mb-1.5 font-semibold text-white">How do I cancel?</h4>
              <p className="text-sm leading-relaxed text-slate-400">
                Manage the subscription from your account / Stripe customer portal. One click, no
                guilt trip.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
              <h4 className="mb-1.5 font-semibold text-white">What happens after I cancel?</h4>
              <p className="text-sm leading-relaxed text-slate-400">
                You keep paid access through the end of the period you already paid for (or the
                trial window). No partial-month refunds.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
