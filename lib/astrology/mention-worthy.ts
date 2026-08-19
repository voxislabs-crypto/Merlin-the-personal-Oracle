/**
 * Mention-worthy transits — what Merlin should actually say out loud.
 *
 * Detection can find ~30 contacts a day. People feel ~2–5.
 * Ranked by **lived salience**, not by smallest orb.
 *
 * Impact, valence, and certainty are scored independently:
 *   Saturn square Sun  → high impact, negative valence, high certainty
 *   Jupiter conjunct Sun → high impact, positive valence
 *   Pluto conjunct ASC → highest impact, valence near 0 (transformation)
 *
 * Hierarchy (highest first):
 *   1. Outer planet crossing an angle (ASC / MC / IC / DSC)
 *   2. Slow planet hitting a personal point (Sun / Moon / angles)
 *   3. Hard aspect over soft; duration over Moon-weather
 *   4. Stacks: several hits on the same natal point → one theme
 *   5. Mars / Jupiter on a personal point (days-to-weeks)
 *   6. Fast personal planets — mention only if tight
 *   7. Moon — almost never, unless exact to a light/angle today
 *
 * MBTI is not an input here. Forecast stays astrology; coping is downstream.
 */

import { isAngularPoint } from '@/lib/astrology/natal-angles';
import { inferPassKind, type TransitPass } from '@/lib/astrology/transit-passes';

export type MentionAspect =
  | 'Conjunction'
  | 'Opposition'
  | 'Square'
  | 'Trine'
  | 'Sextile'
  | string;

export type MentionPhase = 'building' | 'peaking' | 'releasing';

export type MentionLane = 'headline' | 'now' | 'upcoming';

export type ForecastDomain = 'identity' | 'career' | 'relationships' | 'health' | 'home' | 'money';

export interface TransitHitInput {
  transitingPlanet: string;
  natalPlanet: string;
  aspect: MentionAspect;
  orb: number;
  /** Calendar day this sample was taken, YYYY-MM-DD */
  date: string;
  retrograde?: boolean;
  house?: number;
}

export interface MentionCandidate {
  eventId: string;
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  /** Tightest orb seen across the horizon */
  orbAtPeak: number;
  /** Orb on the as-of day, if the event is active then */
  orbNow: number | null;
  peakDate: string;
  firstDate: string;
  lastDate: string;
  daysToPeak: number;
  phase: MentionPhase;
  activeToday: boolean;
  retrograde: boolean;
  house?: number;
}

export interface MentionScore {
  eventId: string;
  /** @deprecated alias of impact — kept so existing callers/tests keep working */
  score: number;
  impact: number;
  valence: number;
  certainty: number;
  durationDays: number;
  durationFactor: number;
  domains: ForecastDomain[];
  mentionable: boolean;
  reasons: string[];
  suppressReason?: string;
  transitingWeight: number;
  natalWeight: number;
  aspectWeight: number;
  orbFactor: number;
  timingFactor: number;
}

export interface MentionWorthyItem {
  eventId: string;
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  orbAtPeak: number;
  daysToPeak: number;
  phase: MentionPhase;
  lane: MentionLane;
  score: number;
  impact: number;
  valence: number;
  certainty: number;
  durationDays: number;
  domains: ForecastDomain[];
  pass: TransitPass;
  why: string;
  label: string;
}

export interface ThemeCluster {
  target: string;
  theme: string;
  strength: number;
  impact: number;
  valence: number;
  certainty: number;
  members: MentionWorthyItem[];
  why: string;
}

export type DomainScorecard = Record<ForecastDomain, number>;

export interface MentionWorthySet {
  headline: MentionWorthyItem | null;
  headlineCluster: ThemeCluster | null;
  now: MentionWorthyItem[];
  upcoming: MentionWorthyItem[];
  mentioned: MentionWorthyItem[];
  clusters: ThemeCluster[];
  domains: DomainScorecard;
  suppressedCount: number;
}

const PERSONAL_POINTS = new Set([
  'sun',
  'moon',
  'ascendant',
  'rising',
  'midheaven',
  'mc',
  'descendant',
  'dsc',
  'imum coeli',
  'ic',
]);

const PERSONAL_PLANETS = new Set(['sun', 'moon', 'mercury', 'venus', 'mars']);

const SLOW_PLANETS = new Set(['jupiter', 'saturn', 'uranus', 'neptune', 'pluto']);
const OUTER_PLANETS = new Set(['saturn', 'uranus', 'neptune', 'pluto']);

const TRANSITING_WEIGHT: Record<string, number> = {
  pluto: 1,
  saturn: 0.96,
  uranus: 0.92,
  neptune: 0.88,
  mars: 0.78,
  jupiter: 0.62,
  sun: 0.5,
  venus: 0.48,
  mercury: 0.46,
  moon: 0.22,
};

const NATAL_WEIGHT: Record<string, number> = {
  sun: 1,
  moon: 1,
  midheaven: 1.08,
  mc: 1.08,
  ascendant: 1.08,
  rising: 1.08,
  descendant: 1.04,
  dsc: 1.04,
  'imum coeli': 1.04,
  ic: 1.04,
  mercury: 0.86,
  venus: 0.86,
  mars: 0.86,
  jupiter: 0.7,
  saturn: 0.7,
  uranus: 0.52,
  neptune: 0.52,
  pluto: 0.52,
  'north node': 0.5,
  node: 0.5,
};

const ASPECT_WEIGHT: Record<string, number> = {
  conjunction: 1,
  opposition: 0.94,
  square: 0.9,
  ingress: 0.86,
  trine: 0.56,
  sextile: 0.4,
};

const HARD_ASPECTS = new Set(['conjunction', 'opposition', 'square']);

/** Typical time a contact stays inside a working orb. */
const TYPICAL_DURATION_DAYS: Record<string, number> = {
  moon: 1,
  mercury: 5,
  venus: 6,
  sun: 6,
  mars: 16,
  jupiter: 70,
  saturn: 200,
  uranus: 360,
  neptune: 400,
  pluto: 450,
};

const NATAL_DOMAINS: Record<string, ForecastDomain[]> = {
  sun: ['identity'],
  ascendant: ['identity'],
  rising: ['identity'],
  midheaven: ['career'],
  mc: ['career'],
  moon: ['home', 'health'],
  'imum coeli': ['home'],
  ic: ['home'],
  descendant: ['relationships'],
  dsc: ['relationships'],
  venus: ['relationships', 'money'],
  mercury: ['career'],
  mars: ['health', 'career'],
  jupiter: ['career', 'money'],
  saturn: ['career'],
  uranus: ['identity'],
  neptune: ['health'],
  pluto: ['identity'],
};

const HOUSE_DOMAINS: Record<number, ForecastDomain[]> = {
  1: ['identity'],
  2: ['money'],
  4: ['home'],
  6: ['health'],
  7: ['relationships'],
  8: ['money'],
  10: ['career'],
};

const CLUSTER_THEME: Record<string, { pressure: string; opening: string }> = {
  sun: { pressure: 'identity pressure', opening: 'identity opening' },
  moon: { pressure: 'emotional climate', opening: 'emotional ease' },
  ascendant: { pressure: 'how you meet the world', opening: 'a new face to the world' },
  rising: { pressure: 'how you meet the world', opening: 'a new face to the world' },
  midheaven: { pressure: 'public role / career', opening: 'career opening' },
  mc: { pressure: 'public role / career', opening: 'career opening' },
  descendant: { pressure: 'relationship pressure', opening: 'relationship opening' },
  dsc: { pressure: 'relationship pressure', opening: 'relationship opening' },
  'imum coeli': { pressure: 'home and foundations', opening: 'home settling' },
  ic: { pressure: 'home and foundations', opening: 'home settling' },
  venus: { pressure: 'bonds and value', opening: 'connection and ease' },
  mercury: { pressure: 'decisions and messages', opening: 'clearer thinking' },
  mars: { pressure: 'drive and conflict', opening: 'usable heat' },
  jupiter: { pressure: 'growth stretch', opening: 'expansion' },
  saturn: { pressure: 'structure and duty', opening: 'solid ground' },
};

/** Wider mention orbs for slow bodies — they stay in range for weeks. */
const MENTION_ORB_CAP: Record<string, number> = {
  pluto: 3.2,
  saturn: 3,
  uranus: 2.8,
  neptune: 2.8,
  jupiter: 2.4,
  mars: 2,
  sun: 1.6,
  venus: 1.5,
  mercury: 1.5,
  moon: 0.75,
};

const SCORE_FLOOR = 34;
const MAX_NOW = 3;
const MAX_UPCOMING = 3;
const MAX_TOTAL = 5;

function norm(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function titleCasePlanet(value: string): string {
  const raw = value.trim();
  if (!raw) return raw;
  const lower = raw.toLowerCase();
  if (lower === 'north node') return 'North Node';
  if (lower === 'mc') return 'MC';
  if (lower === 'ic' || lower === 'imum coeli') return 'Imum Coeli';
  if (lower === 'dsc') return 'Descendant';
  const houseMatch = lower.match(/^house\s*(\d+)$/);
  if (houseMatch) return `House ${houseMatch[1]}`;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function transitEventId(
  transitingPlanet: string,
  aspect: string,
  natalPlanet: string,
): string {
  return `${titleCasePlanet(transitingPlanet)}:${titleCasePlanet(aspect)}:${titleCasePlanet(natalPlanet)}`;
}

export function isPersonalPoint(planet: string): boolean {
  return PERSONAL_POINTS.has(norm(planet));
}

export function isSlowPlanet(planet: string): boolean {
  return SLOW_PLANETS.has(norm(planet));
}

function mentionOrbCap(transitingPlanet: string): number {
  return MENTION_ORB_CAP[norm(transitingPlanet)] ?? 1.8;
}

function daysBetween(fromDate: string, toDate: string): number {
  const a = Date.parse(`${fromDate}T12:00:00Z`);
  const b = Date.parse(`${toDate}T12:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/**
 * Collapse daily samples of the same contact into one event with peak timing.
 */
export function groupHorizonHits(
  samples: TransitHitInput[],
  today: string,
): MentionCandidate[] {
  const buckets = new Map<string, TransitHitInput[]>();

  for (const sample of samples) {
    const eventId = transitEventId(sample.transitingPlanet, sample.aspect, sample.natalPlanet);
    const list = buckets.get(eventId) || [];
    list.push(sample);
    buckets.set(eventId, list);
  }

  const candidates: MentionCandidate[] = [];

  for (const [eventId, list] of buckets) {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const peak = [...sorted].sort((a, b) => a.orb - b.orb)[0];
    const todaySample = sorted.find((sample) => sample.date === today) || null;
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const daysToPeak = daysBetween(today, peak.date);

    // Peak date is the tightest sample we have. If that's today (or we
    // only have today), treat it as current weather — not "separating."
    let phase: MentionPhase = 'peaking';
    if (daysToPeak > 0) phase = 'building';
    else if (daysToPeak < 0) phase = 'releasing';
    else if (peak.orb <= 0.8) phase = 'peaking';
    else phase = 'peaking';

    candidates.push({
      eventId,
      transitingPlanet: titleCasePlanet(first.transitingPlanet),
      natalPlanet: titleCasePlanet(first.natalPlanet),
      aspect: titleCasePlanet(first.aspect),
      orbAtPeak: peak.orb,
      orbNow: todaySample ? todaySample.orb : null,
      peakDate: peak.date,
      firstDate: first.date,
      lastDate: last.date,
      daysToPeak,
      phase,
      activeToday: Boolean(todaySample),
      retrograde: Boolean(todaySample?.retrograde ?? peak.retrograde),
      house: todaySample?.house ?? peak.house,
    });
  }

  return candidates;
}

function emptyScore(
  candidate: MentionCandidate,
  weights: Pick<MentionScore, 'transitingWeight' | 'natalWeight' | 'aspectWeight'>,
  extra: Partial<MentionScore> & { suppressReason: string },
): MentionScore {
  return {
    eventId: candidate.eventId,
    score: 0,
    impact: 0,
    valence: 0,
    certainty: 0,
    durationDays: typicalDurationDays(candidate.transitingPlanet),
    durationFactor: 0,
    domains: [],
    mentionable: false,
    reasons: extra.reasons || [],
    suppressReason: extra.suppressReason,
    transitingWeight: weights.transitingWeight,
    natalWeight: weights.natalWeight,
    aspectWeight: weights.aspectWeight,
    orbFactor: extra.orbFactor ?? 0,
    timingFactor: extra.timingFactor ?? 0,
  };
}

export function typicalDurationDays(planet: string): number {
  return TYPICAL_DURATION_DAYS[norm(planet)] ?? 10;
}

export function durationFactorFor(planet: string): number {
  const days = typicalDurationDays(planet);
  const logged = Math.log10(Math.max(1, days)) / Math.log10(450);
  return Math.max(0.15, Math.min(1, logged));
}

export function scoreValence(transitingPlanet: string, aspect: string): number {
  const planet = norm(transitingPlanet);
  const asp = norm(aspect);
  let aspectV = 0;
  if (asp === 'square' || asp === 'opposition') aspectV = -0.55;
  else if (asp === 'trine' || asp === 'sextile') aspectV = 0.5;
  else if (asp === 'ingress') aspectV = 0;

  let planetV = 0;
  if (planet === 'saturn' || planet === 'mars') planetV = -0.45;
  else if (planet === 'jupiter' || planet === 'venus') planetV = 0.55;
  else if (planet === 'pluto' || planet === 'uranus' || planet === 'neptune') planetV = 0;

  return Math.max(-100, Math.min(100, Math.round(100 * (0.55 * aspectV + 0.45 * planetV))));
}

export function domainsForHit(natalPlanet: string, house?: number): ForecastDomain[] {
  const fromNatal = NATAL_DOMAINS[norm(natalPlanet)] || [];
  const houseMatch = String(natalPlanet).match(/house\s*(\d+)/i);
  const houseNum = house ?? (houseMatch ? Number(houseMatch[1]) : undefined);
  const fromHouse = houseNum ? HOUSE_DOMAINS[houseNum] || [] : [];
  return Array.from(new Set([...fromNatal, ...fromHouse]));
}

export function scoreMentionCandidate(candidate: MentionCandidate): MentionScore {
  const transiting = norm(candidate.transitingPlanet);
  const natal = norm(candidate.natalPlanet);
  const aspect = norm(candidate.aspect);
  const orb = candidate.activeToday
    ? (candidate.orbNow ?? candidate.orbAtPeak)
    : candidate.orbAtPeak;

  const transitingWeight = TRANSITING_WEIGHT[transiting] ?? 0.45;
  const natalWeight = NATAL_WEIGHT[natal] ?? (natal.startsWith('house') ? 0.72 : 0.55);
  const aspectWeight = ASPECT_WEIGHT[aspect] ?? 0.5;
  const weights = { transitingWeight, natalWeight, aspectWeight };
  const reasons: string[] = [];
  const angle = isAngularPoint(candidate.natalPlanet);
  const durationDays = typicalDurationDays(candidate.transitingPlanet);
  const durationFactor = durationFactorFor(candidate.transitingPlanet);

  if (transiting === 'moon') {
    const exactToLight = isPersonalPoint(natal) && orb <= 0.75 && candidate.activeToday;
    if (!exactToLight) {
      return emptyScore(candidate, weights, {
        suppressReason: 'Moon weather — hours-long, not the week’s story',
      });
    }
    reasons.push('Moon is exact to a personal point today');
  }

  const cap = mentionOrbCap(transiting);
  if (orb > cap) {
    return emptyScore(candidate, weights, {
      suppressReason: `Outside mention orb (${orb.toFixed(1)}° > ${cap}°)`,
    });
  }

  const orbFactor = Math.pow(1 - Math.min(orb, cap) / cap, 1.1);
  const personalNatal = isPersonalPoint(natal) || PERSONAL_PLANETS.has(natal) || angle;
  const hard = HARD_ASPECTS.has(aspect);
  const outer = OUTER_PLANETS.has(transiting);
  const slow = SLOW_PLANETS.has(transiting);
  const ingress = aspect === 'ingress';

  if (outer && angle && (hard || aspect === 'conjunction')) {
    reasons.push('Outer planet on an angle — visible life change is more likely');
  } else if (outer && personalNatal && hard) {
    reasons.push('Slow planet on a personal point — this is the week’s weather');
  } else if (ingress && candidate.house) {
    reasons.push(`House ingress — ${candidate.transitingPlanet} entering house ${candidate.house}`);
  } else if (outer && hard) {
    reasons.push('Outer-planet pressure, background but durable');
  } else if (transiting === 'mars' && personalNatal) {
    reasons.push('Mars is lighting a personal point — short, sharp, noticeable');
  } else if (transiting === 'jupiter' && personalNatal) {
    reasons.push('Jupiter opening a personal area');
  } else if (!personalNatal && !outer && !ingress) {
    reasons.push('Social/outer natal point — lower lived impact');
  }

  if (hard) reasons.push(`${candidate.aspect} is a hard aspect`);
  else if (!ingress) reasons.push(`${candidate.aspect} is supportive — mention only if strong`);

  if (orb < 0.6) reasons.push('Very tight');
  else if (orb < 1.2) reasons.push('Tight');

  if (durationDays >= 180) reasons.push('Long transit — people remember this');
  else if (durationDays <= 2) reasons.push('Hours-to-days weather');

  let timingFactor = 1;
  if (candidate.phase === 'peaking' || (candidate.activeToday && orb <= 0.8)) {
    timingFactor = 1.16;
    reasons.push('Peaking now');
  } else if (candidate.daysToPeak >= 1 && candidate.daysToPeak <= 3) {
    timingFactor = 1.12;
    reasons.push(`Peaks in ${candidate.daysToPeak} day${candidate.daysToPeak === 1 ? '' : 's'}`);
  } else if (candidate.daysToPeak >= 4 && candidate.daysToPeak <= 7) {
    timingFactor = 0.96;
    reasons.push('This week, not yet exact');
  } else if (candidate.daysToPeak > 7) {
    timingFactor = 0.72;
  } else if (candidate.phase === 'releasing') {
    timingFactor = 0.84;
    reasons.push('Separating — fading');
  }

  if (!personalNatal && !hard && slow && !ingress) {
    return emptyScore(candidate, weights, {
      reasons,
      suppressReason: 'Soft outer-to-outer — background only',
      orbFactor,
      timingFactor,
    });
  }

  let impact =
    100 *
    transitingWeight *
    natalWeight *
    aspectWeight *
    orbFactor *
    timingFactor *
    (0.55 + 0.45 * durationFactor);

  if (outer && angle && (hard || aspect === 'conjunction')) impact *= 1.22;
  else if (outer && personalNatal && hard) impact *= 1.18;
  if (!personalNatal && !ingress) impact *= 0.78;
  if (!hard && !outer && !ingress) impact *= 0.85;

  if (transiting === 'moon') impact = Math.max(impact, 40);
  if (outer && angle) impact = Math.max(impact, 58);
  if (outer && personalNatal && hard) impact = Math.max(impact, 50);
  if (transiting === 'mars' && personalNatal && hard) impact = Math.max(impact, 42);

  impact = Math.max(0, Math.min(100, Math.round(impact)));
  const valence = scoreValence(candidate.transitingPlanet, candidate.aspect);

  let certainty = 42;
  if (orb < 0.5) certainty += 22;
  else if (orb < 1.2) certainty += 14;
  else if (orb < 2) certainty += 6;
  if (hard) certainty += 10;
  if (personalNatal || angle) certainty += 10;
  if (outer && angle) certainty += 8;
  if (durationDays >= 180) certainty += 6;
  if (!hard && !outer) certainty -= 8;
  if (transiting === 'moon') certainty -= 10;
  certainty = Math.max(20, Math.min(96, Math.round(certainty)));

  return {
    eventId: candidate.eventId,
    score: impact,
    impact,
    valence,
    certainty,
    durationDays,
    durationFactor: Number(durationFactor.toFixed(3)),
    domains: domainsForHit(candidate.natalPlanet, candidate.house),
    mentionable: impact >= SCORE_FLOOR,
    reasons,
    transitingWeight,
    natalWeight,
    aspectWeight,
    orbFactor: Number(orbFactor.toFixed(3)),
    timingFactor: Number(timingFactor.toFixed(3)),
  };
}

function whyLine(candidate: MentionCandidate, scored: MentionScore): string {
  const primary = scored.reasons[0] || 'Meaningful contact';
  const timing =
    scored.reasons.find((reason) =>
      /peak|tight|separat|week|day/i.test(reason),
    ) || null;
  return timing && timing !== primary ? `${primary}. ${timing}.` : `${primary}.`;
}

function toItem(
  candidate: MentionCandidate,
  scored: MentionScore,
  lane: MentionLane,
): MentionWorthyItem {
  const orb = candidate.activeToday
    ? (candidate.orbNow ?? candidate.orbAtPeak)
    : candidate.orbAtPeak;
  const pass = inferPassKind({
    transitingPlanet: candidate.transitingPlanet,
    retrograde: candidate.retrograde,
    phase: candidate.phase,
  });
  const label =
    candidate.aspect.toLowerCase() === 'ingress'
      ? `${candidate.transitingPlanet} entering ${candidate.natalPlanet}`
      : `${candidate.transitingPlanet} ${candidate.aspect} natal ${candidate.natalPlanet}`;
  return {
    eventId: candidate.eventId,
    transitingPlanet: candidate.transitingPlanet,
    natalPlanet: candidate.natalPlanet,
    aspect: candidate.aspect,
    orb: Number(orb.toFixed(2)),
    orbAtPeak: Number(candidate.orbAtPeak.toFixed(2)),
    daysToPeak: candidate.daysToPeak,
    phase: candidate.phase,
    lane,
    score: scored.impact,
    impact: scored.impact,
    valence: scored.valence,
    certainty: scored.certainty,
    durationDays: scored.durationDays,
    domains: scored.domains,
    pass,
    why: whyLine(candidate, scored),
    label,
  };
}

export function clusterThemeLabel(target: string, valence: number): string {
  const copy = CLUSTER_THEME[norm(target)];
  if (copy) return valence >= 15 ? copy.opening : copy.pressure;
  return valence >= 15 ? `${target} opening` : `${target} pressure`;
}

export function buildThemeClusters(items: MentionWorthyItem[]): ThemeCluster[] {
  const grouped = new Map<string, MentionWorthyItem[]>();
  for (const item of items) {
    const key = natalKey(item.natalPlanet);
    const list = grouped.get(key) || [];
    list.push(item);
    grouped.set(key, list);
  }

  const clusters: ThemeCluster[] = [];
  for (const [, members] of grouped) {
    if (members.length < 2) continue;
    const sorted = [...members].sort((a, b) => b.impact - a.impact);
    const impact = Math.min(
      100,
      Math.round(
        sorted[0].impact +
          sorted.slice(1).reduce((sum, item) => sum + item.impact * 0.18, 0),
      ),
    );
    const valence = Math.round(
      sorted.reduce((sum, item) => sum + item.valence, 0) / sorted.length,
    );
    const certainty = Math.min(
      96,
      Math.round(
        sorted.reduce((sum, item) => sum + item.certainty, 0) / sorted.length + 12,
      ),
    );
    const target = sorted[0].natalPlanet;
    clusters.push({
      target,
      theme: clusterThemeLabel(target, valence),
      strength: impact,
      impact,
      valence,
      certainty,
      members: sorted,
      why: `${sorted.length} contacts converge on natal ${target} — treat this as one story, not a list.`,
    });
  }

  return clusters.sort((a, b) => b.strength - a.strength);
}

export function scoreDomains(items: MentionWorthyItem[]): DomainScorecard {
  const card: DomainScorecard = {
    identity: 0,
    career: 0,
    relationships: 0,
    health: 0,
    home: 0,
    money: 0,
  };
  for (const item of items) {
    const share = item.domains.length || 1;
    for (const domain of item.domains) {
      card[domain] = Math.min(100, Math.round(card[domain] + item.impact / share));
    }
  }
  return card;
}

function natalKey(planet: string): string {
  return norm(planet);
}

/**
 * Pick the handful of contacts Merlin should mention.
 * Headline is the single highest-impact story. `now` is active today.
 * `upcoming` peaks inside the scanned horizon and is not already in `now`.
 */
export function selectMentionWorthy(
  samples: TransitHitInput[],
  today: string,
  options?: { maxNow?: number; maxUpcoming?: number; maxTotal?: number },
): MentionWorthySet {
  const maxNow = options?.maxNow ?? MAX_NOW;
  const maxUpcoming = options?.maxUpcoming ?? MAX_UPCOMING;
  const maxTotal = options?.maxTotal ?? MAX_TOTAL;

  const candidates = groupHorizonHits(samples, today);
  const scored = candidates.map((candidate) => ({
    candidate,
    scored: scoreMentionCandidate(candidate),
  }));

  const mentionable = scored
    .filter((row) => row.scored.mentionable)
    .sort((a, b) => {
      if (b.scored.impact !== a.scored.impact) return b.scored.impact - a.scored.impact;
      return a.candidate.daysToPeak - b.candidate.daysToPeak;
    });

  const usedNatal = new Map<string, number>();
  const usedTransiting = new Map<string, number>();
  const picked: Array<{ candidate: MentionCandidate; scored: MentionScore; lane: MentionLane }> =
    [];

  const canTake = (candidate: MentionCandidate): boolean => {
    const natalCount = usedNatal.get(natalKey(candidate.natalPlanet)) || 0;
    const transitingCount = usedTransiting.get(norm(candidate.transitingPlanet)) || 0;
    // Allow three hits on the same natal so stacks can surface as a theme.
    if (natalCount >= 3) return false;
    if (transitingCount >= 2) return false;
    if (norm(candidate.transitingPlanet) === 'moon' && transitingCount >= 1) return false;
    return true;
  };

  const take = (row: (typeof mentionable)[number], lane: MentionLane) => {
    picked.push({ ...row, lane });
    const natal = natalKey(row.candidate.natalPlanet);
    const transiting = norm(row.candidate.transitingPlanet);
    usedNatal.set(natal, (usedNatal.get(natal) || 0) + 1);
    usedTransiting.set(transiting, (usedTransiting.get(transiting) || 0) + 1);
  };

  const nowPool = mentionable.filter((row) => row.candidate.activeToday);
  const upcomingPool = mentionable.filter(
    (row) => !row.candidate.activeToday && row.candidate.daysToPeak >= 0,
  );

  for (const row of nowPool) {
    if (picked.filter((item) => item.lane !== 'upcoming').length >= maxNow) break;
    if (picked.length >= maxTotal) break;
    if (!canTake(row.candidate)) continue;
    take(row, picked.length === 0 ? 'headline' : 'now');
  }

  for (const row of upcomingPool) {
    if (picked.filter((item) => item.lane === 'upcoming').length >= maxUpcoming) break;
    if (picked.length >= maxTotal) break;
    if (!canTake(row.candidate)) continue;
    take(row, picked.length === 0 ? 'headline' : 'upcoming');
  }

  // If nothing was active today, the headline may be upcoming — that's correct.
  const items = picked.map((row) => toItem(row.candidate, row.scored, row.lane));
  const headline = items.find((item) => item.lane === 'headline') || items[0] || null;
  if (headline && headline.lane !== 'headline') headline.lane = 'headline';

  const clusters = buildThemeClusters(items);
  const headlineCluster =
    clusters[0] && clusters[0].members.length >= 2 && clusters[0].strength >= (headline?.impact ?? 0)
      ? clusters[0]
      : clusters[0] && clusters[0].members.length >= 2
        ? clusters[0]
        : null;

  return {
    headline,
    headlineCluster,
    now: items.filter(
      (item) => item.lane === 'now' || (item.lane === 'headline' && item.daysToPeak <= 0),
    ),
    upcoming: items.filter(
      (item) => item.lane === 'upcoming' || (item.lane === 'headline' && item.daysToPeak > 0),
    ),
    mentioned: items,
    clusters,
    domains: scoreDomains(items),
    suppressedCount: scored.length - mentionable.length,
  };
}

export function toOracleTransit(item: MentionWorthyItem) {
  return {
    transitingPlanet: item.transitingPlanet,
    natalPlanet: item.natalPlanet,
    aspect: item.aspect,
    orb: item.orb,
    exact: item.orb < 1,
    shortDescription: item.why,
    description: item.why,
    score: item.impact,
    impact: item.impact,
    valence: item.valence,
    certainty: item.certainty,
    durationDays: item.durationDays,
    domains: item.domains,
    pass: item.pass,
    daysToPeak: item.daysToPeak,
    phase: item.phase,
    label: item.label,
    why: item.why,
  };
}

/** Calendar dates from today through today+horizonDays inclusive. */
export function horizonDates(today: string, horizonDays: number): string[] {
  const dates: string[] = [];
  const start = Date.parse(`${today}T12:00:00Z`);
  if (!Number.isFinite(start)) return [today];
  for (let offset = 0; offset <= horizonDays; offset += 1) {
    dates.push(new Date(start + offset * 86_400_000).toISOString().slice(0, 10));
  }
  return dates;
}

export function hitsFromMatches(
  matches: Array<{
    transitingPlanet: string;
    natalPlanet: string;
    aspect: string;
    orb: number;
    retrograde?: boolean;
    house?: number;
  }>,
  date: string,
): TransitHitInput[] {
  return matches.map((match) => ({
    transitingPlanet: match.transitingPlanet,
    natalPlanet: match.natalPlanet,
    aspect: match.aspect,
    orb: match.orb,
    date,
    retrograde: match.retrograde,
    house: match.house,
  }));
}

/**
 * Scan a date horizon with a lookup (usually getTransitsForDate).
 * One lookup per calendar day at local noon is enough — slow planets
 * barely move; Moon is gated out unless exact today.
 */
export function collectHorizonHits(
  lookup: (date: string) => Array<{
    transitingPlanet: string;
    natalPlanet: string;
    aspect: string;
    orb: number;
  }>,
  today: string,
  horizonDays = 7,
): TransitHitInput[] {
  const hits: TransitHitInput[] = [];
  for (const date of horizonDates(today, horizonDays)) {
    hits.push(...hitsFromMatches(lookup(date), date));
  }
  return hits;
}
