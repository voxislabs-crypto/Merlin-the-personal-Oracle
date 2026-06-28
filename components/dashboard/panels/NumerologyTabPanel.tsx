'use client';

import { useEffect, useMemo, useState, type Ref } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Hash, Sparkles, CalendarRange, Orbit } from 'lucide-react';
import {
  buildAstroNumerologyBlend,
  buildNumerologyBlueprint,
  getNumberMeaning,
  type CoreNumber,
  type NumerologyBlueprint,
} from '@/lib/numerology';
import { PremiumUpgradeBanner } from '@/components/dashboard/PremiumUpgradeBanner';

const NUMEROLOGY_NAME_KEY = 'merlin_numerology_full_name_v1';

interface NumerologyTabPanelProps {
  birthDate?: string;
  sunSign?: string;
  moonSign?: string;
  premiumLocked?: boolean;
  tier?: string;
  onAskMerlin?: (label: string, prompt: string) => void;
  blueprintRef?: Ref<HTMLDivElement>;
  cyclesRef?: Ref<HTMLDivElement>;
  blendRef?: Ref<HTMLDivElement>;
}

function NumberCard({
  label,
  number,
  subtitle,
  locked = false,
}: {
  label: string;
  number: CoreNumber | null;
  subtitle: string;
  locked?: boolean;
}) {
  const meaning = getNumberMeaning(number);

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-slate-950/90 via-violet-950/30 to-slate-900/80 p-4 shadow-lg shadow-violet-950/20">
      <p className="text-[11px] uppercase tracking-[0.28em] text-violet-200/70">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-4xl font-bold text-amber-100">{locked ? '—' : number ?? '—'}</span>
        {!locked && meaning ? (
          <span className="pb-1 text-sm font-medium text-violet-100">{meaning.title}</span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      {!locked && meaning ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{meaning.essence}</p>
      ) : locked ? (
        <p className="mt-3 text-sm text-amber-100/80">Unlock premium for full name-based numbers.</p>
      ) : null}
    </div>
  );
}

export function NumerologyTabPanel({
  birthDate,
  sunSign,
  moonSign,
  premiumLocked = false,
  tier,
  onAskMerlin,
  blueprintRef,
  cyclesRef,
  blendRef,
}: NumerologyTabPanelProps) {
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(NUMEROLOGY_NAME_KEY);
    if (saved) setFullName(saved);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(NUMEROLOGY_NAME_KEY, fullName);
  }, [fullName]);

  const blueprint: NumerologyBlueprint | null = useMemo(() => {
    if (!birthDate) return null;
    return buildNumerologyBlueprint(birthDate, fullName.trim());
  }, [birthDate, fullName]);

  const blendText = useMemo(
    () =>
      buildAstroNumerologyBlend({
        lifePath: blueprint?.lifePath ?? null,
        sunSign,
        moonSign,
        personalYear: blueprint?.personalYear ?? null,
      }),
    [blueprint?.lifePath, blueprint?.personalYear, moonSign, sunSign]
  );

  if (!birthDate) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-8 text-center text-slate-300">
        Calculate your birth chart first — Merlin will use the same birth date for your numerical blueprint.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-950/40 via-slate-950/90 to-amber-950/20 p-5 md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(167,139,250,0.16),_transparent_42%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-200">
              <Hash className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em]">Numerical Blueprint</span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Pythagorean numerology layer</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Vibrational numbers from your birth date and full name — timed with today&apos;s cycles and your chart.
            </p>
          </div>
          <label className="relative w-full max-w-md">
            <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Full birth name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="First Middle Last"
              className="w-full rounded-xl border border-slate-600/70 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {premiumLocked ? <PremiumUpgradeBanner tier={tier} compact /> : null}

      <div ref={blueprintRef} className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <h3 className="text-lg font-semibold text-amber-100">Core numbers</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <NumberCard
            label="Life Path"
            number={blueprint?.lifePath ?? null}
            subtitle="Birth date — your soul curriculum"
          />
          <NumberCard
            label="Destiny"
            number={blueprint?.destiny ?? null}
            subtitle="Full name — expression in the world"
            locked={premiumLocked || !fullName.trim()}
          />
          <NumberCard
            label="Soul Urge"
            number={blueprint?.soulUrge ?? null}
            subtitle="Vowels — inner motivation"
            locked={premiumLocked || !fullName.trim()}
          />
          <NumberCard
            label="Personality"
            number={blueprint?.personality ?? null}
            subtitle="Consonants — outer impression"
            locked={premiumLocked || !fullName.trim()}
          />
        </div>
      </div>

      <div ref={cyclesRef} className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-cyan-300" />
          <h3 className="text-lg font-semibold text-cyan-100">Personal cycles</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <NumberCard
            label="Personal Year"
            number={blueprint?.personalYear ?? null}
            subtitle="Theme for the current year"
            locked={premiumLocked}
          />
          <NumberCard
            label="Personal Month"
            number={blueprint?.personalMonth ?? null}
            subtitle="Focus for this month"
            locked={premiumLocked}
          />
          <NumberCard
            label="Personal Day"
            number={blueprint?.personalDay ?? null}
            subtitle="Tone for today"
            locked={premiumLocked}
          />
        </div>
      </div>

      <div ref={blendRef} className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Orbit className="h-4 w-4 text-amber-200" />
          <h3 className="text-lg font-semibold text-amber-50">Astrology + numerology blend</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-200">{blendText}</p>
        {onAskMerlin ? (
          <button
            type="button"
            onClick={() =>
              onAskMerlin(
                'Numerology blend',
                `Explain how my Life Path ${blueprint?.lifePath ?? ''}, Personal Year ${blueprint?.personalYear ?? ''}, ${sunSign ? `${sunSign} Sun` : 'Sun sign'}, and ${moonSign ? `${moonSign} Moon` : 'Moon sign'} work together this season. Give one practical move for today.`,
              )
            }
            className="mt-4 rounded-xl border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-500/30"
          >
            Ask Merlin about this blend
          </button>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        For insight and entertainment. Master numbers 11, 22, and 33 are preserved where applicable.{' '}
        <Link href="/terms" className="underline underline-offset-2 hover:text-slate-400">
          Terms
        </Link>
      </p>
    </div>
  );
}