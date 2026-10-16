/**
 * Near-term symbolic themes from life-risk windows.
 *
 * Deterministic: the same signals always produce the same objects.
 * This builder takes no personality input. Core / Mask may color a later
 * explanation. They must not change these objects or their evidence labels.
 * Uncertainty is how clear the symbolic cluster is, not a probability.
 */

import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import type {
  LifeRiskDomain,
  LifeRiskDriver,
  LifeRiskPacket,
  LifeRiskWindow,
  LifeRiskWindowKind,
} from '@/lib/atmosphere/types';

export type FutureSightHorizon = 'today' | 'next-3-days' | 'this-week';

export type FutureSightUncertainty = 'low' | 'medium' | 'high';

export interface FutureSight {
  horizon: FutureSightHorizon;
  domain: string;
  theme: string;
  evidence: string[];
  uncertainty: FutureSightUncertainty;
  alternative: string;
  watchFor: string;
  prepare: string;
}

/** Ranking input. `pressure` is never copied onto FutureSight. */
export interface FutureSightSignal {
  label: string;
  kind: LifeRiskWindowKind;
  domains: LifeRiskDomain[];
  daysToPeak?: number;
  phase?: 'building' | 'peaking' | 'releasing';
  pressure: number;
}

/** Keep aligned with DOMAIN_LABELS in life-risk.ts. */
const DOMAIN_LABEL: Record<LifeRiskDomain, string> = {
  self: 'Self',
  love: 'Bonds',
  career: 'Work',
  money: 'Money',
  family: 'Home',
  health: 'Body',
};

const DOMAIN_ORDER: LifeRiskDomain[] = ['love', 'career', 'money', 'family', 'health', 'self'];

const HORIZON_ORDER: FutureSightHorizon[] = ['today', 'next-3-days', 'this-week'];

/** One kind is ahead when its pressure leads by at least this many points. */
const CLEAR_LEAD_GAP = 15;

export const FUTURE_SIGHT_HORIZON_LABEL: Record<FutureSightHorizon, string> = {
  today: 'Today',
  'next-3-days': 'Next few days',
  'this-week': 'This week',
};

export const FUTURE_SIGHT_CLARITY: Record<FutureSightUncertainty, string> = {
  low: 'Symbolic read is fairly clear',
  medium: 'Symbolic read is mixed',
  high: 'Symbolic read is thin',
};

const THEME: Record<string, Record<LifeRiskWindowKind, string>> = {
  Bonds: {
    friction: 'A sharper edge in a close talk',
    support: 'An easier opening between people',
    mixed: 'Warmth and friction in the same bond',
  },
  Work: {
    friction: 'A task waiting on one decision',
    support: 'A stretch where work can move',
    mixed: 'Push and pause on the same task',
  },
  Money: {
    friction: 'A number that asks for a choice',
    support: 'A quieter stretch around money',
    mixed: 'A money choice with two readings',
  },
  Home: {
    friction: 'Mood in the room ahead of the plan',
    support: 'A softer tone at home',
    mixed: 'Home life pulling two ways',
  },
  Body: {
    friction: 'The body flagging before the story',
    support: 'A little more room in the body',
    mixed: 'Energy and drag in the same day',
  },
  Self: {
    friction: 'A self-story louder than the facts',
    support: 'A quieter read of yourself',
    mixed: 'Two self-stories in the same hour',
  },
};

const WATCH: Record<string, string> = {
  Bonds: 'Notice if a talk gets sharper than the topic.',
  Work: 'Notice if one task waits on a single decision.',
  Money: 'Notice if a number asks for a choice earlier than planned.',
  Home: "Notice if the room's mood shifts before the plan does.",
  Body: 'Notice if the body flags the day before the story does.',
  Self: 'Notice if a self-story gets louder than the facts in front of you.',
};

const PREPARE: Record<LifeRiskWindowKind, string> = {
  friction: 'Leave a little margin there. Use it only if you want it.',
  support: 'Keep one small yes available. It can stay unused.',
  mixed: 'Name one thing you would protect if this theme shows up.',
};

const ALTERNATIVE: Record<LifeRiskWindowKind, string> = {
  friction: 'The same signals can be ordinary strain in that area, not a new story.',
  support:
    'The same signals can be a quiet stretch that only looks open because nothing is pressing.',
  mixed: 'The same signals can read as a pause rather than a clash.',
};

const NEAR_TERM_WATCH_RE =
  /\b(?:next few days|next 3 days|next three days|this week|what to watch|what should i watch|coming up|near[- ]term|what(?:'s| is) coming|days ahead)\b/i;

const KNOWN_DOMAINS = new Set<string>(DOMAIN_ORDER);

export function asksForNearTermWatch(question: string): boolean {
  return NEAR_TERM_WATCH_RE.test(question || '');
}

function compareSignals(a: FutureSightSignal, b: FutureSightSignal): number {
  if (b.pressure !== a.pressure) return b.pressure - a.pressure;
  const byLabel = a.label.localeCompare(b.label);
  if (byLabel !== 0) return byLabel;
  return a.kind.localeCompare(b.kind);
}

function horizonFor(signal: FutureSightSignal): FutureSightHorizon | null {
  const days = signal.daysToPeak;
  if (typeof days === 'number' && Number.isFinite(days)) {
    if (days <= 0) return 'today';
    if (days <= 3) return 'next-3-days';
    if (days <= 7) return 'this-week';
    return null;
  }
  if (signal.phase === 'building') return 'next-3-days';
  return 'today';
}

function normalizeSignal(signal: FutureSightSignal): FutureSightSignal | null {
  const label = signal.label?.trim();
  if (!label) return null;
  if (signal.kind !== 'friction' && signal.kind !== 'support' && signal.kind !== 'mixed') {
    return null;
  }
  const domains = (signal.domains || []).filter((domain): domain is LifeRiskDomain =>
    KNOWN_DOMAINS.has(domain),
  );
  if (domains.length === 0) return null;
  const pressure = Number.isFinite(signal.pressure) ? signal.pressure : 0;
  return {
    label,
    kind: signal.kind,
    domains,
    daysToPeak:
      typeof signal.daysToPeak === 'number' && Number.isFinite(signal.daysToPeak)
        ? signal.daysToPeak
        : undefined,
    phase: signal.phase,
    pressure,
  };
}

function dedupe(signals: FutureSightSignal[]): FutureSightSignal[] {
  const sorted = [...signals].sort(compareSignals);
  const seen = new Set<string>();
  const out: FutureSightSignal[] = [];
  for (const signal of sorted) {
    const key = signal.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(signal);
  }
  return out;
}

function pickDomain(signals: FutureSightSignal[]): LifeRiskDomain {
  const best = new Map<LifeRiskDomain, number>();
  for (const signal of signals) {
    for (const domain of signal.domains) {
      const prev = best.get(domain);
      if (prev == null || signal.pressure > prev) best.set(domain, signal.pressure);
    }
  }
  let winner: LifeRiskDomain = 'self';
  let winnerPressure = -1;
  for (const domain of DOMAIN_ORDER) {
    const pressure = best.get(domain);
    if (pressure == null) continue;
    if (pressure > winnerPressure) {
      winner = domain;
      winnerPressure = pressure;
    }
  }
  return winner;
}

function clusterRead(signals: FutureSightSignal[]): {
  kind: LifeRiskWindowKind;
  clear: boolean;
  max: number;
} {
  let frictionMax = 0;
  let supportMax = 0;
  let sawFriction = false;
  let sawSupport = false;
  let sawMixed = false;
  let max = 0;
  for (const signal of signals) {
    max = Math.max(max, signal.pressure);
    if (signal.kind === 'friction') {
      sawFriction = true;
      frictionMax = Math.max(frictionMax, signal.pressure);
    } else if (signal.kind === 'support') {
      sawSupport = true;
      supportMax = Math.max(supportMax, signal.pressure);
    } else {
      sawMixed = true;
    }
  }
  if (sawMixed || (sawFriction && sawSupport && Math.abs(frictionMax - supportMax) < CLEAR_LEAD_GAP)) {
    return { kind: 'mixed', clear: false, max };
  }
  if (sawFriction && sawSupport) {
    const kind = frictionMax >= supportMax ? 'friction' : 'support';
    return { kind, clear: true, max };
  }
  if (sawSupport) return { kind: 'support', clear: true, max };
  return { kind: 'friction', clear: true, max };
}

function uncertaintyFor(
  signals: FutureSightSignal[],
  read: { clear: boolean; max: number },
  horizon: FutureSightHorizon,
): FutureSightUncertainty {
  const near = horizon === 'today' || horizon === 'next-3-days';
  if (signals.length < 2 || !read.clear || read.max < 40) return 'high';
  if (read.max >= 55 && near) return 'low';
  return 'medium';
}

function speak(text: string): string {
  return sanitizeCopyText(text);
}

function objectFor(horizon: FutureSightHorizon, signals: FutureSightSignal[]): FutureSight | null {
  const cluster = dedupe(signals);
  if (cluster.length === 0) return null;
  const domain = pickDomain(cluster);
  const inDomain = cluster
    .filter((signal) => signal.domains.includes(domain))
    .sort(compareSignals);
  if (inDomain.length === 0) return null;
  const label = DOMAIN_LABEL[domain];
  const read = clusterRead(inDomain);
  const evidence = inDomain.slice(0, 3).map((signal) => signal.label);
  return {
    horizon,
    domain: label,
    theme: speak(THEME[label][read.kind]),
    evidence,
    uncertainty: uncertaintyFor(inDomain, read, horizon),
    alternative: speak(ALTERNATIVE[read.kind]),
    watchFor: speak(WATCH[label]),
    prepare: speak(PREPARE[read.kind]),
  };
}

/**
 * Group near-term signals into at most one object per horizon.
 * Signals more than 7 days out are omitted.
 */
export function buildFutureSight(signals: FutureSightSignal[]): FutureSight[] {
  const buckets: Record<FutureSightHorizon, FutureSightSignal[]> = {
    today: [],
    'next-3-days': [],
    'this-week': [],
  };
  for (const raw of signals) {
    const signal = normalizeSignal(raw);
    if (!signal) continue;
    const horizon = horizonFor(signal);
    if (!horizon) continue;
    buckets[horizon].push(signal);
  }
  const out: FutureSight[] = [];
  for (const horizon of HORIZON_ORDER) {
    const item = objectFor(horizon, buckets[horizon]);
    if (item) out.push(item);
  }
  return out;
}

function pressureForWindow(window: LifeRiskWindow): number {
  const friction = Number.isFinite(window.friction) ? window.friction : 0;
  const ease = typeof window.ease === 'number' && Number.isFinite(window.ease) ? window.ease : 0;
  if (window.kind === 'support') return Math.max(friction, ease);
  return friction;
}

function signalFromWindow(window: LifeRiskWindow): FutureSightSignal | null {
  return normalizeSignal({
    label: window.label,
    kind: window.kind,
    domains: window.domains,
    daysToPeak: window.daysToPeak,
    phase: window.phase,
    pressure: pressureForWindow(window),
  });
}

function signalFromDriver(driver: LifeRiskDriver): FutureSightSignal | null {
  return normalizeSignal({
    label: driver.label,
    kind: driver.kind,
    domains: driver.domains,
    phase: driver.phase,
    pressure: Number.isFinite(driver.friction) ? driver.friction : 0,
  });
}

/**
 * Fill future sight from the packet the life-risk scorer already returns.
 * Friction and support windows carry timing. Mixed drivers are included
 * only when that label is not already on a window.
 */
export function futureSightFromRisk(
  risk: Pick<LifeRiskPacket, 'frictionWindows' | 'supportWindows' | 'topDrivers'> | null | undefined,
): FutureSight[] {
  if (!risk) return [];
  const signals: FutureSightSignal[] = [];
  const seen = new Set<string>();
  const take = (signal: FutureSightSignal | null) => {
    if (!signal) return;
    const key = signal.label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    signals.push(signal);
  };
  for (const window of risk.frictionWindows ?? []) take(signalFromWindow(window));
  for (const window of risk.supportWindows ?? []) take(signalFromWindow(window));
  for (const driver of risk.topDrivers ?? []) {
    if (driver.kind !== 'mixed') continue;
    take(signalFromDriver(driver));
  }
  return buildFutureSight(signals);
}

/** Today's pre-stated observable, when that horizon was issued. */
export function todayFutureSightWatch(items: FutureSight[]): string | undefined {
  const watch = items.find((item) => item.horizon === 'today')?.watchFor?.trim();
  return watch || undefined;
}

export function formatFutureSightForOracle(items: FutureSight[], asked: boolean): string {
  if (items.length === 0) {
    if (!asked) return '';
    return `
FUTURE SIGHT
No near-term window is loaded. Say that the read is empty. Do not invent a theme, a confidence, or an outcome.
    `.trim();
  }

  const body = items
    .map((item) =>
      [
        `- horizon: ${item.horizon} (${FUTURE_SIGHT_HORIZON_LABEL[item.horizon]})`,
        `  domain: ${item.domain}`,
        `  theme: ${item.theme}`,
        `  evidence: ${item.evidence.join('; ')}`,
        `  uncertainty: ${item.uncertainty} (${FUTURE_SIGHT_CLARITY[item.uncertainty]})`,
        `  alternative: ${item.alternative}`,
        `  watchFor: ${item.watchFor}`,
        `  prepare: ${item.prepare}`,
      ].join('\n'),
    )
    .join('\n');

  const askLine = asked
    ? 'The person asked about the near term. Explain the object below in prose.'
    : 'On any other question, leave this block unsaid.';

  return `
FUTURE SIGHT (possible symbolic themes from the loaded near-term windows):
${askLine}
Explain this object when they ask what is coming, what to watch, or about the next few days.
Uncertainty names how clear the symbolic cluster is: low means the signals agree, high means the read is thin. Attach no percent to it.
You may color the sentences. Leave evidence, horizon, domain, and uncertainty as written.
Do not add a confidence the object does not contain. Do not add a second theme. Do not turn the object into an authoritative prediction.
${body}
  `.trim();
}
