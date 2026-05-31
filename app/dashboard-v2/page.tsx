'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CloudRain, Sun, CloudLightning, MessageCircle, ArrowRight } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useForecast } from '@/hooks/useForecast';
import type { BirthData } from '@/components/astrology/BirthChartCalculator';
import { getRiskSignal, getTrendSignal, type MetricPolarity } from '@/lib/forecast/signals';
import { WheelVisualization } from '@/components/astrology/WheelVisualization';
import { TransitArcMini } from '@/components/astrology/TransitArcMini';
import type { ChartData } from '@/lib/astrology/newWheelTypes';

const STORAGE_BIRTH_KEY = 'merlin_birth_data';
const STORAGE_CHART_KEY = 'merlin_chart_data';
const STORAGE_USER_ID_KEY = 'merlin-user-id';

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
      birthData?: {
        date?: string;
        time?: string;
        latitude?: number;
        longitude?: number;
      };
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

export default function MerlinDashboardV2() {
  const { user } = useUser();
  const { forecast, loading, error, calculateForecast } = useForecast();

  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [wheelData, setWheelData] = useState<ChartData | null>(null);
  const [wheelMode, setWheelMode] = useState<'compact' | 'expanded'>('compact');
  const [hasTriedLoad, setHasTriedLoad] = useState(false);

  useEffect(() => {
    const stored = readBirthDataFromStorage();
    const storedWheel = readWheelDataFromStorage();
    setBirthData(stored);
    setWheelData(storedWheel);
    setHasTriedLoad(true);
  }, []);

  useEffect(() => {
    if (!birthData) return;

    const localUserId = getOrCreateLocalUserId();
    void calculateForecast(birthData, {
      userId: user?.id || localUserId,
      horizonHours: 24,
      intention: 'Give me tactical daily focus guidance',
    });
  }, [birthData, calculateForecast, user?.id]);

  const retryForecast = () => {
    if (!birthData) return;
    const localUserId = getOrCreateLocalUserId();
    void calculateForecast(birthData, {
      userId: user?.id || localUserId,
      horizonHours: 24,
      intention: 'Give me tactical daily focus guidance',
    });
  };

  const currentWeather = useMemo(() => {
    if (!forecast) {
      return {
        phase: 'Weather Unavailable',
        emoji: '⛅',
        summary: 'CAFE forecast is not available yet for this profile.',
        cafeIndex: null as number | null,
        energy: 50,
        focus: 50,
        pressure: 50,
      };
    }

    const cafe = forecast.cafe;
    const cafeIndex = cafe?.cafeIndex ?? null;
    const focus = cafe?.dimensions.cognitiveClarity ?? 50;
    const pressure = cafe?.dimensions.emotionalPressure ?? 50;
    const energy = cafe?.dimensions.recoveryCapacity ?? 50;

    let emoji = '🌥️';
    if (typeof cafeIndex === 'number') {
      if (cafeIndex >= 80) emoji = '☀️';
      else if (cafeIndex >= 60) emoji = '⛅';
      else if (cafeIndex >= 40) emoji = '🌧️';
      else emoji = '⛈️';
    }

    return {
      phase: cafe?.phase ? toTitleCase(cafe.phase) : 'Current Conditions',
      emoji,
      summary: forecast.summary || 'Forecast generated with limited signal detail.',
      cafeIndex,
      energy,
      focus,
      pressure,
    };
  }, [forecast]);

  const windows = useMemo(() => {
    if (forecast?.timingWindows) {
      return [
        { time: 'Next 24h', condition: forecast.timingWindows.next24Hours, icon: <CloudRain className="w-6 h-6 text-blue-400" /> },
        { time: 'Next 72h', condition: forecast.timingWindows.next72Hours, icon: <Sun className="w-6 h-6 text-amber-400" /> },
        { time: 'Week Ahead', condition: forecast.timingWindows.weekAhead, icon: <CloudLightning className="w-6 h-6 text-violet-400" /> },
      ];
    }

    return [
      { time: 'Morning', condition: 'Stabilize your focus before context switching.', icon: <CloudRain className="w-6 h-6 text-blue-400" /> },
      { time: 'Midday', condition: 'Use your highest clarity block for priority work.', icon: <Sun className="w-6 h-6 text-amber-400" /> },
      { time: 'Evening', condition: 'Deliberate decompression improves tomorrow signal.', icon: <CloudLightning className="w-6 h-6 text-violet-400" /> },
    ];
  }, [forecast]);

  const identityLens = useMemo(() => {
    const notes = forecast?.provenance?.notes;
    if (!Array.isArray(notes)) return null;

    const mbtiNote = notes.find((note) => /mbti lens/i.test(note) && !/no mbti lens/i.test(note));
    if (!mbtiNote) return null;

    return mbtiNote.replace(/mbti lens\s*/i, '').trim();
  }, [forecast]);

  const pressureRadar = useMemo(() => {
    const dims = forecast?.cafe?.dimensions;

    return [
      { label: 'Cognitive Clarity', value: dims?.cognitiveClarity ?? 50, color: 'bg-cyan-400', polarity: 'positive' as MetricPolarity },
      { label: 'Emotional Pressure', value: dims?.emotionalPressure ?? 50, color: 'bg-rose-400', polarity: 'negative' as MetricPolarity },
      { label: 'Social Friction', value: dims?.socialFriction ?? 50, color: 'bg-amber-400', polarity: 'negative' as MetricPolarity },
      { label: 'Recovery Capacity', value: dims?.recoveryCapacity ?? 50, color: 'bg-emerald-400', polarity: 'positive' as MetricPolarity },
      { label: 'Opportunity Window', value: dims?.opportunityWindow ?? 50, color: 'bg-violet-400', polarity: 'positive' as MetricPolarity },
    ];
  }, [forecast]);

  const pressureRadarWithTrend = useMemo(() => {
    return pressureRadar.map((metric) => ({
      ...metric,
      ...getTrendSignal(metric.label, metric.value, metric.polarity),
    }));
  }, [pressureRadar]);

  const riskSignal = useMemo(
    () => getRiskSignal(currentWeather.pressure, currentWeather.focus),
    [currentWeather.focus, currentWeather.pressure]
  );

  const todaysMoves = useMemo(() => {
    if (forecast?.transits?.length) {
      return forecast.transits.slice(0, 3);
    }

    if (forecast?.planetaryHighlights?.length) {
      return forecast.planetaryHighlights.slice(0, 3);
    }

    return [
      'Protect your first deep-focus block from distraction.',
      'Make one strategic move before noon and avoid over-committing.',
      'Close the day with intentional decompression to reset pressure.',
    ];
  }, [forecast]);

  const oraclePulse = useMemo(() => {
    const pressure = currentWeather.pressure;
    const focus = currentWeather.focus;

    if (pressure >= 70) {
      return 'Pressure is elevated. Keep decisions reversible and pace yourself through the highest-friction window.';
    }

    if (focus >= 65) {
      return 'Clarity is available. Convert momentum into one meaningful move before opening too many loops.';
    }

    return 'Signal is mixed. Favor calm sequencing over urgency and let timing, not force, do the heavy lifting.';
  }, [currentWeather.focus, currentWeather.pressure]);

  const heroMetrics = useMemo(
    () => [
      {
        label: 'Energy',
        value: Math.round(currentWeather.energy),
        numberClass: 'text-cyan-400',
        barClass: 'bg-cyan-400',
      },
      {
        label: 'Focus',
        value: Math.round(currentWeather.focus),
        numberClass: 'text-blue-400',
        barClass: 'bg-blue-400',
      },
      {
        label: 'Pressure',
        value: Math.round(currentWeather.pressure),
        numberClass: 'text-rose-400',
        barClass: 'bg-rose-400',
      },
    ],
    [currentWeather.energy, currentWeather.focus, currentWeather.pressure]
  );

  if (!hasTriedLoad || (birthData && loading && !forecast)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-6">🌤️</div>
          <p className="text-zinc-400 text-lg">Reading today's weather...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Dashboards</span>
          <Link href="/dashboard" className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800 transition">
            Frozen • Stable
          </Link>
          <Link href="/dashboard-v2" className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            V2 Live • Test
          </Link>
          <Link href="/dashboard-v3" className="rounded-full border border-violet-500/40 px-3 py-1 text-xs text-violet-200 hover:bg-violet-500/10 transition">
            V3 Draft • Draft
          </Link>
          <Link href="/enhanced-dashboard" className="rounded-full border border-amber-500/40 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/10 transition">
            Enhanced • Pilot
          </Link>
          <Link href="/dashboard-v2-preview.html" className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/10 transition">
            V2 Preview • Fallback
          </Link>
        </div>

        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Merlin
            </h1>
            <p className="text-zinc-400 mt-1">Life Weather Intelligence</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-300">Good to see you, {user?.firstName || 'there'}</p>
            <p className="text-xs text-zinc-500">CAFE Forecast • Live</p>
            {identityLens ? (
              <p className="mt-1 text-xs text-violet-300">Identity Lens: {identityLens}</p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">Identity Lens: Calibrating</p>
            )}
            <Link
              href="/dashboard"
              className="inline-flex mt-2 text-xs text-cyan-300 hover:text-cyan-200 transition"
            >
              Open Frozen Dashboard
            </Link>
            <Link
              href="/dashboard-v3"
              className="ml-3 inline-flex mt-2 text-xs text-violet-300 hover:text-violet-200 transition"
            >
              Open V3 Draft
            </Link>
          </div>
        </div>

        {!birthData ? (
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 mb-10">
            <p className="text-amber-200 text-sm">
              No birth profile found yet. Calculate your chart first to activate CAFE weather.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/dashboard" className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-200 hover:bg-zinc-800 transition">
                Open Original Dashboard
              </Link>
              <Link href="/astro-calculator" className="px-4 py-2 rounded-lg border border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10 transition">
                Go to Calculator
              </Link>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl p-6 mb-10">
            <p className="text-rose-200 text-sm">
              Forecast temporarily unavailable: {error.message}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={retryForecast}
                className="px-4 py-2 rounded-lg border border-rose-400/40 text-rose-100 hover:bg-rose-500/10 transition"
              >
                Retry Forecast
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-200 hover:bg-zinc-800 transition"
              >
                Open Frozen Dashboard
              </Link>
            </div>
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10 mb-12"
        >
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="text-8xl flex-shrink-0">{currentWeather.emoji}</div>

            <div className="flex-1">
              <h2 className="text-4xl font-semibold mb-4">{currentWeather.phase}</h2>
              <div className="mb-4">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${riskSignal.className}`}>
                  {riskSignal.label}
                </span>
                <details className="mt-2 rounded-xl border border-zinc-700/80 bg-zinc-950/50 p-3 text-sm text-zinc-300">
                  <summary className="cursor-pointer select-none text-xs uppercase tracking-[0.14em] text-zinc-400">
                    Why this level?
                  </summary>
                  <p className="mt-2 text-zinc-300">{riskSignal.reason}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {riskSignal.thresholds}
                  </p>
                </details>
              </div>
              <p className="text-lg text-zinc-300 leading-relaxed">{currentWeather.summary}</p>
              {forecast?.advice ? (
                <p className="text-sm text-zinc-400 mt-4">Guidance: {forecast.advice}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 text-center flex-shrink-0 min-w-[220px]">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-zinc-700/80 bg-zinc-950/60 px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-2xl font-light ${metric.numberClass}`}>{metric.value}</p>
                    <p className="text-[10px] text-zinc-500 tracking-[0.22em] uppercase">{metric.label}</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full ${metric.barClass}`}
                      style={{ width: `${Math.max(8, Math.min(100, metric.value))}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-zinc-700/80">
                <p className="text-3xl font-light text-violet-300">{currentWeather.cafeIndex ?? '--'}</p>
                <p className="text-xs text-zinc-500 tracking-widest">CAFE INDEX</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-12">
          <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-6 px-2">Pressure Radar</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/70 border border-zinc-700 rounded-2xl p-6"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 mb-4">Live Pressure Map</p>
              <div className="space-y-4">
                {pressureRadarWithTrend.map((metric) => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-zinc-300">{metric.label}</span>
                      <span className="inline-flex items-center gap-2">
                        <span className="text-zinc-400">{Math.round(metric.value)}</span>
                        <span className={`inline-flex items-center gap-1 ${metric.trendClass}`}>
                          <span>{metric.trendGlyph}</span>
                          <span className="text-[10px] uppercase tracking-[0.14em]">{metric.trendLabel}</span>
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full ${metric.color}`}
                        style={{ width: `${Math.max(8, Math.min(100, metric.value))}%` }}
                      />
                    </div>
                    <details className="mt-2 rounded-lg border border-zinc-700/80 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-300">
                      <summary className="cursor-pointer select-none uppercase tracking-[0.14em] text-[10px] text-zinc-500">
                        Why this trend?
                      </summary>
                      <p className="mt-2 leading-relaxed">{metric.trendReason}</p>
                      <p className="mt-1 text-zinc-500">{metric.trendThresholds}</p>
                    </details>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-zinc-900/70 border border-zinc-700 rounded-2xl p-6"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 mb-4">Pressure Windows</p>
              <div className="space-y-3">
                {windows.map((slot) => (
                  <div key={slot.time} className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">{slot.time}</span>
                      {slot.icon}
                    </div>
                    <p className="text-sm text-zinc-100 leading-relaxed">{slot.condition}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/70 border border-zinc-700 rounded-2xl p-6"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 mb-4">Daily Forecast</p>
            <p className="text-sm text-zinc-200 leading-relaxed mb-3">
              What to protect, push, and recover today.
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {forecast?.advice || 'Use the radar as directional guidance, then choose one grounded action.'}
            </p>
            <div className="mt-4 space-y-2">
              {todaysMoves.slice(0, 3).map((move, idx) => {
                const label = idx === 0 ? 'Protect' : idx === 1 ? 'Push' : 'Recover';
                return (
                  <div key={idx} className="rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">{label}</p>
                    {move}
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-gradient-to-br from-violet-950/70 to-zinc-900 border border-violet-500/30 rounded-2xl p-6"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-violet-300/80 mb-4">Oracle Pulse</p>
            <p className="text-lg text-zinc-100 leading-relaxed">{oraclePulse}</p>
            <p className="mt-4 text-sm text-zinc-400">
              Move with timing, not panic. Let pressure inform your sequence, not your identity.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mb-12 bg-zinc-900/70 border border-zinc-700 rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Mini Transit Wheel</p>
            <div className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/60 p-1">
              <button
                type="button"
                onClick={() => setWheelMode('compact')}
                className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em] transition ${
                  wheelMode === 'compact' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => setWheelMode('expanded')}
                className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em] transition ${
                  wheelMode === 'expanded' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Expanded
              </button>
            </div>
          </div>
          {wheelData ? (
            <>
              {wheelMode === 'compact' ? (
                <div className="h-[360px] lg:h-[430px] rounded-xl border border-zinc-700/80 overflow-hidden bg-black transition-all duration-300">
                  <TransitArcMini chartData={wheelData} />
                </div>
              ) : (
                <div className="h-[470px] lg:h-[560px] rounded-xl border border-zinc-700/80 overflow-hidden bg-black transition-all duration-300">
                  <div className="h-full w-full origin-center scale-[0.96] lg:scale-[1.02] transition-transform duration-300">
                    <WheelVisualization chartData={wheelData} />
                  </div>
                </div>
              )}
              <p className="mt-3 text-xs text-zinc-500">
                {wheelMode === 'compact'
                  ? 'Arc mode mirrors your transit flow in a mobile-first visual style. Switch to Expanded for the full interactive wheel with transit overlay toggle.'
                  : 'Use the toggle inside the wheel to overlay live transits.'}
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/60 p-5">
              <p className="text-sm text-zinc-300">
                Transit wheel is waiting for chart data. Calculate and save a birth chart first.
              </p>
              <Link
                href="/astro-calculator"
                className="inline-flex mt-3 text-sm text-cyan-300 hover:text-cyan-200 transition"
              >
                Open Calculator
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-violet-950 to-zinc-900 border border-violet-500/30 rounded-3xl p-10"
        >
          <div className="max-w-lg">
            <div className="flex items-center gap-4 mb-6">
              <MessageCircle className="w-8 h-8 text-violet-400" />
              <h3 className="text-3xl font-semibold">Talk to Merlin</h3>
            </div>
            <p className="text-zinc-400 text-lg mb-8">
              What should you focus on today?
              <br />
              Where is pressure building?
              <br />
              What timing should you respect?
            </p>
            <Link
              href="/oracle-chat"
              className="inline-flex items-center gap-3 bg-white hover:bg-zinc-100 text-black px-8 py-4 rounded-2xl font-semibold transition"
            >
              Ask Merlin Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>

        <Link
          href="/oracle-chat"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-sm font-semibold shadow-xl hover:bg-zinc-100 transition"
        >
          <MessageCircle className="w-4 h-4" />
          Ask Merlin
        </Link>
      </div>
    </div>
  );
}
