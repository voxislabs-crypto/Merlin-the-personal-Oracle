'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CloudLightning, CloudRain, Loader2, MessageCircle, RefreshCw, Sparkles, Sun, ThermometerSun } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

import { useForecast } from '@/hooks/useForecast';
import { getRiskSignal, getTrendSignal, type MetricPolarity } from '@/lib/forecast/signals';
import type { BirthData } from '@/components/astrology/BirthChartCalculator';
import { WheelVisualization } from '@/components/astrology/WheelVisualization';
import { TransitArcMini } from '@/components/astrology/TransitArcMini';
import { LifeWeatherTrendGraph, type LifeWeatherTrendPoint } from '@/components/astrology/LifeWeatherTrendGraph';
import type { ChartData } from '@/lib/astrology/newWheelTypes';

const STORAGE_BIRTH_KEY = 'merlin_birth_data';
const STORAGE_CHART_KEY = 'merlin_chart_data';
const STORAGE_USER_ID_KEY = 'merlin-user-id';

type WheelMode = 'compact' | 'expanded';

interface ForecastHistoryApiRecord {
  generatedAt: string;
  cafeIndex: number;
  dimensions: {
    cognitiveClarity: number;
    emotionalPressure: number;
    recoveryCapacity: number;
    opportunityWindow: number;
  };
}

function normalizeAspectType(value: string): 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' {
  const normalized = value.toLowerCase();
  if (normalized === 'opposition') return 'opposition';
  if (normalized === 'trine') return 'trine';
  if (normalized === 'square') return 'square';
  if (normalized === 'sextile') return 'sextile';
  return 'conjunction';
}

function toTitleCase(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getOrCreateLocalUserId(): string {
  if (typeof window === 'undefined') return 'local-user';
  const existing = localStorage.getItem(STORAGE_USER_ID_KEY);
  if (existing) return existing;
  const generated = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem(STORAGE_USER_ID_KEY, generated);
  return generated;
}

function readBirthDataFromStorage(): BirthData | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawBirth = localStorage.getItem(STORAGE_BIRTH_KEY);
    if (rawBirth) {
      const parsed = JSON.parse(rawBirth) as Partial<BirthData>;
      if (
        typeof parsed.date === 'string' &&
        typeof parsed.time === 'string' &&
        typeof parsed.latitude === 'number' &&
        typeof parsed.longitude === 'number'
      ) {
        return {
          date: parsed.date,
          time: parsed.time,
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          houseSystem: parsed.houseSystem || 'Placidus',
          zodiac: parsed.zodiac || 'Tropical',
        };
      }
    }

    const rawChart = localStorage.getItem(STORAGE_CHART_KEY);
    if (!rawChart) return null;

    const chart = JSON.parse(rawChart) as {
      birthData?: { date?: string; time?: string; latitude?: number; longitude?: number };
      metadata?: {
        birthDate?: string;
        birthTime?: string;
        latitude?: number;
        longitude?: number;
        coordinates?: { lat?: number; lon?: number };
      };
    };

    const birth = chart.birthData;
    const meta = chart.metadata;
    const date = birth?.date || meta?.birthDate;
    const time = birth?.time || meta?.birthTime;
    const latitude = birth?.latitude ?? meta?.latitude ?? meta?.coordinates?.lat;
    const longitude = birth?.longitude ?? meta?.longitude ?? meta?.coordinates?.lon;

    if (
      typeof date === 'string' &&
      typeof time === 'string' &&
      typeof latitude === 'number' &&
      typeof longitude === 'number'
    ) {
      return {
        date,
        time,
        latitude,
        longitude,
        houseSystem: 'Placidus',
        zodiac: 'Tropical',
      };
    }
  } catch {
    return null;
  }

  return null;
}

function readWheelDataFromStorage(): ChartData | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawChart = localStorage.getItem(STORAGE_CHART_KEY);
    if (!rawChart) return null;

    const chart = JSON.parse(rawChart) as {
      planets?: Array<{
        name?: string;
        glyph?: string;
        longitude?: number;
        position?: number;
        sign?: string;
        degree?: number;
        element?: 'Fire' | 'Earth' | 'Air' | 'Water';
        color?: string;
        distance?: number;
      }>;
      aspects?: Array<{
        planet1?: { name?: string } | string;
        planet2?: { name?: string } | string;
        from?: string;
        to?: string;
        type?: string;
        aspect?: string;
        orb?: number;
        angle?: number;
        color?: string;
      }>;
      houses?: Array<{ longitude?: number; position?: number }>;
      ascendant?: { longitude?: number } | number;
      mc?: { longitude?: number } | number;
      midheaven?: number;
    };

    if (!Array.isArray(chart.planets) || chart.planets.length === 0) return null;

    return {
      planets: chart.planets.map((p) => ({
        name: p.name || 'Unknown',
        glyph: p.glyph || p.name?.[0] || '•',
        angle: p.longitude ?? p.position ?? 0,
        sign: p.sign || '',
        degree: p.degree ?? 0,
        element: p.element || 'Fire',
        color: p.color || 'hsl(45, 88%, 68%)',
        orbitalDistance: p.distance ?? 1,
      })),
      aspects: Array.isArray(chart.aspects)
        ? chart.aspects.map((a) => ({
            from: (typeof a.planet1 === 'object' ? a.planet1?.name : a.planet1) || a.from || '',
            to: (typeof a.planet2 === 'object' ? a.planet2?.name : a.planet2) || a.to || '',
            type: normalizeAspectType(a.type || a.aspect || 'conjunction'),
            angle: a.orb ?? a.angle ?? 0,
            color: a.color || 'hsl(45, 88%, 68%)',
            label: a.aspect || a.type || 'Aspect',
          }))
        : [],
      houses: Array.isArray(chart.houses)
        ? chart.houses.map((h) => h.longitude ?? h.position ?? 0)
        : [],
      ascendant:
        (typeof chart.ascendant === 'object' ? chart.ascendant?.longitude : chart.ascendant) ?? 0,
      midheaven:
        (typeof chart.mc === 'object' ? chart.mc?.longitude : chart.mc) ?? chart.midheaven ?? 0,
    };
  } catch {
    return null;
  }
}

function phaseMeta(phase?: string | null) {
  switch ((phase || '').toLowerCase()) {
    case 'clear':
      return { emoji: '☀️', label: 'Clear skies' };
    case 'golden_hour':
      return { emoji: '🌤️', label: 'Golden hour' };
    case 'recovery':
      return { emoji: '🌦️', label: 'Recovery window' };
    case 'variable':
      return { emoji: '⛅', label: 'Variable weather' };
    case 'fog':
      return { emoji: '🌫️', label: 'Low visibility' };
    case 'stormy':
      return { emoji: '⛈️', label: 'Storm pressure' };
    default:
      return { emoji: '🌥️', label: 'Weather unavailable' };
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

function MiniMetric({ label, value, accent, icon }: { label: string; value: number; accent: string; icon: React.ReactNode }) {
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

export default function MerlinDashboardV3() {
  const { user, isLoaded } = useUser();
  const { forecast, loading, error, calculateForecast } = useForecast();
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [wheelData, setWheelData] = useState<ChartData | null>(null);
  const [wheelMode, setWheelMode] = useState<WheelMode>('compact');
  const [storageReady, setStorageReady] = useState(false);
  const [trendPoints, setTrendPoints] = useState<LifeWeatherTrendPoint[]>([]);

  useEffect(() => {
    const storedBirth = readBirthDataFromStorage();
    const storedWheel = readWheelDataFromStorage();
    setBirthData(storedBirth);
    setWheelData(storedWheel);
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!birthData || !user?.id) return;
    void calculateForecast(birthData, {
      userId: user.id,
      horizonHours: 24,
      intention: 'Give me a calm, focused Life Weather read for today',
    });
  }, [birthData, calculateForecast, user?.id]);

  useEffect(() => {
    if (!storageReady) return;

    const resolvedUserId = user?.id || getOrCreateLocalUserId();
    let cancelled = false;

    async function loadForecastHistory() {
      try {
        const response = await fetch('/api/internal/forecast-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: resolvedUserId,
            limit: 12,
          }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
          if (!cancelled) setTrendPoints([]);
          return;
        }

        const normalized = (payload.data as ForecastHistoryApiRecord[])
          .filter((item) => item?.generatedAt && item?.dimensions)
          .sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime())
          .map((item) => {
            const parsed = new Date(item.generatedAt);
            return {
              timestamp: item.generatedAt,
              label: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              cafeIndex: item.cafeIndex,
              cognitiveClarity: item.dimensions.cognitiveClarity,
              emotionalPressure: item.dimensions.emotionalPressure,
              recoveryCapacity: item.dimensions.recoveryCapacity,
              opportunityWindow: item.dimensions.opportunityWindow,
            } satisfies LifeWeatherTrendPoint;
          });

        if (!cancelled) {
          setTrendPoints(normalized);
        }
      } catch {
        if (!cancelled) setTrendPoints([]);
      }
    }

    void loadForecastHistory();

    return () => {
      cancelled = true;
    };
  }, [storageReady, user?.id]);

  const trendSeries = useMemo(() => {
    const base = [...trendPoints];
    if (!forecast?.cafe?.dimensions) return base;

    const nowIso = forecast?.provenance?.generatedAt || new Date().toISOString();
    const nowLabel = 'Now';
    const latestPoint: LifeWeatherTrendPoint = {
      timestamp: nowIso,
      label: nowLabel,
      cafeIndex: forecast.cafe.cafeIndex,
      cognitiveClarity: forecast.cafe.dimensions.cognitiveClarity,
      emotionalPressure: forecast.cafe.dimensions.emotionalPressure,
      recoveryCapacity: forecast.cafe.dimensions.recoveryCapacity,
      opportunityWindow: forecast.cafe.dimensions.opportunityWindow,
    };

    if (base.length === 0) return [latestPoint];

    const last = base[base.length - 1];
    if (Math.abs(new Date(last.timestamp).getTime() - new Date(latestPoint.timestamp).getTime()) < 60_000) {
      base[base.length - 1] = latestPoint;
      return base;
    }

    return [...base, latestPoint].slice(-12);
  }, [forecast?.cafe, forecast?.provenance?.generatedAt, trendPoints]);

  const weather = useMemo(() => {
    if (!forecast) {
      return {
        phase: 'Weather Loading',
        emoji: '🌤️',
        summary: 'Connecting to Cafe forecast engine...',
        cafeIndex: 0,
        energy: 50,
        focus: 50,
        pressure: 50,
      };
    }

    return {
      phase: forecast.cafe?.phase?.replace('_', ' ') || 'Variable Conditions',
      emoji: forecast.cafe?.phase?.includes('storm') ? '⛈️' : forecast.cafe?.phase?.includes('clear') ? '☀️' : '🌥️',
      summary: forecast.summary || 'Reading today\'s weather...',
      cafeIndex: forecast.cafe?.cafeIndex ?? 50,
      energy: forecast.cafe?.dimensions?.cognitiveClarity ?? 55,
      focus: forecast.cafe?.dimensions?.opportunityWindow ?? 48,
      pressure: forecast.cafe?.dimensions?.emotionalPressure ?? 65,
    };
  }, [forecast]);

  const phase = useMemo(() => phaseMeta(forecast?.cafe?.phase), [forecast?.cafe?.phase]);
  const dimensions = forecast?.cafe?.dimensions;
  const riskSignal = useMemo(() => getRiskSignal(weather.pressure, weather.focus), [weather.focus, weather.pressure]);

  const pressureRadar = useMemo(
    () => [
      { label: 'Cognitive clarity', value: dimensions?.cognitiveClarity ?? weather.energy, polarity: 'positive' as MetricPolarity, accent: 'text-cyan-300' },
      { label: 'Emotional pressure', value: dimensions?.emotionalPressure ?? weather.pressure, polarity: 'negative' as MetricPolarity, accent: 'text-rose-300' },
      { label: 'Recovery capacity', value: dimensions?.recoveryCapacity ?? 50, polarity: 'positive' as MetricPolarity, accent: 'text-emerald-300' },
      { label: 'Opportunity window', value: dimensions?.opportunityWindow ?? weather.focus, polarity: 'positive' as MetricPolarity, accent: 'text-violet-300' },
    ],
    [dimensions, weather.energy, weather.focus, weather.pressure]
  );

  const miniRadar = useMemo(() => pressureRadar.map((metric) => ({ ...metric, ...getTrendSignal(metric.label, metric.value, metric.polarity) })), [pressureRadar]);

  const windows = useMemo(() => {
    if (forecast?.timingWindows) {
      return [
        { time: 'Next 24h', label: forecast.timingWindows.next24Hours, icon: <CloudRain className="h-5 w-5 text-cyan-300" /> },
        { time: 'Next 72h', label: forecast.timingWindows.next72Hours, icon: <Sun className="h-5 w-5 text-amber-300" /> },
        { time: 'Week ahead', label: forecast.timingWindows.weekAhead, icon: <CloudLightning className="h-5 w-5 text-violet-300" /> },
      ];
    }

    return [
      { time: 'Morning', label: 'Protect focus blocks', icon: <CloudRain className="h-5 w-5 text-cyan-300" /> },
      { time: 'Midday', label: 'Best window for decisions', icon: <Sun className="h-5 w-5 text-amber-300" /> },
      { time: 'Evening', label: 'Recovery & decompression', icon: <CloudLightning className="h-5 w-5 text-violet-300" /> },
    ];
  }, [forecast]);

  const todaysMoves = useMemo(() => {
    if (forecast?.planetaryHighlights?.length) return forecast.planetaryHighlights.slice(0, 3);
    if (forecast?.transits?.length) return forecast.transits.slice(0, 3);
    return [
      'Protect your first deep-focus block from distraction.',
      'Make one strategic move before noon.',
      'Close the day with intentional decompression.',
    ];
  }, [forecast]);

  if (!isLoaded || !storageReady) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-300" />
          <p className="text-zinc-400">Loading your weather map...</p>
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
          <Link href="/dashboard-v3" className="rounded-full border border-violet-400/50 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
            V3 Draft • Draft
          </Link>
          <Link href="/enhanced-dashboard" className="rounded-full border border-amber-500/40 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/10 transition">
            Enhanced • Pilot
          </Link>
          <Link href="/dashboard-v2-preview.html" className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/10 transition">
            V2 Preview • Fallback
          </Link>
        </div>

        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
              V3 draft
            </div>
            <h1 className="mt-4 text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Merlin
            </h1>
            <p className="mt-2 max-w-3xl text-lg md:text-xl text-zinc-300">
              Life Weather Intelligence, simplified into a cleaner current-conditions view while keeping the proven forecast engine and transit surfaces.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm lg:min-w-[19rem]">
            <p className="text-sm text-zinc-400">Good to see you, {user?.firstName || 'there'}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">
              {forecast?.provenance?.source ? `Forecast source: ${forecast.provenance.source}` : 'Waiting for live forecast'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/dashboard-v2"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
              >
                Open V2
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
              >
                Legacy dashboard
              </Link>
              <Link
                href="/oracle-chat"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                Talk to Merlin
                <ArrowRight className="h-4 w-4" />
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
                This route reads the cached birth data from your existing Merlin session. Open the calculator or the legacy dashboard once, then come back here.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/astro-calculator"
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-black transition hover:bg-cyan-300"
                >
                  Calculate a chart
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-white/10"
                >
                  Open legacy dashboard
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
                    <p className="font-semibold">Forecast could not be loaded.</p>
                    <p className="text-sm text-amber-100/85">{error.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void calculateForecast(birthData, { userId: user?.id || getOrCreateLocalUserId() })}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </button>
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
                    <span className="text-6xl">{weather.emoji}</span>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-semibold text-white">Current Conditions</h2>
                      <p className="mt-1 text-sm uppercase tracking-[0.22em] text-zinc-500">Today’s weather</p>
                    </div>
                  </div>
                  <p className="max-w-3xl text-lg leading-relaxed text-zinc-300">{loading ? 'Reading today\'s weather...' : weather.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:min-w-[28rem]">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-center">
                    <p className="text-4xl font-light text-cyan-300">{weather.cafeIndex}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-cyan-100/80">CAFE index</p>
                  </div>
                  <div className={`rounded-2xl border p-4 text-center ${ratingTone(forecast?.day_rating)}`}>
                    <p className="text-lg font-semibold">{forecast?.day_rating || 'Neutral'}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] opacity-80">Day rating</p>
                  </div>
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-center">
                    <p className="text-lg font-semibold text-amber-100">{weather.phase}</p>
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
                  onClick={() => void calculateForecast(birthData, { userId: user?.id || getOrCreateLocalUserId() })}
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
              <MiniMetric label="Cognitive clarity" value={dimensions?.cognitiveClarity ?? 0} accent="text-cyan-300" icon={<Sparkles className="h-4 w-4" />} />
              <MiniMetric label="Emotional pressure" value={dimensions?.emotionalPressure ?? 0} accent="text-rose-300" icon={<ThermometerSun className="h-4 w-4" />} />
              <MiniMetric label="Recovery capacity" value={dimensions?.recoveryCapacity ?? 0} accent="text-emerald-300" icon={<CloudRain className="h-4 w-4" />} />
              <MiniMetric label="Opportunity window" value={dimensions?.opportunityWindow ?? 0} accent="text-violet-300" icon={<Sun className="h-4 w-4" />} />
            </section>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <LifeWeatherTrendGraph points={trendSeries} />
            </motion.div>

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
                  {phase.emoji}
                  {phase.label}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <CloudLightning className="h-4 w-4 text-violet-300" />
                    <p className="text-sm font-semibold text-zinc-100">What to protect</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">{forecast?.planetaryHighlights?.[0] || 'Your highest focus block is waiting for live data.'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    <p className="text-sm font-semibold text-zinc-100">Best next move</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">{forecast?.conversationalPrompts?.[0] || 'Open a chart first, then ask Merlin for the highest leverage move.'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="h-4 w-4 text-amber-300" />
                    <p className="text-sm font-semibold text-zinc-100">Recovery cue</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">{forecast?.conversationalPrompts?.[1] || 'Create enough quiet to reset before the next push.'}</p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-[2rem] border border-white/10 bg-zinc-900/70 p-6 md:p-8"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Pressure radar</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">Live signal map</h3>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${riskSignal.className}`}>
                  {riskSignal.label}
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  {miniRadar.map((metric) => (
                    <div key={metric.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-zinc-300">{metric.label}</span>
                        <span className="inline-flex items-center gap-2">
                          <span className="text-zinc-400">{Math.round(metric.value)}</span>
                          <span className={`inline-flex items-center gap-1 ${metric.trendClass}`}>
                            <span>{metric.trendGlyph}</span>
                            <span className="text-[10px] uppercase tracking-[0.14em]">{metric.trendLabel}</span>
                          </span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div className={`h-full rounded-full ${metric.polarity === 'negative' ? 'bg-rose-400' : metric.label.toLowerCase().includes('recovery') ? 'bg-emerald-400' : metric.label.toLowerCase().includes('opportunity') ? 'bg-violet-400' : 'bg-cyan-400'}`} style={{ width: `${Math.max(8, Math.min(100, metric.value))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  {windows.map((slot) => (
                    <div key={slot.time} className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-zinc-300">{slot.time}</span>
                        {slot.icon}
                      </div>
                      <p className="text-sm text-zinc-100 leading-relaxed">{slot.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-[2rem] border border-white/10 bg-zinc-900/70 p-6 md:p-8"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Transit view</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">Compact arc or full wheel</h3>
                </div>
                <div className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/60 p-1">
                  <button
                    type="button"
                    onClick={() => setWheelMode('compact')}
                    className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em] transition ${wheelMode === 'compact' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => setWheelMode('expanded')}
                    className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em] transition ${wheelMode === 'expanded' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Expanded
                  </button>
                </div>
              </div>

              {wheelData ? (
                <div className={wheelMode === 'expanded' ? 'rounded-2xl border border-zinc-700 overflow-hidden bg-black h-[470px] lg:h-[560px]' : 'rounded-2xl border border-zinc-700 overflow-hidden bg-black h-[360px] lg:h-[430px]'}>
                  {wheelMode === 'compact' ? (
                    <TransitArcMini chartData={wheelData} />
                  ) : (
                    <div className="h-full w-full origin-center scale-[0.96] lg:scale-[1.02] transition-transform duration-300">
                      <WheelVisualization chartData={wheelData} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-700 bg-zinc-950/60 p-5 text-zinc-300">
                  Transit wheel is waiting for chart data. Calculate and save a birth chart first.
                </div>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 grid gap-4 lg:grid-cols-2"
            >
              <div className="rounded-[2rem] border border-white/10 bg-zinc-900/70 p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Daily moves</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">Protect, push, recover</h3>
                <div className="mt-4 space-y-2">
                  {todaysMoves.map((move, idx) => (
                    <div key={idx} className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">{idx === 0 ? 'Protect' : idx === 1 ? 'Push' : 'Recover'}</p>
                      {move}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-violet-400/10 bg-gradient-to-br from-violet-950/40 via-zinc-900 to-zinc-900 p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.22em] text-violet-200/80">Oracle pulse</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">Move with timing, not panic</h3>
                <p className="mt-4 text-lg leading-relaxed text-zinc-100">
                  {weather.pressure >= 70
                    ? 'Pressure is elevated. Keep decisions reversible and pace yourself through the highest-friction window.'
                    : weather.focus >= 65
                      ? 'Clarity is available. Convert momentum into one meaningful move before opening too many loops.'
                      : 'Signal is mixed. Favor calm sequencing over urgency and let timing, not force, do the heavy lifting.'}
                </p>
                <p className="mt-4 text-sm text-zinc-400">This route is intentionally separate from the frozen dashboard so we can test the new shape without disturbing the original.</p>
              </div>
            </motion.section>
          </>
        )}
      </div>
    </div>
  );
}
