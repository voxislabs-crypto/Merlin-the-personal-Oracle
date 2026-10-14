'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import shadowsRaw from '@/data/mbti-shadows.json';

interface ShadowEntry {
  archetype: string;
  description: string;
  recovery: string;
}

const shadows = shadowsRaw as Record<string, Record<string, ShadowEntry>>;

/** v2: the previous key was written as collapsed on first paint, so it cannot carry the expanded default. */
const SHADOW_INFO_STORAGE_KEY = 'merlin:shadow-info:expanded:v2';

export interface ShadowTransitItem {
  transitingPlanet?: string;
  natalPlanet?: string;
  aspect?: string;
  orb?: number;
}

function findShadowTrigger(
  transits?: { significant?: ShadowTransitItem[]; approaching?: ShadowTransitItem[] } | null
): { trigger: string; orb: number } | null {
  if (!transits) return null;
  const all: ShadowTransitItem[] = [...(transits.significant || []), ...(transits.approaching || [])];
  let best: { trigger: string; orb: number } | null = null;
  for (const t of all) {
    const planet = t.transitingPlanet?.toLowerCase() || '';
    const aspect = t.aspect?.toLowerCase() || '';
    const natal = t.natalPlanet?.toLowerCase() || '';
    const orb = t.orb ?? 99;
    let name: string | null = null;
    if (planet === 'mars' && aspect === 'square' && natal === 'moon') name = 'Mars square Moon';
    else if (planet === 'saturn' && aspect === 'opposition' && natal === 'sun') name = 'Saturn opposition Sun';
    else if (planet === 'saturn' && aspect === 'square' && natal === 'moon') name = 'Saturn square Moon';
    else if (planet === 'pluto' && aspect === 'opposition' && natal === 'moon') name = 'Pluto opposition Moon';
    else if (planet === 'pluto' && aspect === 'square' && natal === 'moon') name = 'Pluto square Moon';
    else if (planet === 'mars' && aspect === 'opposition' && natal === 'sun') name = 'Mars opposition Sun';
    if (name && (!best || orb < best.orb)) best = { trigger: name, orb };
  }
  return best;
}

interface YourShadowSectionProps {
  mbtiType?: string | null;
  transits?: { significant?: ShadowTransitItem[]; approaching?: ShadowTransitItem[] } | null;
  onAskContext?: (label: string, prompt: string) => void;
  selectedContextLabel?: string;
}

/**
 * You-tab shadow block. The section title sits above the name card, and the explainer starts open.
 */
export function YourShadowSection({
  mbtiType,
  transits,
  onAskContext,
  selectedContextLabel,
}: YourShadowSectionProps) {
  const [showShadowInfo, setShowShadowInfo] = useState(true);
  const [shadowPrefLoaded, setShadowPrefLoaded] = useState(false);
  const typeKey = (mbtiType || '').toUpperCase();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(SHADOW_INFO_STORAGE_KEY);
      if (saved === 'true') setShowShadowInfo(true);
      if (saved === 'false') setShowShadowInfo(false);
    } catch {
      // no-op
    } finally {
      setShadowPrefLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !shadowPrefLoaded) return;
    try {
      window.localStorage.setItem(SHADOW_INFO_STORAGE_KEY, String(showShadowInfo));
    } catch {
      // no-op
    }
  }, [showShadowInfo, shadowPrefLoaded]);

  const shadowTrigger = useMemo(() => findShadowTrigger(transits), [transits]);

  // Stable per type for this mount. A new type may draw a different name.
  const shadowEntry = useMemo<ShadowEntry | null>(() => {
    if (!typeKey) return null;
    const s = shadows[typeKey];
    if (!s) return null;
    const keys = Object.keys(s);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return s[key] ?? null;
  }, [typeKey]);

  if (!typeKey) return null;

  const rising = Boolean(shadowTrigger && shadowTrigger.orb < 2);
  const approaching = Boolean(shadowTrigger && shadowTrigger.orb >= 2 && shadowTrigger.orb < 4);

  return (
    <section aria-labelledby="your-shadow-heading" className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-200/80">
          Self · shadow
        </p>
        <h2
          id="your-shadow-heading"
          className="mt-1 flex items-center gap-2 text-xl font-bold text-rose-50 md:text-2xl"
        >
          <AlertTriangle className="h-6 w-6 shrink-0 text-rose-300" aria-hidden />
          Your Shadow
        </h2>
      </div>

      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50">
        <button
          type="button"
          onClick={() => setShowShadowInfo((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-800/30"
          aria-expanded={showShadowInfo}
          aria-controls="shadow-info-details"
          title={showShadowInfo ? 'Hide shadow explanation' : 'Read shadow explanation'}
        >
          <span className="text-sm font-semibold text-slate-300">What is the Shadow?</span>
          <span className="text-xs text-slate-400">
            {showShadowInfo ? 'Hide explanation' : 'Read explanation'}
          </span>
        </button>
        {showShadowInfo ? (
          <div
            id="shadow-info-details"
            className="border-t border-slate-700/40 px-4 pb-4 text-sm leading-relaxed text-slate-300"
          >
            <p className="pt-3">
              The shadow is the dark side of personality: traits, impulses, and emotional reactions you carry but don’t usually show in your everyday identity.
            </p>
            <p className="mt-2">
              It often appears under stress, conflict, rejection, or exhaustion. Shadow does not mean “bad person” — it means unintegrated parts of you that need awareness, ownership, and healthier expression.
            </p>
          </div>
        ) : null}
      </div>

      {shadowEntry ? (
        <div
          className={`relative overflow-hidden rounded-lg border-2 transition-colors duration-500 ${
            rising
              ? 'border-red-500/60 bg-gradient-to-br from-red-950/60 to-slate-900/80'
              : approaching
              ? 'border-amber-600/50 bg-gradient-to-br from-amber-950/40 to-slate-900/80'
              : 'border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/70'
          } ${onAskContext ? 'cursor-pointer' : ''} ${selectedContextLabel === 'Shadow name' ? 'ring-1 ring-cyan-300/40' : ''}`}
          onClick={
            onAskContext
              ? () =>
                  onAskContext(
                    'Shadow name',
                    'Explain my shadow archetype, why it activates, and what healthier expression looks like.',
                  )
              : undefined
          }
        >
          {rising ? <div className="pointer-events-none absolute inset-0 bg-red-900/10" /> : null}

          <div className="relative z-10 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`h-4 w-4 flex-shrink-0 ${
                    rising ? 'text-red-400' : approaching ? 'text-amber-400' : 'text-slate-500'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Your Shadow Name
                </span>
              </div>
              {shadowTrigger ? (
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    rising
                      ? 'border-red-500/40 bg-red-500/20 text-red-300'
                      : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {rising ? '⚡ Rising Now' : '⚠ Approaching'}
                </span>
              ) : null}
            </div>

            <p
              className={`mb-0.5 text-2xl font-bold ${
                rising ? 'text-red-300' : approaching ? 'text-amber-300' : 'text-slate-300'
              }`}
            >
              {shadowEntry.archetype}
            </p>
            <p className="mb-3 text-xs text-slate-500">Your hidden side when pressure hits</p>

            {rising && shadowTrigger ? (
              <p className="mb-3 text-sm font-medium text-red-300/90">
                Shadow Alert: {shadowEntry.archetype} is rising — {shadowTrigger.trigger} ({shadowTrigger.orb.toFixed(1)}° orb). Watch for it.
              </p>
            ) : null}
            {approaching && shadowTrigger ? (
              <p className="mb-3 text-sm text-amber-300/80">
                {shadowTrigger.trigger} ({shadowTrigger.orb.toFixed(1)}° orb) — shadow pressure building. Heads up.
              </p>
            ) : null}

            <p className="mb-4 text-sm leading-relaxed text-slate-300">{shadowEntry.description}</p>

            <div className="border-t border-slate-700/50 pt-3">
              <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">Recovery</p>
              <p className="text-sm italic text-slate-400">{shadowEntry.recovery}</p>
              {onAskContext ? (
                <p
                  className={`mt-2 text-[11px] ${
                    selectedContextLabel === 'Shadow name' ? 'text-cyan-100' : 'text-cyan-200/70'
                  }`}
                >
                  {selectedContextLabel === 'Shadow name'
                    ? 'Selected for Merlin'
                    : 'Click card to ask Merlin about your shadow'}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
