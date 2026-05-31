'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CloudLightning,
  CloudRain,
  Loader2,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Sun,
  ThermometerSun,
} from 'lucide-react';

import { DailyForecast } from '@/components/astrology/DailyForecast';
import { useForecast } from '@/hooks/useForecast';
import type { BirthChartData, BirthData } from '@/components/astrology/BirthChartCalculator';

const STORAGE_BIRTH_KEY = 'merlin_birth_data';
const STORAGE_CHART_KEY = 'merlin_chart_data';

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function deriveBirthData(chart: BirthChartData | null): BirthData | null {
  if (!chart) return null;

  const snapshot = ((chart as any).birthData || (chart as any).metadata || {}) as any;

  const date = snapshot.birthDate || snapshot.date || '';
  const time = snapshot.birthTime || snapshot.time || '12:00';
  const latitude = snapshot.coordinates?.lat ?? snapshot.latitude ?? 0;
  const longitude = snapshot.coordinates?.lon ?? snapshot.longitude ?? 0;

  if (!date || !time) return null;

  return {
    date,
    time,
    latitude,
    longitude,
    houseSystem: 'Placidus',
    zodiac: 'Tropical',
  };
}

function phaseMeta(phase?: string | null) {
  switch ((phase || '').toLowerCase()) {
    case 'clear':
      return { emoji: '☀️', label: 'Clear skies', icon: Sun };
    case 'golden_hour':
      return { emoji: '🌤️', label: 'Golden hour', icon: Sun };
    case 'recovery':
      return { emoji: '🌦️', label: 'Recovery window', icon: ThermometerSun };
    case 'variable':
      return { emoji: '⛅', label: 'Variable weather', icon: CloudRain };
    case 'fog':
      return { emoji: '🌫️', label: 'Low visibility', icon: CloudRain };
    case 'stormy':
      return { emoji: '⛈️', label: 'Storm pressure', icon: CloudLightning };
    default:
      return { emoji: '🌥️', label: 'Weather unavailable', icon: CloudRain };
  }
}

function ratingTone(dayRating?: string) {
  switch (dayRating) {
    case 'Very Positive':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
    case 'Positive':
      return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200';
    case 'Neutral':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-100';
    case 'Challenging':
      return 'border-orange-400/30 bg-orange-400/10 text-orange-100';
    case 'Very Challenging':
      return 'border-rose-400/30 bg-rose-400/10 text-rose-100';
    default:
      return 'border-slate-500/30 bg-slate-500/10 text-slate-100';
  }
}

function MetricCard({ label, value, accent, icon }: { label: string; value: number; accent: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <span>{icon}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className={`text-3xl font-semibold ${accent}`}>{value}</p>
          <p className="mt-1 text-xs text-slate-500">out of 100</p>
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${Math.max(6, Math.min(100, value))}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function MerlinDashboardV2() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { forecast, loading, error, calculateForecast } = useForecast();
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedBirth = safeParseJson<BirthData>(localStorage.getItem(STORAGE_BIRTH_KEY));
    const savedChart = safeParseJson<BirthChartData>(localStorage.getItem(STORAGE_CHART_KEY));
    setBirthData(savedBirth || deriveBirthData(savedChart));
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (user) return;

    setRedirecting(true);
    router.replace('/sign-in?redirect_url=' + encodeURIComponent('/enhanced-dashboard'));
  }, [isLoaded, router, user]);

  useEffect(() => {
    if (!storageReady || !birthData) return;
    if (!user?.id) return;

    void calculateForecast(birthData, { userId: user.id });
  }, [birthData, calculateForecast, storageReady, user?.id]);

  const meta = useMemo(() => phaseMeta(forecast?.cafe?.phase), [forecast?.cafe?.phase]);
  const hasForecast = Boolean(forecast);
  const dimensions = forecast?.cafe?.dimensions;

  if (!isLoaded || !storageReady || redirecting) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-300" />
          <p className="text-zinc-400">Loading your new dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_26%),radial-gradient(circle_at_80%_10%,_rgba(168,85,247,0.18),_transparent_24%),radial-gradient(circle_at_50%_100%,_rgba(251,191,36,0.08),_transparent_30%)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 md:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur-sm">
          <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Dashboards</span>
          <Link href="/dashboard" className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800 transition">
            Frozen • Stable
          </Link>
          <Link href="/dashboard-v2" className="rounded-full border border-cyan-500/40 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-500/10 transition">
            V2 Live • Test
          </Link>
          <Link href="/dashboard-v3" className="rounded-full border border-violet-500/40 px-3 py-1 text-xs text-violet-200 hover:bg-violet-500/10 transition">
            V3 Draft • Draft
          </Link>
          <Link href="/enhanced-dashboard" className="rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
            Enhanced • Pilot
          </Link>
          <Link href="/dashboard-v2-preview.html" className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/10 transition">
            V2 Preview • Fallback
          </Link>
        </div>

        <header className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
              Live v2 shell
            </div>
            <h1 className="mt-4 text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Merlin
            </h1>
            <p className="mt-2 max-w-2xl text-lg md:text-xl text-zinc-300">
              Life Weather Intelligence, rebuilt as a separate pilot so the old dashboard can stay frozen while we test the new shape.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm lg:min-w-[18rem]">
            <p className="text-sm text-zinc-400">Good to see you, {user?.firstName || 'there'}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">
              {forecast?.provenance?.source ? `Forecast source: ${forecast.provenance.source}` : 'Waiting for saved chart data'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/oracle-chat"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                Talk to Merlin
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
              >
                Legacy dashboard
              </Link>
            </div>
          </div>
        </header>

        {!birthData ? (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-cyan-400/20 bg-zinc-900/75 p-8 shadow-2xl shadow-cyan-950/20"
          >
            <div className="max-w-2xl space-y-5">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-200">No saved chart found</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-white">Seed the new dashboard with a chart, then it will light up automatically.</h2>
              <p className="text-lg text-zinc-300 leading-relaxed">
                This v2 route reads the cached birth data from your existing Merlin session. If you have not calculated a chart yet, open the legacy dashboard or the chart calculator once, then come back here.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-black transition hover:bg-cyan-300"
                >
                  Open legacy dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/astro-calculator"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-white/10"
                >
                  Calculate a chart
                </Link>
              </div>
            </div>
          </motion.section>
        ) : (
          <>
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-amber-50"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">
                      {error.message.includes('free tier') ? 'Forecast is unavailable in free mode.' : 'Forecast could not be loaded.'}
                    </p>
                    <p className="text-sm text-amber-100/85">{error.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/checkout-subscription"
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-500/30"
                    >
                      Upgrade
                    </Link>
                    <button
                      type="button"
                      onClick={() => void calculateForecast(birthData, { userId: user?.id })}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-[2rem] border border-white/10 bg-zinc-900/80 p-6 md:p-8 shadow-2xl shadow-black/20"
            >
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-6xl">{meta.emoji}</span>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-semibold text-white">{forecast?.cafe?.phase?.replace('_', ' ') || meta.label}</h2>
                      <p className="mt-1 text-sm uppercase tracking-[0.22em] text-zinc-500">Today’s conditions</p>
                    </div>
                  </div>
                  <p className="max-w-3xl text-lg leading-relaxed text-zinc-300">
                    {loading ? 'Reading today\'s weather...' : forecast?.summary || 'Load a saved chart and Merlin will calculate today\'s weather from the CAFE pipeline.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:min-w-[28rem]">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-center">
                    <p className="text-4xl font-light text-cyan-300">{forecast?.cafe?.cafeIndex ?? 0}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-cyan-100/80">CAFE index</p>
                  </div>
                  <div className={`rounded-2xl border p-4 text-center ${ratingTone(forecast?.day_rating)}`}>
                    <p className="text-lg font-semibold">{forecast?.day_rating || 'Neutral'}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] opacity-80">Day rating</p>
                  </div>
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-center">
                    <p className="text-lg font-semibold text-amber-100">{forecast?.cafe?.phase?.replace('_', ' ') || 'Unknown'}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-amber-100/80">Phase</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-lg font-semibold text-zinc-100">{birthData ? 'Cached' : 'Live only'}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-400">Chart state</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void calculateForecast(birthData, { userId: user?.id })}
                  className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-500/20"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh forecast
                </button>
                <Link
                  href="/oracle-chat"
                  className="inline-flex items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-50 transition hover:bg-violet-500/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask Merlin
                </Link>
              </div>
            </motion.section>

            <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Cognitive clarity"
                value={dimensions?.cognitiveClarity ?? 0}
                accent="text-cyan-300"
                icon={<Sparkles className="h-4 w-4" />}
              />
              <MetricCard
                label="Emotional pressure"
                value={dimensions?.emotionalPressure ?? 0}
                accent="text-rose-300"
                icon={<ThermometerSun className="h-4 w-4" />}
              />
              <MetricCard
                label="Recovery capacity"
                value={dimensions?.recoveryCapacity ?? 0}
                accent="text-emerald-300"
                icon={<CloudRain className="h-4 w-4" />}
              />
              <MetricCard
                label="Opportunity window"
                value={dimensions?.opportunityWindow ?? 0}
                accent="text-violet-300"
                icon={<Sun className="h-4 w-4" />}
              />
            </section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-[2rem] border border-white/10 bg-zinc-900/70 p-6 md:p-8"
            >
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Weather windows</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">What to protect, push, and recover</h3>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${ratingTone(forecast?.day_rating)}`}>
                  <meta.icon className="h-3.5 w-3.5" />
                  {hasForecast ? 'Connected to live CAFE' : 'Waiting for live CAFE'}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <CloudLightning className="h-4 w-4 text-violet-300" />
                    <p className="text-sm font-semibold text-zinc-100">What to protect</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                    {forecast?.planetaryHighlights?.[0] || 'Your highest focus block is still waiting for a live forecast.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    <p className="text-sm font-semibold text-zinc-100">Best next move</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                    {forecast?.conversationalPrompts?.[0] || 'Open a chart first, then ask Merlin for the highest leverage move.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="h-4 w-4 text-amber-300" />
                    <p className="text-sm font-semibold text-zinc-100">Recovery cue</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                    {forecast?.conversationalPrompts?.[1] || 'Create enough quiet to reset the nervous system before the next push.'}
                  </p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-violet-400/10 bg-gradient-to-br from-violet-950/40 via-zinc-900 to-zinc-900 p-6 md:p-8"
            >
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-violet-200/80">Detailed forecast</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">Read the full weather pattern</h3>
                </div>
                <p className="text-sm text-zinc-400">
                  {forecast?.provenance?.source ? `Source: ${forecast.provenance.source}` : 'Source: cached chart + local forecast state'}
                </p>
              </div>

              <DailyForecast
                date={forecast?.date || new Date().toISOString()}
                summary={forecast?.summary || 'Forecast is still loading or unavailable.'}
                planetaryHighlights={forecast?.planetaryHighlights || []}
                moonPhase={forecast?.moonPhase || 'Unknown'}
                moonSign={forecast?.moonSign}
                sunSign={forecast?.sunSign}
                transits={forecast?.transits || []}
                advice={forecast?.advice || ''}
                day_rating={forecast?.day_rating}
                focusAreas={forecast?.focusAreas}
                timingWindows={forecast?.timingWindows}
                futureSignals={forecast?.futureSignals}
                conversationalPrompts={forecast?.conversationalPrompts || []}
                loading={loading}
                userId={user?.id}
                provenance={forecast?.provenance}
              />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-400"
            >
              This route is intentionally separate from the frozen dashboard so we can test the new shape without disturbing the original.
            </motion.section>
          </>
        )}
      </div>
    </div>
  );
}
