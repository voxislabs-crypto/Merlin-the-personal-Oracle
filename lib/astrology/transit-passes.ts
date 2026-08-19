/**
 * Transit pass awareness — first hit, retrograde review, final resolution.
 *
 * A 7-day weather scan cannot see Saturn's three exact hits. This module:
 *  1. Detects exact-pass minima when a longer sample series is provided
 *  2. Falls back to a slow-planet heuristic (direct vs retrograde vs separating)
 *
 * Meanings are lived-experience, not ephemeris jargon.
 */

export type TransitPassKind = 'first' | 'retrograde' | 'final' | 'single';

export interface TransitPassSample {
  date: string;
  orb: number;
  retrograde?: boolean;
}

export interface TransitPass {
  kind: TransitPassKind;
  /** 1-based. Single-pass events are always 1. */
  passIndex: number;
  passCount: number;
  exactDate?: string;
  retrograde: boolean;
  meaning: string;
  heuristic: boolean;
}

const SLOW = new Set(['jupiter', 'saturn', 'uranus', 'neptune', 'pluto']);

const MEANING: Record<TransitPassKind, string> = {
  first: 'The issue is introduced. Notice what shows up — do not force a finale.',
  retrograde: 'The issue returns for review. The first-pass version was incomplete.',
  final: 'The last pass — close, decide, or let the structure finish changing.',
  single: 'A single pass. It happens once and moves on.',
};

function norm(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function isMultiPassPlanet(planet: string): boolean {
  return SLOW.has(norm(planet));
}

export function passMeaning(kind: TransitPassKind): string {
  return MEANING[kind];
}

/**
 * Find local orb-minima that look like exact hits (orb under `maxOrb`
 * and tighter than both neighbors).
 */
export function detectExactPasses(
  samples: TransitPassSample[],
  maxOrb = 1.2,
): Array<{ date: string; orb: number; retrograde: boolean; passIndex: number }> {
  if (samples.length === 0) return [];
  const sorted = [...samples].sort((a, b) => a.date.localeCompare(b.date));
  const minima: Array<{ date: string; orb: number; retrograde: boolean }> = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (cur.orb > maxOrb) continue;
    const tighterThanPrev = !prev || cur.orb <= prev.orb;
    const tighterThanNext = !next || cur.orb < next.orb;
    if (tighterThanPrev && tighterThanNext) {
      minima.push({
        date: cur.date,
        orb: cur.orb,
        retrograde: Boolean(cur.retrograde),
      });
    }
  }

  return minima.map((hit, index) => ({
    ...hit,
    passIndex: index + 1,
  }));
}

export function classifyPassKind(params: {
  passIndex: number;
  passCount: number;
  retrograde?: boolean;
}): TransitPassKind {
  if (params.passCount <= 1) return 'single';
  if (params.retrograde) return 'retrograde';
  if (params.passIndex >= params.passCount) return 'final';
  if (params.passIndex === 1) return 'first';
  return 'retrograde';
}

/**
 * When we only know "now" (no 12-month scan):
 *  - fast planet → single
 *  - slow + retrograde → second / review
 *  - slow + releasing + direct → treat as final
 *  - otherwise first
 */
export function inferPassKind(params: {
  transitingPlanet: string;
  retrograde?: boolean;
  phase?: 'building' | 'peaking' | 'releasing';
}): TransitPass {
  if (!isMultiPassPlanet(params.transitingPlanet)) {
    return {
      kind: 'single',
      passIndex: 1,
      passCount: 1,
      retrograde: Boolean(params.retrograde),
      meaning: MEANING.single,
      heuristic: true,
    };
  }

  if (params.retrograde) {
    return {
      kind: 'retrograde',
      passIndex: 2,
      passCount: 3,
      retrograde: true,
      meaning: MEANING.retrograde,
      heuristic: true,
    };
  }

  if (params.phase === 'releasing') {
    return {
      kind: 'final',
      passIndex: 3,
      passCount: 3,
      retrograde: false,
      meaning: MEANING.final,
      heuristic: true,
    };
  }

  return {
    kind: 'first',
    passIndex: 1,
    passCount: 3,
    retrograde: false,
    meaning: MEANING.first,
    heuristic: true,
  };
}

export function resolveTransitPass(params: {
  transitingPlanet: string;
  samples?: TransitPassSample[];
  today?: string;
  retrograde?: boolean;
  phase?: 'building' | 'peaking' | 'releasing';
}): TransitPass {
  const detected = params.samples?.length ? detectExactPasses(params.samples) : [];
  if (detected.length >= 1 && params.today) {
    const current =
      detected.find((hit) => hit.date === params.today) ||
      detected.reduce((best, hit) =>
        Math.abs(dateDelta(hit.date, params.today!)) < Math.abs(dateDelta(best.date, params.today!))
          ? hit
          : best,
      );
    const kind = classifyPassKind({
      passIndex: current.passIndex,
      passCount: detected.length,
      retrograde: current.retrograde,
    });
    return {
      kind,
      passIndex: current.passIndex,
      passCount: detected.length,
      exactDate: current.date,
      retrograde: current.retrograde,
      meaning: MEANING[kind],
      heuristic: false,
    };
  }

  return inferPassKind({
    transitingPlanet: params.transitingPlanet,
    retrograde: params.retrograde,
    phase: params.phase,
  });
}

function dateDelta(a: string, b: string): number {
  return Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`);
}
