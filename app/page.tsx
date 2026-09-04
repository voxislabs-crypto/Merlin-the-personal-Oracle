'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, Calendar, Clock, CloudLightning, Compass, Loader2, MapPin, Radar } from 'lucide-react';
import { GeocodingService } from '@/lib/astrology/geocoding';

export const dynamic = 'force-dynamic';

type DemoStorm = {
  title: string;
  intensity: string;
};

type DemoResult = {
  sunSign: string;
  core: string;
  mask: string;
  storm: DemoStorm | null;
};

const HARD_ASPECTS = new Set(['square', 'opposition', 'conjunction']);

function planetSign(chart: Record<string, unknown> | null | undefined, name: string): string | null {
  const rows = (chart?.planets || chart?.positions) as Array<{ name?: string; sign?: string }> | undefined;
  const hit = rows?.find((row) => (row.name || '').toLowerCase() === name.toLowerCase());
  return hit?.sign || null;
}

function intensityRank(value: string): number {
  const v = value.toLowerCase();
  if (v === 'strong' || v === 'severe') return 3;
  if (v === 'moderate') return 2;
  if (v === 'weak' || v === 'mild') return 1;
  return 0;
}

function pickTopStorm(chart: Record<string, unknown> | null | undefined): DemoStorm | null {
  const transits = (chart?.transits || []) as Array<{
    transitingPlanet?: string;
    natalPlanet?: string;
    aspect?: string;
    orb?: number;
    exact?: boolean;
    intensity?: string;
    theme?: string;
  }>;
  if (!transits.length) return null;

  const ranked = [...transits].sort((a, b) => {
    const aHard = HARD_ASPECTS.has((a.aspect || '').toLowerCase()) ? 1 : 0;
    const bHard = HARD_ASPECTS.has((b.aspect || '').toLowerCase()) ? 1 : 0;
    if (bHard !== aHard) return bHard - aHard;
    const aExact = a.exact ? 1 : 0;
    const bExact = b.exact ? 1 : 0;
    if (bExact !== aExact) return bExact - aExact;
    const aInt = intensityRank(String(a.intensity || ''));
    const bInt = intensityRank(String(b.intensity || ''));
    if (bInt !== aInt) return bInt - aInt;
    return (a.orb ?? 99) - (b.orb ?? 99);
  });

  const top = ranked[0];
  if (!top) return null;
  const title =
    top.theme ||
    [top.transitingPlanet, top.aspect, top.natalPlanet].filter(Boolean).join(' ') ||
    'Active transit';
  return {
    title,
    intensity: String(top.intensity || (top.exact ? 'strong' : 'moderate')),
  };
}

function stormTone(intensity: string): string {
  const v = intensity.toLowerCase();
  if (v === 'strong' || v === 'severe') return 'text-rose-200';
  if (v === 'moderate') return 'text-amber-200';
  return 'text-sky-200';
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthCity, setBirthCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);

  const canSubmit = Boolean(birthDate && birthTime && birthCity.trim());

  const signupHref = useMemo(() => {
    const params = new URLSearchParams();
    if (birthDate) params.set('date', birthDate);
    if (birthTime) params.set('time', birthTime);
    if (birthCity.trim()) params.set('city', birthCity.trim());
    const dashboard = params.toString() ? `/dashboard?${params.toString()}` : '/dashboard';
    return `/sign-up?redirect_url=${encodeURIComponent(dashboard)}`;
  }, [birthDate, birthTime, birthCity]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError(null);

    try {
      const location = await GeocodingService.validateLocation(birthCity.trim());
      if (!location) {
        setError('Could not find that city. Try a fuller name — city and country.');
        setResult(null);
        return;
      }

      const timezoneOffset = -new Date().getTimezoneOffset() / 60;
      const response = await fetch('/api/calculate-birth-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate,
          birthTime,
          lat: location.latitude,
          lon: location.longitude,
          timezoneOffset,
          purpose: 'landing-preview',
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !payload?.data) {
        setError(payload?.error || 'Could not read that chart. Try again.');
        setResult(null);
        return;
      }

      const chart = payload.data as Record<string, unknown>;
      const snapshot = (chart.personalitySnapshot || {}) as {
        firmware?: string;
        hardware?: string;
        finalType?: string;
      };
      const sunSign = planetSign(chart, 'Sun') || 'Unknown';
      const core = snapshot.firmware || snapshot.finalType || '—';
      const mask = snapshot.hardware || core;

      const next: DemoResult = {
        sunSign,
        core,
        mask,
        storm: pickTopStorm(chart),
      };
      setResult(next);

      try {
        sessionStorage.setItem(
          'merlin:landing-demo',
          JSON.stringify({
            birthDate,
            birthTime,
            birthCity: location.displayName || birthCity.trim(),
            lat: location.latitude,
            lon: location.longitude,
          }),
        );
      } catch {
        // ignore
      }
    } catch {
      setError('Something went wrong reading the chart. Try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.14),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(251,191,36,0.08),_transparent_45%)]" />
        <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 1000 1000" aria-hidden>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#38bdf8', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle
            cx="500"
            cy="420"
            r="400"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="2"
            opacity="0.35"
            filter="url(#glow)"
          >
            <animate attributeName="r" values="400;440;400" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle
            cx="500"
            cy="420"
            r="280"
            fill="none"
            stroke="url(#grad2)"
            strokeWidth="1.5"
            opacity="0.25"
            filter="url(#glow)"
          >
            <animate attributeName="r" values="280;320;280" dur="12s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="relative z-10 px-4 pt-28 pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-6 flex justify-center"
          >
            <Image
              src="/merlin-logo.png"
              alt="Merlin"
              width={160}
              height={160}
              className="h-28 w-28 object-contain md:h-36 md:w-36"
              priority
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-300 bg-clip-text text-transparent"
          >
            Your birth chart, read like weather.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-lg text-slate-300 md:text-xl"
          >
            Not a horoscope. A forecast built from your actual natal chart.
          </motion.p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mx-auto mt-10 max-w-3xl rounded-2xl border border-sky-500/30 bg-slate-950/55 p-3 shadow-lg shadow-sky-950/20 backdrop-blur-md sm:p-4"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1.3fr_auto]">
            <label className="relative block">
              <span className="sr-only">Birth date</span>
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300/80" />
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-slate-900/80 pl-10 pr-3 text-sm text-white outline-none ring-sky-400/40 focus:ring-2"
              />
            </label>
            <label className="relative block">
              <span className="sr-only">Birth time</span>
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300/80" />
              <input
                type="time"
                required
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-slate-900/80 pl-10 pr-3 text-sm text-white outline-none ring-sky-400/40 focus:ring-2"
              />
            </label>
            <label className="relative block">
              <span className="sr-only">Birth city</span>
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300/80" />
              <input
                type="text"
                required
                placeholder="City"
                value={birthCity}
                onChange={(e) => setBirthCity(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-slate-900/80 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none ring-sky-400/40 focus:ring-2"
              />
            </label>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-lg shadow-sky-900/40 transition hover:from-sky-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Reading…' : 'See my weather'}
            </button>
          </div>
          <p className="mt-2 px-1 text-left text-[11px] text-slate-500">
            Date, time, and city. One real result — no account required.
          </p>
        </motion.form>

        {error ? (
          <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-rose-300">{error}</p>
        ) : null}

        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 max-w-3xl rounded-2xl border border-amber-400/25 bg-slate-950/70 p-5 text-left shadow-xl shadow-amber-950/10 backdrop-blur-md md:p-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300/85">
              Your forecast
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Sun</p>
                <p className="mt-1 text-lg font-bold text-sky-100">{result.sunSign}</p>
              </div>
              <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300/80">Core · Mask</p>
                <p className="mt-1 text-lg font-bold text-violet-50">
                  {result.core}
                  {result.mask && result.mask !== result.core ? (
                    <span className="text-orange-200"> · {result.mask}</span>
                  ) : null}
                </p>
              </div>
              <div className="rounded-xl border border-rose-400/20 bg-rose-950/20 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-rose-300/80">Today&apos;s storm</p>
                {result.storm ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-rose-50">{result.storm.title}</p>
                    <p className={`mt-1 text-xs font-semibold capitalize ${stormTone(result.storm.intensity)}`}>
                      Intensity {result.storm.intensity}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-300">No hard storm scored for this moment.</p>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-sky-900/40 transition hover:from-sky-500 hover:to-cyan-500"
                >
                  Open my weather
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href={signupHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-sky-900/40 transition hover:from-sky-500 hover:to-cyan-500"
                >
                  Save this forecast
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <p className="mt-2 text-sm text-slate-400">Keep going free — no card.</p>
              <p className="mt-1 text-xs text-slate-500">
                <Link href="/checkout-subscription" className="text-sky-300/90 underline-offset-2 hover:underline">
                  $10/mo or $50 lifetime
                </Link>
              </p>
            </div>
          </motion.div>
        ) : null}

        <motion.ul
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3"
        >
          <li className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <Compass className="mb-2 h-4 w-4 text-amber-300" />
            <p className="text-sm font-semibold text-slate-100">Dual personality</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Core and mask from your natal chart — how you feel inside vs what the room meets first.
            </p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <Radar className="mb-2 h-4 w-4 text-sky-300" />
            <p className="text-sm font-semibold text-slate-100">Storm radar</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Hard windows scored as weather, not fate — when friction rises and what to do with it.
            </p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <CloudLightning className="mb-2 h-4 w-4 text-rose-300" />
            <p className="text-sm font-semibold text-slate-100">Transit timing</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Today&apos;s sky against your chart, so the move is timed to this week, not a sun-sign month.
            </p>
          </li>
        </motion.ul>
      </div>

      <footer className="relative z-10 border-t border-white/10 bg-slate-950/60 px-4 py-8">
        <div className="mx-auto max-w-3xl text-center text-sm text-slate-500">
          <p>
            <Link href="/checkout-subscription" className="text-sky-300/90 underline-offset-2 hover:underline">
              $10/mo or $50 lifetime
            </Link>
            <span className="text-slate-600"> · </span>
            7 days free on monthly
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Merlin is for self-reflection, not medical, legal, or financial advice.{' '}
            <Link href="/terms" className="text-sky-300/80 hover:text-sky-200">
              Terms
            </Link>
            {' · '}
            <Link href="/privacy" className="text-sky-300/80 hover:text-sky-200">
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
