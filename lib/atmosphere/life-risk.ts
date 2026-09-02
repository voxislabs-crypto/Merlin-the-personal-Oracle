/**
 * Life Risk Packet — transit impact forecasting, not horoscope prose.
 *
 * Answers: is life-friction elevated? when? how hard? which domains?
 * Story/narrative stays optional consumers; this is the score-first contract.
 */

import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import {
  addCalendarDays,
  isValidCalendarDate,
  resolveWindowCalendarDate,
} from '@/lib/datetime/local-calendar';
import type {
  AtmosphereConfluence,
  AtmosphereForecastInput,
  AtmospherePredictiveEventInput,
  AtmospherePredictiveInput,
  AtmosphereStormInput,
  AtmosphereStormsInput,
  LifeRiskDayScore,
  LifeRiskDomain,
  LifeRiskDomainScore,
  LifeRiskDriver,
  LifeRiskLevel,
  LifeRiskPacket,
  LifeRiskWindow,
} from '@/lib/atmosphere/types';

/** Default predictive / risk horizon (days). */
export const DEFAULT_RISK_WINDOW_DAYS = 30;

const HARD_ASPECTS = new Set(['square', 'opposition', 'quincunx', 'inconjunct']);
const SOFT_ASPECTS = new Set(['trine', 'sextile']);
const HEAVY_PLANETS = new Set(['saturn', 'pluto', 'uranus', 'neptune', 'mars']);
const PERSONAL_POINTS = new Set([
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'ascendant',
  'rising',
]);

const DOMAIN_LABELS: Record<LifeRiskDomain, string> = {
  self: 'Self',
  love: 'Bonds',
  career: 'Work',
  money: 'Money',
  family: 'Home',
  health: 'Body',
};

/** Baseline labels when intensityScore is missing — stay mid-range, not ceiling */
const STORM_INTENSITY: Record<string, number> = {
  severe: 74,
  moderate: 56,
  mild: 38,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Soft ceiling so scores stay expressive (≈35–88) instead of slamming 100.
 * Linear through the mid-range; only the top tail compresses.
 * Examples (approx): 40→40, 55→55, 70→66, 85→74, 100→80, 120→85.
 */
export function softCeilingFriction(raw: number): number {
  const x = Math.max(0, raw);
  if (x <= 58) return clamp(x); // preserve 40 vs 55 vs 58 distinction
  const over = x - 58;
  // 58→58, 75→58+12≈70, 90→58+18≈76, 100→58+21≈79, 120→58+26≈84, 140→58+29≈87
  return clamp(58 + 34 * (1 - Math.exp(-over / 30)));
}

/**
 * Map storm engine intensityScore (typically 1–10) to graduated friction.
 * 4 → ~42, 6 → ~55, 7.5 → ~64, 8.5 → ~71, 10 → ~80
 */
function stormScoreToFriction(intensityScore: number): number {
  const s = Math.max(0.5, Math.min(10, intensityScore));
  // Gentle curve: 24 + 5.2*s + small square term for separation at the top
  const raw = 22 + s * 5.1 + (s * s) * 0.12;
  return softCeilingFriction(raw);
}

function normalizeAspect(aspect?: string): string {
  return (aspect || '').trim().toLowerCase();
}

function normalizePlanet(planet?: string): string {
  return (planet || '').trim().toLowerCase();
}

function aspectFriction(aspect?: string): number {
  const a = normalizeAspect(aspect);
  if (a === 'opposition' || a === 'square') return 1;
  if (a === 'quincunx' || a === 'inconjunct') return 0.75;
  if (a === 'conjunction') return 0.55;
  if (SOFT_ASPECTS.has(a)) return 0.15;
  return 0.4;
}

function planetWeight(planet?: string): number {
  const p = normalizePlanet(planet);
  if (p === 'pluto' || p === 'saturn') return 1;
  if (p === 'uranus' || p === 'neptune') return 0.9;
  if (p === 'mars') return 0.8;
  if (p === 'jupiter') return 0.45;
  if (p === 'venus' || p === 'mercury') return 0.4;
  if (p === 'sun' || p === 'moon') return 0.55;
  return 0.5;
}

function natalWeight(planet?: string): number {
  const p = normalizePlanet(planet);
  if (p === 'sun' || p === 'moon' || p === 'ascendant' || p === 'rising') return 1;
  if (PERSONAL_POINTS.has(p)) return 0.85;
  return 0.6;
}

function dayRatingFriction(dayRating?: string): number | null {
  const raw = (dayRating || '').toLowerCase();
  if (!raw) return null;
  if (raw === 'red' || raw === 'very challenging') return 85;
  if (raw === 'challenging') return 72;
  if (raw === 'yellow' || raw === 'neutral') return 48;
  if (raw === 'positive' || raw === 'green') return 28;
  if (raw === 'very positive') return 18;
  return null;
}

function eventEaseScore(event: AtmospherePredictiveEventInput): number {
  const aspect = normalizeAspect(event.transit?.aspect);
  if (!SOFT_ASPECTS.has(aspect)) return 0;
  const intensity =
    typeof event.scores?.intensity === 'number' && Number.isFinite(event.scores.intensity)
      ? event.scores.intensity
      : 48;
  const transiting = normalizePlanet(event.transit?.transitingPlanet);
  const natal = normalizePlanet(event.transit?.natalPlanet);
  let lift = aspect === 'trine' ? 0.82 : 0.7;
  if (transiting === 'jupiter' || transiting === 'venus') lift += 0.14;
  if (PERSONAL_POINTS.has(natal)) lift += 0.08;
  return softCeilingFriction(intensity * lift);
}

function eventBaseFriction(event: AtmospherePredictiveEventInput): number {
  const intensity =
    typeof event.scores?.intensity === 'number' && Number.isFinite(event.scores.intensity)
      ? event.scores.intensity
      : 50;
  const volatility =
    typeof event.scores?.volatility === 'number' && Number.isFinite(event.scores.volatility)
      ? event.scores.volatility
      : 0;

  const frictionBias = aspectFriction(event.transit?.aspect);
  const weight =
    0.55 * planetWeight(event.transit?.transitingPlanet) +
    0.45 * natalWeight(event.transit?.natalPlanet);

  // Soft aspects can still register as "signal" but not as hard disruption risk.
  const softDamp = SOFT_ASPECTS.has(normalizeAspect(event.transit?.aspect)) ? 0.32 : 1;
  // Slightly softer multipliers so hard aspects don't all land at the ceiling
  const combined =
    intensity * (0.38 + 0.48 * frictionBias) * (0.52 + 0.38 * weight) * softDamp;
  // Volatility 0–1 or 0–100
  const vol = volatility <= 1.5 ? volatility * 12 : volatility * 0.12;
  return softCeilingFriction(combined + vol);
}

function eventConfidence(event: AtmospherePredictiveEventInput): number {
  const raw = event.scores?.confidence;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 55;
  // Predictive confidence is sometimes 0–1
  return clamp(raw <= 1 ? raw * 100 : raw);
}

function driverLabel(event: AtmospherePredictiveEventInput, fallback?: string): string {
  const t = event.transit;
  if (t?.transitingPlanet && t?.aspect && t?.natalPlanet) {
    return `${t.transitingPlanet} ${t.aspect} ${t.natalPlanet}`;
  }
  return fallback || 'Transit pressure';
}

function mapStormDomains(storm: AtmosphereStormInput): LifeRiskDomain[] {
  const area = (storm.lifeArea || '').toLowerCase();
  const natal = normalizePlanet(storm.natalPlanet);
  if (area.includes('love') || area.includes('relation') || natal === 'venus') return ['love'];
  if (area.includes('career') || area.includes('work') || natal === 'saturn') return ['career'];
  if (area.includes('money') || area.includes('finance')) return ['money'];
  if (area.includes('family') || area.includes('home') || natal === 'moon') return ['family'];
  if (area.includes('health') || area.includes('body')) return ['health'];
  if (area.includes('identity') || area.includes('confidence') || natal === 'sun') return ['self'];
  if (natal === 'mars') return ['self', 'career'];
  if (natal === 'mercury') return ['career', 'self'];
  return ['self'];
}

function domainFromPredictive(
  event: AtmospherePredictiveEventInput
): Array<{ name: LifeRiskDomain; impact: number; valence: number }> {
  if (event.domains?.length) {
    return event.domains
      .filter((d): d is { name: LifeRiskDomain; impact: number; valence?: number } =>
        Boolean(d?.name)
      )
      .map((d, i) => ({
        name: d.name,
        // Compress domain impacts so a 100 from the engine becomes ~72–80, not 100
        impact: softCeilingFriction(
          (typeof d.impact === 'number' ? d.impact : 50) * (i === 0 ? 1 : 0.88)
        ),
        valence: typeof d.valence === 'number' ? d.valence : 0,
      }));
  }

  const natal = normalizePlanet(event.transit?.natalPlanet);
  const friction = eventBaseFriction(event);
  const valence = SOFT_ASPECTS.has(normalizeAspect(event.transit?.aspect))
    ? 0.6
    : HARD_ASPECTS.has(normalizeAspect(event.transit?.aspect))
      ? -0.7
      : -0.2;

  let names: LifeRiskDomain[] = ['self'];
  if (natal === 'venus') names = ['love'];
  else if (natal === 'moon') names = ['family', 'self'];
  else if (natal === 'mars') names = ['career', 'self'];
  else if (natal === 'saturn') names = ['career', 'money'];
  else if (natal === 'jupiter') names = ['career', 'money'];
  else if (natal === 'mercury') names = ['career', 'self'];
  else if (natal === 'sun') names = ['self', 'career'];
  else if (natal === 'pluto') names = ['self'];

  return names.map((name, i) => ({
    name,
    impact: softCeilingFriction(friction * (i === 0 ? 1 : 0.78)),
    valence,
  }));
}

function levelFromFriction(friction: number): LifeRiskLevel {
  // Thresholds match the softer 0–~88 scale (not old 0–100 slam)
  if (friction >= 72) return 'storm';
  if (friction >= 54) return 'friction';
  if (friction >= 36) return 'watch';
  return 'calm';
}

function looksLikeAspectLabel(text: string): boolean {
  return /\b(square|opposition|oppose|conjunct|conjunction|trine|sextile|quincunx)\b/i.test(text)
    || /\b(mars|venus|mercury|saturn|jupiter|uranus|neptune|pluto)\b.*\b(sun|moon|mars|venus|mercury|saturn)\b/i.test(
      text,
    );
}

/** Human headline — life stakes first, not "Mars Opposition Neptune". */
function headlineFor(
  level: LifeRiskLevel,
  topDriver?: string,
  domainHint?: string,
  themeHint?: string,
): string {
  const humanDriver =
    topDriver && !looksLikeAspectLabel(topDriver)
      ? topDriver.replace(/^(Elevated|High|Mild)\s+/i, '').trim()
      : '';
  const where = domainHint || humanDriver || themeHint || '';

  switch (level) {
    case 'storm':
      return where
        ? `High life-friction window around ${where}. Simplify hard.`
        : 'High life-friction window. Simplify hard.';
    case 'friction':
      return where
        ? `Friction elevated around ${where}. Pace decisions.`
        : 'Elevated friction ahead. Pace decisions.';
    case 'watch':
      return where
        ? `Mixed signals — watch ${where}.`
        : 'Mixed signals. Stay flexible.';
    default:
      return where
        ? `Relatively clear — ${where} is mild.`
        : 'Relatively clear window. Use the calm.';
  }
}

function moveFor(level: LifeRiskLevel, domains: LifeRiskDomainScore[]): string {
  const hot = domains
    .filter((d) => d.friction >= 55)
    .sort((a, b) => b.friction - a.friction)
    .slice(0, 2)
    .map((d) => d.label.toLowerCase());

  const domainHint = hot.length ? ` Protect ${hot.join(' + ')} bandwidth.` : '';

  switch (level) {
    case 'storm':
      return sanitizeCopyText(
        `Shrink commitments. Prefer reversible moves only.${domainHint}`
      );
    case 'friction':
      return sanitizeCopyText(
        `One priority max. Delay non-essential confrontations.${domainHint}`
      );
    case 'watch':
      return sanitizeCopyText(
        `Move, but leave an exit ramp. Check assumptions twice.${domainHint}`
      );
    default:
      return sanitizeCopyText(
        `Ship one meaningful thing. Save drama for louder weeks.${domainHint}`
      );
  }
}

/** Whether material life disruption is plausible this window (professional flag; not casual slang). */
function elevatedDisruptionRisk(level: LifeRiskLevel, friction: number, hardHits: number): boolean {
  if (level === 'storm' || level === 'friction') return true;
  if (level === 'watch' && (friction >= 46 || hardHits >= 2)) return true;
  return false;
}

function toWindowFromEvent(event: AtmospherePredictiveEventInput): LifeRiskWindow | null {
  const friction = eventBaseFriction(event);
  const aspect = normalizeAspect(event.transit?.aspect);
  const isHard = HARD_ASPECTS.has(aspect) || (aspect === 'conjunction' && HEAVY_PLANETS.has(normalizePlanet(event.transit?.transitingPlanet)));
  const isSoft = SOFT_ASPECTS.has(aspect);

  // Soft hits belong on the ease series even if intensity is mid-range.
  let kind: LifeRiskWindow['kind'] = 'mixed';
  if (isSoft) kind = 'support';
  else if (isHard || friction >= 55) kind = 'friction';

  const label = driverLabel(event);
  const phase = event.timing?.phase || 'peaking';
  const startsAt = event.timing?.startsAt;
  const peakAt = event.timing?.peakAt;
  const endsAt = event.timing?.endsAt;

  const domains = domainFromPredictive(event).map((d) => d.name);
  const confidence = eventConfidence(event);

  return {
    id: event.eventId || `evt-${label}`,
    kind,
    label,
    phase,
    startsAt,
    peakAt,
    endsAt,
    daysToPeak: event.timing?.daysToPeak,
    friction,
    ease: kind === 'support' ? eventEaseScore(event) : 0,
    confidence,
    domains,
    source: 'transit',
  };
}

function calendarDaysBetween(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split('-').map(Number);
  const [ty, tm, td] = toDate.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

function toWindowFromStorm(
  storm: AtmosphereStormInput,
  index: number,
  asOfDate?: string,
): LifeRiskWindow {
  // Graduated friction — never intensityScore * 10 (that forced 100s)
  let friction =
    typeof storm.intensityScore === 'number'
      ? stormScoreToFriction(storm.intensityScore)
      : STORM_INTENSITY[storm.intensity || 'moderate'] || 56;

  // Mild phase / wider emotional distance from "now" softens the bar a touch
  if (storm.phase === 'brewing') {
    friction = softCeilingFriction(friction * 0.88);
  }

  const label =
    storm.title ||
    (storm.transitingPlanet && storm.aspect && storm.natalPlanet
      ? `${storm.transitingPlanet} ${storm.aspect} ${storm.natalPlanet}`
      : 'Storm pressure');

  // Local noon ISO without Z — avoids UTC day-shift when charting by calendar date
  const peakAt = storm.date ? `${storm.date}T12:00:00` : undefined;

  // daysToPeak vs the packet's calendar day — never the server UTC clock
  let daysToPeak: number | undefined;
  if (storm.date && /^\d{4}-\d{2}-\d{2}$/.test(storm.date)) {
    const asOf =
      asOfDate && isValidCalendarDate(asOfDate)
        ? asOfDate
        : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    daysToPeak = calendarDaysBetween(asOf, storm.date);
  }

  // Peak days score fuller; far-out building days slightly lower so the chart isn't flat
  if (typeof daysToPeak === 'number' && daysToPeak > 2) {
    const distanceDamp = Math.max(0.72, 1 - (daysToPeak - 2) * 0.03);
    friction = softCeilingFriction(friction * distanceDamp);
  }

  return {
    id: `storm-${index}-${label}`,
    kind: 'friction',
    label,
    phase: storm.phase === 'brewing' ? 'building' : 'peaking',
    peakAt,
    startsAt: peakAt,
    endsAt: peakAt,
    daysToPeak,
    friction,
    confidence: storm.intensity === 'severe' ? 80 : storm.intensity === 'mild' ? 55 : 68,
    domains: mapStormDomains(storm),
    source: 'storm',
  };
}

function mergeDomainScores(
  events: AtmospherePredictiveEventInput[],
  storms: AtmosphereStormInput[]
): LifeRiskDomainScore[] {
  // Track full hit lists so we blend max + mean instead of pure max (which pinned 100s)
  const acc = new Map<
    LifeRiskDomain,
    { frictionHits: number[]; supportHits: number[]; hits: number }
  >();

  const ensure = (name: LifeRiskDomain) => {
    if (!acc.has(name)) acc.set(name, { frictionHits: [], supportHits: [], hits: 0 });
    return acc.get(name)!;
  };

  for (const event of events) {
    for (const d of domainFromPredictive(event)) {
      const bucket = ensure(d.name);
      const impact = softCeilingFriction(d.impact);
      if (d.valence >= 0.25) {
        bucket.supportHits.push(impact * 0.85);
      } else {
        const f = impact * (d.valence < -0.2 ? 1 : 0.72);
        bucket.frictionHits.push(f);
      }
      bucket.hits += 1;
    }
  }

  for (const storm of storms) {
    for (const name of mapStormDomains(storm)) {
      const bucket = ensure(name);
      const f =
        typeof storm.intensityScore === 'number'
          ? stormScoreToFriction(storm.intensityScore)
          : STORM_INTENSITY[storm.intensity || 'moderate'] || 56;
      // Secondary domains from a storm read a bit softer
      const primary = mapStormDomains(storm)[0] === name;
      bucket.frictionHits.push(primary ? f : f * 0.82);
      bucket.hits += 1;
    }
  }

  const blend = (hits: number[]): number => {
    if (!hits.length) return 0;
    const max = Math.max(...hits);
    const mean = hits.reduce((s, v) => s + v, 0) / hits.length;
    // Prefer mean for spread; max still pulls the ceiling up a bit
    const blended = 0.42 * max + 0.58 * mean;
    // Multi-hit mildly amplifies without stacking to 100
    const multi = 1 + 0.06 * Math.min(hits.length - 1, 3);
    return softCeilingFriction(blended * multi);
  };

  const allDomains: LifeRiskDomain[] = ['self', 'love', 'career', 'money', 'family', 'health'];
  return allDomains
    .map((name) => {
      const bucket = acc.get(name) || { frictionHits: [], supportHits: [], hits: 0 };
      return {
        name,
        label: DOMAIN_LABELS[name],
        friction: blend(bucket.frictionHits),
        support: blend(bucket.supportHits),
        hitCount: bucket.hits,
      };
    })
    .sort((a, b) => b.friction - a.friction || b.support - a.support);
}

const HARD_PEAK_FRICTION = 55;

function windowCalendarDay(window: LifeRiskWindow, asOfDate: string): string | null {
  return resolveWindowCalendarDate(window, asOfDate);
}

export function isHorizonFlowWindow(day: LifeRiskDayScore): boolean {
  return day.scored && day.ease > day.friction && day.friction < HARD_PEAK_FRICTION;
}

export function formatHorizonTooltip(day: LifeRiskDayScore): string {
  const when = (() => {
    try {
      return new Date(`${day.date}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return day.date;
    }
  })();
  if (!day.scored) return `${when} · Not calculated past the current window.`;
  const bits: string[] = [when];
  if (day.friction > 0) {
    bits.push(`friction ${day.friction}${day.frictionDriver ? ` · ${day.frictionDriver}` : ''}`);
  }
  if (day.ease > 0) {
    bits.push(`ease ${day.ease}${day.easeDriver ? ` · ${day.easeDriver}` : ''}`);
  }
  if (day.friction <= 0 && day.ease <= 0) {
    bits.push('No major hard or supportive hits scored this day.');
  }
  return bits.join(' · ');
}

/**
 * One bar per displayed day. Sampled days with no hits stay scored-quiet.
 * Days we did not sample are unscored — never the same empty slot as a zero.
 */
export function buildLifeRiskHorizon(options: {
  asOfDate: string;
  windowDays: number;
  windows: LifeRiskWindow[];
  sampledDays?: LifeRiskDayScore[] | null;
}): LifeRiskDayScore[] {
  const span = Math.max(1, Math.min(45, Math.round(options.windowDays || DEFAULT_RISK_WINDOW_DAYS)));
  const asOf = isValidCalendarDate(options.asOfDate)
    ? options.asOfDate
    : new Date().toISOString().slice(0, 10);

  const sampled = new Map<string, LifeRiskDayScore>();
  for (const row of options.sampledDays || []) {
    if (!row?.date) continue;
    sampled.set(row.date, {
      date: row.date,
      scored: row.scored !== false,
      friction: Math.max(0, Math.min(100, Math.round(row.friction || 0))),
      ease: Math.max(0, Math.min(100, Math.round(row.ease || 0))),
      frictionDriver: row.frictionDriver,
      easeDriver: row.easeDriver,
    });
  }

  const byDate = new Map<string, { friction: number; ease: number; frictionDriver?: string; easeDriver?: string }>();
  for (const w of options.windows) {
    const key = windowCalendarDay(w, asOf);
    if (!key) continue;
    const prev = byDate.get(key) || { friction: 0, ease: 0 };
    if (w.kind === 'support') {
      const ease = Math.max(prev.ease, Math.round(w.ease || 0));
      if (ease >= prev.ease) prev.easeDriver = w.label;
      prev.ease = ease;
    } else {
      const friction = Math.max(prev.friction, Math.round(w.friction || 0));
      if (friction >= prev.friction) prev.frictionDriver = w.label;
      prev.friction = friction;
    }
    byDate.set(key, prev);
  }

  const series: LifeRiskDayScore[] = [];
  for (let i = 0; i < span; i++) {
    const date = addCalendarDays(asOf, i);
    const sample = sampled.get(date);
    const overlay = byDate.get(date);
    if (sample) {
      series.push({
        date,
        scored: true,
        friction: Math.max(sample.friction, overlay?.friction || 0),
        ease: Math.max(sample.ease, overlay?.ease || 0),
        frictionDriver: (overlay?.friction || 0) >= sample.friction ? overlay?.frictionDriver : sample.frictionDriver,
        easeDriver: (overlay?.ease || 0) >= sample.ease ? overlay?.easeDriver : sample.easeDriver,
      });
      continue;
    }
    if (overlay) {
      series.push({
        date,
        scored: true,
        friction: overlay.friction,
        ease: overlay.ease,
        frictionDriver: overlay.frictionDriver,
        easeDriver: overlay.easeDriver,
      });
      continue;
    }
    series.push({
      date,
      scored: false,
      friction: 0,
      ease: 0,
    });
  }
  return series;
}

export interface ComputeLifeRiskInput {
  date?: string;
  windowDays?: number;
  intensity?: number;
  confidence?: number;
  forecast?: AtmosphereForecastInput | null;
  predictive?: AtmospherePredictiveInput | null;
  storms?: AtmosphereStormsInput | null;
  /** Layered signal alignment from progressions / profections / solar arcs */
  confluence?: Pick<AtmosphereConfluence, 'aligned' | 'tripleHit' | 'signalCount' | 'themes'> | null;
}

/**
 * Pure scorer: build LifeRiskPacket from existing atmosphere inputs.
 */
export function computeLifeRisk(input: ComputeLifeRiskInput = {}): LifeRiskPacket {
  const events = input.predictive?.events || [];
  const storms = input.storms?.storms || [];
  const windowDays =
    typeof input.windowDays === 'number' && input.windowDays > 0
      ? input.windowDays
      : DEFAULT_RISK_WINDOW_DAYS;

  const eventWindows = events
    .map(toWindowFromEvent)
    .filter((w): w is LifeRiskWindow => Boolean(w));
  const stormWindows = storms.map((storm, index) => toWindowFromStorm(storm, index, input.date));
  const allWindows = [...eventWindows, ...stormWindows].sort((a, b) => {
    // Friction first, then by peak timing
    if (b.friction !== a.friction) return b.friction - a.friction;
    const aPeak = a.peakAt || a.startsAt || '';
    const bPeak = b.peakAt || b.startsAt || '';
    return aPeak.localeCompare(bPeak);
  });
  const windows = allWindows.slice(0, 16);

  const frictionWindows = windows.filter((w) => w.kind === 'friction');
  const supportWindows = windows.filter((w) => w.kind === 'support');
  const hardHits = frictionWindows.filter((w) => w.friction >= 55).length;

  const topEventFriction = eventWindows[0]?.friction ?? 0;
  const topStormFriction = stormWindows[0]?.friction ?? 0;
  const ratingFriction = dayRatingFriction(input.forecast?.day_rating);
  const intensityFriction =
    typeof input.intensity === 'number' && Number.isFinite(input.intensity)
      ? clamp(input.intensity)
      : null;

  // Weighted overall: hard windows dominate; day rating / atmosphere intensity fill gaps.
  const pieces: Array<{ value: number; weight: number }> = [];
  if (topEventFriction > 0) pieces.push({ value: topEventFriction, weight: 0.4 });
  if (topStormFriction > 0) pieces.push({ value: topStormFriction, weight: 0.3 });
  if (ratingFriction !== null) pieces.push({ value: ratingFriction, weight: 0.15 });
  if (intensityFriction !== null) pieces.push({ value: intensityFriction, weight: 0.15 });

  // Soft-only sky: pull overall down so we don't cry wolf
  if (eventWindows.length > 0 && frictionWindows.length === 0 && topStormFriction < 50) {
    pieces.push({ value: 28, weight: 0.25 });
  }

  let overallFriction = 42;
  if (pieces.length > 0) {
    const totalWeight = pieces.reduce((s, p) => s + p.weight, 0);
    overallFriction = clamp(
      pieces.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight
    );
  }

  // Cluster bonus: multiple hard hits — modest, so we don't re-ceiling the scale
  if (hardHits >= 3) overallFriction = softCeilingFriction(overallFriction + 6);
  else if (hardHits === 2) overallFriction = softCeilingFriction(overallFriction + 3);

  // Confluence: layered signals raise odds without slamming everything to 100
  const confluence = input.confluence;
  if (confluence?.tripleHit) {
    overallFriction = softCeilingFriction(overallFriction + 8);
  } else if (confluence?.aligned) {
    const signalBoost = Math.min(6, 2 + (confluence.signalCount || 0));
    overallFriction = softCeilingFriction(overallFriction + signalBoost);
  }

  // Final overall pass through soft ceiling
  overallFriction = softCeilingFriction(overallFriction);

  const level = levelFromFriction(overallFriction);
  const domains = mergeDomainScores(events, storms);

  const topDrivers: LifeRiskDriver[] = windows.slice(0, 5).map((w) => ({
    label: w.label,
    friction: w.friction,
    kind: w.kind,
    phase: w.phase,
    peakAt: w.peakAt,
    domains: w.domains,
    source: w.source,
  }));

  const topDriverLabel = topDrivers[0]?.label;
  const confidences = [
    ...(typeof input.confidence === 'number' ? [clamp(input.confidence)] : []),
    ...windows.slice(0, 3).map((w) => w.confidence),
  ];
  let confidence =
    confidences.length > 0
      ? clamp(confidences.reduce((s, c) => s + c, 0) / confidences.length)
      : 50;

  if (confluence?.tripleHit) confidence = clamp(confidence + 12);
  else if (confluence?.aligned) confidence = clamp(confidence + 6);

  const nextFriction = frictionWindows[0];
  const nextSupport = supportWindows[0];

  let elevatedDisruption = elevatedDisruptionRisk(level, overallFriction, hardHits);
  // Triple-hit on a non-calm sky → treat as plausible disruption even at "watch"
  if (confluence?.tripleHit && overallFriction >= 48) {
    elevatedDisruption = true;
  } else if (confluence?.aligned && level !== 'calm' && overallFriction >= 50) {
    elevatedDisruption = true;
  }

  const provenance = [
    'life-risk-v1',
    ...(events.length ? ['predictive-events'] : []),
    ...(storms.length ? ['storms'] : []),
    ...(input.forecast?.day_rating ? ['day-rating'] : []),
    ...(intensityFriction !== null ? ['atmosphere-intensity'] : []),
    ...(confluence?.tripleHit ? ['confluence-triple-hit'] : []),
    ...(confluence?.aligned && !confluence.tripleHit ? ['confluence-aligned'] : []),
  ];

  const date =
    input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date)
      ? input.date
      : new Date().toISOString().slice(0, 10);

  const horizon = buildLifeRiskHorizon({
    asOfDate: date,
    windowDays,
    windows: allWindows,
    sampledDays: input.storms?.dayHorizon || null,
  });

  const hotDomainLabels = domains
    .filter((d) => d.friction >= 48)
    .sort((a, b) => b.friction - a.friction)
    .slice(0, 2)
    .map((d) => d.label.toLowerCase());
  const domainHint = hotDomainLabels.length ? hotDomainLabels.join(' + ') : '';
  const themeForHeadline =
    confluence?.aligned && confluence.themes?.length
      ? confluence.themes.slice(0, 2).join(', ')
      : '';

  return {
    date,
    windowDays,
    overallFriction,
    level,
    elevatedDisruption,
    confidence,
    headline: sanitizeCopyText(
      headlineFor(level, topDriverLabel, domainHint, themeForHeadline),
    ),
    move: moveFor(level, domains),
    topDrivers,
    frictionWindows: frictionWindows.slice(0, 8),
    supportWindows: supportWindows.slice(0, 4),
    horizon,
    nextFrictionPeak: nextFriction
      ? {
          label: nextFriction.label,
          peakAt: nextFriction.peakAt || nextFriction.startsAt,
          daysToPeak: nextFriction.daysToPeak,
          friction: nextFriction.friction,
        }
      : null,
    nextSupportPeak: nextSupport
      ? {
          label: nextSupport.label,
          peakAt: nextSupport.peakAt || nextSupport.startsAt,
          daysToPeak: nextSupport.daysToPeak,
          friction: nextSupport.friction,
        }
      : null,
    domains,
    provenance,
    generatedAt: new Date().toISOString(),
  };
}

export function lifeRiskLevelPresentation(level: LifeRiskLevel): {
  label: string;
  shortLabel: string;
  badgeClass: string;
  barClass: string;
  /** Tailwind text class for severity title/fonts */
  textClass: string;
  /** Hex for inline emphasis */
  hex: string;
  description: string;
} {
  switch (level) {
    case 'storm':
      return {
        label: 'Storm risk',
        shortLabel: 'Storm',
        badgeClass: 'border-rose-400/50 bg-rose-500/15 text-rose-100',
        barClass: 'from-rose-500 via-fuchsia-500 to-violet-600',
        textClass: 'text-rose-200',
        hex: '#fb7185',
        description:
          'Hard pressure is elevated. Friction rises if you overcommit — shrink the plate, not your worth.',
      };
    case 'friction':
      return {
        label: 'Friction elevated',
        shortLabel: 'Friction',
        badgeClass: 'border-orange-400/50 bg-orange-500/15 text-orange-100',
        barClass: 'from-amber-500 via-orange-500 to-rose-500',
        textClass: 'text-orange-200',
        hex: '#fb923c',
        description: 'Active pressure windows. Pace yourself; prefer reversible moves. Not a verdict.',
      };
    case 'watch':
      return {
        label: 'Watch window',
        shortLabel: 'Watch',
        badgeClass: 'border-amber-400/50 bg-amber-500/15 text-amber-100',
        barClass: 'from-amber-400 via-yellow-500 to-orange-400',
        textClass: 'text-amber-200',
        hex: '#fbbf24',
        description: 'Mixed transit signals. Stay flexible and check assumptions twice.',
      };
    default:
      return {
        label: 'Relatively clear',
        shortLabel: 'Clear',
        badgeClass: 'border-emerald-400/45 bg-emerald-500/15 text-emerald-100',
        barClass: 'from-emerald-500 via-teal-500 to-cyan-500',
        textClass: 'text-emerald-200',
        hex: '#34d399',
        description: 'No major hard-transit cluster. Use the calmer window productively.',
      };
  }
}
