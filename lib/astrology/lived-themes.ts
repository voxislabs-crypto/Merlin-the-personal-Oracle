/**
 * Theme-centric lived significance.
 *
 * Humans do not experience transits. They experience themes assembled
 * from several techniques at once:
 *
 *   transit + progression + solar arc + ingress + angle
 *     → theme extraction
 *     → theme strength
 *     → narrative (symbolic emphasis, not event prediction)
 *
 * Valence (good/bad) is the wrong axis. Periods are often both
 * difficult and rewarding. We score pressure / growth / instability /
 * visibility independently.
 *
 * Feedback may weight *which symbolic families a person responds to*.
 * It must never teach the engine "Saturn square Sun = career event."
 */

import type { MentionWorthyItem, MentionWorthySet } from '@/lib/astrology/mention-worthy';
import type { ForecastDomain } from '@/lib/astrology/mention-worthy';
import {
  findNatalAspect,
  natalImportance,
  type NatalSensitivityContext,
} from '@/lib/astrology/natal-sensitivity';
import type { SolarArcHit } from '@/lib/astrology/solar-arc';

export type SignalSource =
  | 'transit'
  | 'progression'
  | 'solar-arc'
  | 'solar-return'
  | 'ingress'
  | 'angle'
  | 'house';

export interface ThemeSignal {
  source: SignalSource;
  label: string;
  actor: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  impact: number;
  house?: number;
  retrograde?: boolean;
  phase?: 'building' | 'peaking' | 'releasing';
  start?: string;
  peak?: string;
  end?: string;
}

export interface IntensityCurve {
  start?: string;
  buildUp?: string;
  peak?: string;
  integration?: string;
  phase: 'building' | 'peaking' | 'integrating' | 'releasing';
}

export interface LivedTheme {
  id: string;
  theme: string;
  impact: number;
  pressure: number;
  growth: number;
  instability: number;
  visibility: number;
  stabilityShift: number;
  signalStrength: number;
  interpretationConfidence: number;
  natalResonance: number;
  internalTension: number;
  domains: Partial<Record<ForecastDomain, number>>;
  contributors: Array<{
    label: string;
    source: SignalSource;
    natalImportance: number;
    actor?: string;
    natalPlanet?: string;
  }>;
  curve: IntensityCurve;
  reflectivePrompt: string;
}

export interface LivedThemePacket {
  themes: LivedTheme[];
  domains: Record<ForecastDomain, number>;
  framing: 'symbolic-emphasis';
}

const EMPTY_DOMAINS: Record<ForecastDomain, number> = {
  identity: 0,
  career: 0,
  relationships: 0,
  health: 0,
  home: 0,
  money: 0,
};

function norm(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

const TARGET_DOMAINS: Record<string, ForecastDomain[]> = {
  sun: ['identity'],
  ascendant: ['identity'],
  rising: ['identity'],
  midheaven: ['career'],
  mc: ['career'],
  moon: ['home', 'health'],
  'imum coeli': ['home'],
  ic: ['home'],
  descendant: ['relationships'],
  venus: ['relationships', 'money'],
  mercury: ['career'],
  mars: ['health', 'career'],
  jupiter: ['career', 'money'],
  saturn: ['career'],
  uranus: ['identity'],
  neptune: ['health'],
  pluto: ['identity'],
};

function domainsFor(signal: ThemeSignal): ForecastDomain[] {
  const houseMatch = signal.natalPlanet.match(/house\s*(\d+)/i);
  const house = signal.house ?? (houseMatch ? Number(houseMatch[1]) : undefined);
  const fromTarget = TARGET_DOMAINS[norm(signal.natalPlanet)] || [];
  const fromHouse: ForecastDomain[] =
    house === 1
      ? ['identity']
      : house === 10
        ? ['career']
        : house === 7
          ? ['relationships']
          : house === 4
            ? ['home']
            : house === 2 || house === 8
              ? ['money']
              : house === 6
                ? ['health']
                : [];
  return Array.from(new Set([...fromTarget, ...fromHouse]));
}

function isHard(aspect: string): boolean {
  const a = norm(aspect);
  return a === 'square' || a === 'opposition' || a === 'conjunction' || a === 'ingress';
}

function dimensionSeed(actor: string, aspect: string): {
  pressure: number;
  growth: number;
  instability: number;
  visibility: number;
} {
  const planet = norm(actor);
  const hard = isHard(aspect);
  let pressure = hard ? 42 : 12;
  let growth = hard ? 18 : 40;
  let instability = hard ? 28 : 10;
  let visibility = 20;

  if (planet === 'saturn') {
    pressure += 40;
    growth += 36;
    instability -= 8;
  } else if (planet === 'pluto') {
    pressure += 30;
    growth += 22;
    instability += 25;
  } else if (planet === 'uranus') {
    pressure += 8;
    growth += 18;
    instability += 50;
    visibility += 22;
  } else if (planet === 'neptune') {
    pressure += 10;
    growth += 12;
    instability += 30;
    visibility -= 8;
  } else if (planet === 'jupiter') {
    pressure -= 20;
    growth += 48;
    instability += 6;
    visibility += 16;
  } else if (planet === 'mars') {
    pressure += 22;
    instability += 28;
    visibility += 10;
  } else if (planet === 'venus') {
    pressure -= 10;
    growth += 22;
    visibility += 8;
  } else if (planet === 'sun') {
    visibility += 28;
    growth += 10;
  }

  if (['ascendant', 'midheaven', 'mc'].includes(norm(aspect))) visibility += 10;

  return {
    pressure: clamp(pressure),
    growth: clamp(growth),
    instability: clamp(instability),
    visibility: clamp(visibility),
  };
}

function natalResonanceFor(
  signal: ThemeSignal,
  natal: NatalSensitivityContext,
): number {
  const natalHit = findNatalAspect(signal.actor, signal.natalPlanet, natal.aspects);
  if (!natalHit) return 18;
  const sameAspect = norm(natalHit.type) === norm(signal.aspect);
  return sameAspect ? 92 : 74;
}

export function signalsFromMentionItems(items: MentionWorthyItem[]): ThemeSignal[] {
  return items.map((item) => ({
    source: item.aspect.toLowerCase() === 'ingress' ? 'ingress' : 'transit',
    label: item.label,
    actor: item.transitingPlanet,
    natalPlanet: item.natalPlanet,
    aspect: item.aspect,
    orb: item.orb,
    impact: item.impact,
    house: undefined,
    retrograde: item.pass?.retrograde,
    phase: item.phase,
  }));
}

export function signalsFromSolarArc(hits: SolarArcHit[]): ThemeSignal[] {
  return hits.map((hit) => ({
    source: 'solar-arc' as const,
    label: `Solar arc ${hit.directedPlanet} ${hit.aspect} natal ${hit.natalPlanet}`,
    actor: hit.directedPlanet,
    natalPlanet: hit.natalPlanet,
    aspect: hit.aspect,
    orb: hit.orb,
    impact: hit.score,
  }));
}

const PROGRESSED_DAILY: Record<string, number> = {
  sun: 0.9856,
  moon: 13.176,
  mercury: 1.2,
  venus: 1.2,
  mars: 0.524,
};

export function signalsFromProgressions(
  natal: Array<{ name: string; longitude: number }>,
  ageYears: number,
  maxOrb = 1.2,
): ThemeSignal[] {
  const aspects: Array<{ name: string; angle: number }> = [
    { name: 'Conjunction', angle: 0 },
    { name: 'Opposition', angle: 180 },
    { name: 'Square', angle: 90 },
    { name: 'Trine', angle: 120 },
    { name: 'Sextile', angle: 60 },
  ];
  const signals: ThemeSignal[] = [];
  const progressed = natal.filter((body) => PROGRESSED_DAILY[norm(body.name)]);

  for (const moving of progressed) {
    const lon = (moving.longitude + PROGRESSED_DAILY[norm(moving.name)] * ageYears) % 360;
    for (const natalBody of natal) {
      if (norm(moving.name) === norm(natalBody.name)) continue;
      let diff = Math.abs(lon - natalBody.longitude);
      if (diff > 180) diff = 360 - diff;
      for (const aspect of aspects) {
        const orb = Math.abs(diff - aspect.angle);
        if (orb > maxOrb) continue;
        signals.push({
          source: 'progression',
          label: `Progressed ${moving.name} ${aspect.name} natal ${natalBody.name}`,
          actor: moving.name,
          natalPlanet: natalBody.name,
          aspect: aspect.name,
          orb,
          impact: clamp(78 - orb * 14),
        });
      }
    }
  }
  return signals;
}

function nameTheme(signals: ThemeSignal[]): { theme: string; prompt: string } {
  const actors = new Set(signals.map((s) => norm(s.actor)));
  const targets = new Set(signals.map((s) => norm(s.natalPlanet)));
  const has = (set: Set<string>, ...names: string[]) => names.some((n) => set.has(n));

  if (has(actors, 'jupiter') && has(actors, 'saturn')) {
    return {
      theme: 'expansion under constraint',
      prompt: 'Where is life asking you to grow *inside* a limit, rather than around it?',
    };
  }
  if (has(actors, 'saturn', 'pluto') && has(targets, 'sun', 'ascendant', 'rising')) {
    return {
      theme: 'restructuring identity and responsibility',
      prompt: 'Which old definition of yourself is no longer load-bearing — and what duty is replacing it?',
    };
  }
  if (has(actors, 'saturn') && has(targets, 'midheaven', 'mc', 'sun')) {
    return {
      theme: 'career responsibility',
      prompt: 'What would taking the role seriously look like if you dropped the performance of it?',
    };
  }
  if (has(actors, 'uranus') && has(targets, 'ascendant', 'rising', 'sun')) {
    return {
      theme: 'visible identity disruption',
      prompt: 'What change in how you show up is already underway — whether or not you have announced it?',
    };
  }
  if (has(actors, 'pluto') && has(targets, 'sun', 'ascendant', 'moon')) {
    return {
      theme: 'identity transformation',
      prompt: 'What is ending in how you know yourself, even if the replacement is not named yet?',
    };
  }
  if (has(actors, 'venus', 'mars') && has(targets, 'venus', 'descendant', 'moon')) {
    return {
      theme: 'relationship recalibration',
      prompt: 'Where is a bond asking for honesty rather than more effort?',
    };
  }
  if (has(targets, 'imum coeli', 'ic', 'moon') && has(actors, 'saturn', 'pluto', 'uranus')) {
    return {
      theme: 'home and foundations',
      prompt: 'What in your base of operations needs to become more true, even if it is less comfortable?',
    };
  }

  const actor = signals[0]?.actor || 'this cycle';
  const target = signals[0]?.natalPlanet || 'a personal point';
  return {
    theme: `${actor.toLowerCase()} emphasis on ${target.toLowerCase()}`,
    prompt: `What is this ${actor} contact asking you to notice about ${target.toLowerCase()} — not to predict, just to take seriously?`,
  };
}

function curveFrom(signals: ThemeSignal[]): IntensityCurve {
  const phases = signals.map((s) => s.phase).filter(Boolean);
  const peaking = phases.filter((p) => p === 'peaking').length;
  const building = phases.filter((p) => p === 'building').length;
  const releasing = phases.filter((p) => p === 'releasing').length;
  let phase: IntensityCurve['phase'] = 'peaking';
  if (building > peaking && building >= releasing) phase = 'building';
  else if (releasing > peaking && releasing >= building) phase = 'integrating';

  const peaks = signals.map((s) => s.peak).filter(Boolean) as string[];
  const starts = signals.map((s) => s.start).filter(Boolean) as string[];
  const ends = signals.map((s) => s.end).filter(Boolean) as string[];

  return {
    start: starts.sort()[0],
    buildUp: phase === 'building' ? starts.sort()[0] : undefined,
    peak: peaks.sort()[0],
    integration: ends.sort().slice(-1)[0],
    phase,
  };
}

function mergeKey(signal: ThemeSignal): string {
  const target = norm(signal.natalPlanet);
  const actor = norm(signal.actor);
  const identityBodies = ['sun', 'ascendant', 'rising'];
  const careerBodies = ['midheaven', 'mc'];
  const structure = ['saturn', 'pluto'];

  if (identityBodies.includes(target) || identityBodies.includes(actor)) {
    if (structure.includes(actor) || structure.includes(target) || identityBodies.includes(target)) {
      return 'identity';
    }
  }
  if (
    (structure.includes(actor) && careerBodies.includes(target)) ||
    (structure.includes(target) && careerBodies.includes(actor)) ||
    careerBodies.includes(target)
  ) {
    return 'career';
  }
  if (['moon', 'imum coeli', 'ic'].includes(target)) return 'home';
  if (['venus', 'descendant'].includes(target)) return 'bonds';
  return target || actor;
}

function weightedMean(rows: Array<{ value: number; weight: number }>): number {
  const total = rows.reduce((sum, row) => sum + row.weight, 0);
  if (!total) return 0;
  return rows.reduce((sum, row) => sum + row.value * row.weight, 0) / total;
}

export function extractLivedThemes(
  signals: ThemeSignal[],
  natal: NatalSensitivityContext,
  options?: { planetWeights?: Partial<Record<string, number>> },
): LivedThemePacket {
  if (signals.length === 0) {
    return { themes: [], domains: { ...EMPTY_DOMAINS }, framing: 'symbolic-emphasis' };
  }

  const enriched = signals.map((signal) => {
    const importance = natalImportance(signal.natalPlanet, natal);
    const resonance = natalResonanceFor(signal, natal);
    const weightedImpact = clamp(signal.impact * (0.5 + 0.5 * (importance / 100)));
    const dims = dimensionSeed(signal.actor, signal.aspect);
    const userWeight =
      options?.planetWeights?.[signal.actor] ??
      options?.planetWeights?.[norm(signal.actor)] ??
      1;
    return {
      signal,
      importance,
      resonance,
      weightedImpact,
      dims,
      domains: domainsFor(signal),
      userWeight: typeof userWeight === 'number' ? userWeight : 1,
    };
  });

  const buckets = new Map<string, typeof enriched>();
  for (const row of enriched) {
    const key = mergeKey(row.signal);
    const list = buckets.get(key) || [];
    list.push(row);
    buckets.set(key, list);
  }

  const identity = buckets.get('identity');
  const career = buckets.get('career');
  if (identity && career) {
    const hasSaturnFamily = [...identity, ...career].some(
      (row) =>
        ['saturn', 'pluto'].includes(norm(row.signal.actor)) ||
        ['saturn', 'pluto'].includes(norm(row.signal.natalPlanet)),
    );
    if (hasSaturnFamily) {
      buckets.set('identity', [...identity, ...career]);
      buckets.delete('career');
    }
  }

  const themes: LivedTheme[] = [];

  for (const [key, members] of Array.from(buckets.entries())) {
    if (members.length === 0) continue;
    const sources = new Set(members.map((m) => m.signal.source));
    const named = nameTheme(members.map((m) => m.signal));
    const impact = clamp(
      weightedMean(members.map((m) => ({ value: m.weightedImpact, weight: m.userWeight }))) +
        Math.min(12, (members.length - 1) * 6),
    );
    const pressure = clamp(weightedMean(members.map((m) => ({ value: m.dims.pressure, weight: m.weightedImpact }))));
    const growth = clamp(weightedMean(members.map((m) => ({ value: m.dims.growth, weight: m.weightedImpact }))));
    const instability = clamp(
      weightedMean(members.map((m) => ({ value: m.dims.instability, weight: m.weightedImpact }))),
    );
    const visibility = clamp(
      weightedMean(members.map((m) => ({ value: m.dims.visibility, weight: m.weightedImpact }))),
    );
    const natalResonance = clamp(
      weightedMean(members.map((m) => ({ value: m.resonance, weight: m.weightedImpact }))),
    );

    const tension = clamp(Math.abs(pressure - growth) * 0.35 + Math.min(pressure, growth) * 0.5);
    const mixedDirections = pressure >= 40 && growth >= 40;
    const internalTension = mixedDirections ? clamp(Math.max(tension, 52) + 16) : clamp(tension);

    const signalStrength = clamp(impact * 0.6 + members.length * 8 + sources.size * 6);
    const plutoHeavy = members.every((m) => ['pluto', 'neptune'].includes(norm(m.signal.actor)));
    let interpretationConfidence =
      38 + sources.size * 10 + Math.min(16, members.length * 5) + natalResonance * 0.12;
    if (plutoHeavy) interpretationConfidence -= 22;
    if (internalTension >= 70) interpretationConfidence -= 8;
    if (sources.has('progression') || sources.has('solar-arc')) interpretationConfidence += 8;
    interpretationConfidence = clamp(interpretationConfidence, 28, 92);

    const domainAccum: Partial<Record<ForecastDomain, number>> = {};
    for (const member of members) {
      const share = member.domains.length || 1;
      for (const domain of member.domains) {
        domainAccum[domain] = clamp((domainAccum[domain] || 0) + member.weightedImpact / share);
      }
    }

    themes.push({
      id: `theme-${key}`,
      theme: named.theme,
      impact,
      pressure,
      growth,
      instability,
      visibility,
      stabilityShift: instability,
      signalStrength,
      interpretationConfidence,
      natalResonance,
      internalTension,
      domains: domainAccum,
      contributors: members.map((m) => ({
        label: m.signal.label,
        source: m.signal.source,
        natalImportance: m.importance,
        actor: m.signal.actor,
        natalPlanet: m.signal.natalPlanet,
      })),
      curve: curveFrom(members.map((m) => m.signal)),
      reflectivePrompt: named.prompt,
    });
  }

  themes.sort((a, b) => b.impact - a.impact || b.signalStrength - a.signalStrength);

  const domains = { ...EMPTY_DOMAINS };
  for (const theme of themes) {
    for (const [domain, value] of Object.entries(theme.domains) as Array<[ForecastDomain, number]>) {
      domains[domain] = clamp(domains[domain] + value * 0.85);
    }
  }

  return {
    themes: themes.slice(0, 6),
    domains,
    framing: 'symbolic-emphasis',
  };
}

export function extractLivedThemesFromMention(
  mention: MentionWorthySet,
  natal: NatalSensitivityContext,
  extra: ThemeSignal[] = [],
  planetWeights?: Partial<Record<string, number>>,
): LivedThemePacket {
  return extractLivedThemes(
    [...signalsFromMentionItems(mention.mentioned), ...extra],
    natal,
    { planetWeights },
  );
}
