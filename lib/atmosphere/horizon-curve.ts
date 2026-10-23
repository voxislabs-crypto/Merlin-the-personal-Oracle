/**
 * Forecast horizon curve.
 *
 * Same day scores the bar strip used (friction above, ease below), drawn as one
 * smooth line. Peak glyphs are placed from the same transit windows. No randomness:
 * equal inputs always yield the same path and the same marker positions.
 */

import { DOMAIN_LABELS, emphasizeHorizonWinner } from '@/lib/atmosphere/life-risk';
import type { LifeRiskDayScore, LifeRiskDomain, LifeRiskWindowKind } from '@/lib/atmosphere/types';
import { calendarDateFromInstant, resolveWindowCalendarDate } from '@/lib/datetime/local-calendar';
import { parseTransitPhrase, resolvePlanetStyle } from '@/lib/astrology/planet-style';

/** Hard-pressure / ease magnitude that earns a planet marker. Matches the amber band. */
export const HORIZON_PEAK_MIN = 42;

/** Peaks this many days apart share a marker group so glyphs do not stack. */
export const HORIZON_CLUSTER_DAYS = 2;

/** When a transit's influence starts before exactness, sit the glyph this many days earlier. */
export const HORIZON_INFLUENCE_LEAD_DAYS = 1;

export interface HorizonCurveLayout {
  width: number;
  height: number;
  padX: number;
  plotTop: number;
  plotBottom: number;
}

export const HORIZON_CURVE_LAYOUT: HorizonCurveLayout = {
  width: 960,
  height: 196,
  padX: 18,
  plotTop: 52,
  plotBottom: 184,
};

export interface HorizonPeakSource {
  id: string;
  label: string;
  kind: LifeRiskWindowKind;
  friction: number;
  ease?: number;
  peakAt?: string;
  startsAt?: string;
  endsAt?: string;
  daysToPeak?: number;
  domains?: LifeRiskDomain[];
}

export interface HorizonPeak {
  id: string;
  label: string;
  planet: string;
  glyph: string;
  color: string;
  kind: 'friction' | 'support';
  intensity: number;
  theme: string;
  peakIndex: number;
  peakDate: string;
  startIndex: number;
  anchorIndex: number;
  anchorDate: string;
}

export interface HorizonGlyphCluster {
  id: string;
  anchorIndex: number;
  members: HorizonPeak[];
}

export interface PlacedHorizonGlyph {
  id: string;
  clusterId: string;
  xIndex: number;
  lane: number;
  extraCount: number;
  member: HorizonPeak;
}

export interface HorizonCurvePaths {
  strokes: string[];
  fills: string[];
  unscored: Array<{ x: number; width: number }>;
}

interface CurvePoint {
  index: number;
  x: number;
  y: number;
}

function fmt(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return rounded.toFixed(2);
}

function norm(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function horizonMidY(layout: HorizonCurveLayout = HORIZON_CURVE_LAYOUT): number {
  return (layout.plotTop + layout.plotBottom) / 2;
}

export function horizonSlotWidth(
  count: number,
  layout: HorizonCurveLayout = HORIZON_CURVE_LAYOUT,
): number {
  if (count <= 0) return 0;
  return (layout.width - layout.padX * 2) / count;
}

export function horizonDayX(
  index: number,
  count: number,
  layout: HorizonCurveLayout = HORIZON_CURVE_LAYOUT,
): number {
  return layout.padX + (index + 0.5) * horizonSlotWidth(count, layout);
}

/**
 * Signed pressure for one day. Positive is hard pressure, negative is supportive flow.
 * Quiet days sit on the midline. Unscored days are omitted from the line.
 */
export function signedHorizonIntensity(day: LifeRiskDayScore): number | null {
  if (!day.scored) return null;
  const display = emphasizeHorizonWinner(day);
  if (display.quiet) return 0;
  if (display.friction >= display.ease) return display.friction;
  return -display.ease;
}

export function horizonIntensityY(
  intensity: number,
  layout: HorizonCurveLayout = HORIZON_CURVE_LAYOUT,
): number {
  const mid = horizonMidY(layout);
  const half = (layout.plotBottom - layout.plotTop) / 2;
  const clamped = Math.max(-100, Math.min(100, intensity));
  const y = mid - (clamped / 100) * half;
  return Math.max(layout.plotTop, Math.min(layout.plotBottom, y));
}

function clampPlotY(y: number, layout: HorizonCurveLayout): number {
  return Math.max(layout.plotTop, Math.min(layout.plotBottom, y));
}

function controlPoint(
  p0: CurvePoint,
  p1: CurvePoint,
  p2: CurvePoint,
  p3: CurvePoint,
  layout: HorizonCurveLayout,
): { c1x: number; c1y: number; c2x: number; c2y: number } {
  // Uniform Catmull-Rom (divisor 6). Daily samples bend the line; nothing random is added.
  return {
    c1x: p1.x + (p2.x - p0.x) / 6,
    c1y: clampPlotY(p1.y + (p2.y - p0.y) / 6, layout),
    c2x: p2.x - (p3.x - p1.x) / 6,
    c2y: clampPlotY(p2.y - (p3.y - p1.y) / 6, layout),
  };
}

function strokePath(points: CurvePoint[], layout: HorizonCurveLayout): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const point = points[0];
    const half = Math.min(8, horizonSlotWidth(Math.max(points.length, 1), layout) * 0.28);
    return `M ${fmt(point.x - half)} ${fmt(point.y)} L ${fmt(point.x + half)} ${fmt(point.y)}`;
  }
  let path = `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const control = controlPoint(p0, p1, p2, p3, layout);
    path += ` C ${fmt(control.c1x)} ${fmt(control.c1y)}, ${fmt(control.c2x)} ${fmt(control.c2y)}, ${fmt(p2.x)} ${fmt(p2.y)}`;
  }
  return path;
}

function fillPath(points: CurvePoint[], layout: HorizonCurveLayout): string {
  if (points.length < 2) return '';
  const mid = horizonMidY(layout);
  const last = points[points.length - 1];
  const first = points[0];
  return `${strokePath(points, layout)} L ${fmt(last.x)} ${fmt(mid)} L ${fmt(first.x)} ${fmt(mid)} Z`;
}

export function buildHorizonCurvePaths(
  days: LifeRiskDayScore[],
  layout: HorizonCurveLayout = HORIZON_CURVE_LAYOUT,
): HorizonCurvePaths {
  const strokes: string[] = [];
  const fills: string[] = [];
  const unscored: Array<{ x: number; width: number }> = [];
  const count = days.length;
  const slot = horizonSlotWidth(count, layout);

  let run: CurvePoint[] = [];
  let unscoredStart = -1;

  const flushRun = () => {
    if (run.length === 0) return;
    strokes.push(strokePath(run, layout));
    const fill = fillPath(run, layout);
    if (fill) fills.push(fill);
    run = [];
  };

  const flushUnscored = (endIndex: number) => {
    if (unscoredStart < 0 || count === 0) return;
    const x = horizonDayX(unscoredStart, count, layout) - slot / 2;
    const endX = horizonDayX(endIndex, count, layout) + slot / 2;
    unscored.push({ x, width: Math.max(0, endX - x) });
    unscoredStart = -1;
  };

  days.forEach((day, index) => {
    const intensity = signedHorizonIntensity(day);
    if (intensity == null) {
      flushRun();
      if (unscoredStart < 0) unscoredStart = index;
      return;
    }
    flushUnscored(index - 1);
    run.push({
      index,
      x: horizonDayX(index, count, layout),
      y: horizonIntensityY(intensity, layout),
    });
  });
  flushRun();
  flushUnscored(count - 1);

  return { strokes, fills, unscored };
}

function winningDriver(day: LifeRiskDayScore): string {
  const signed = signedHorizonIntensity(day);
  if (signed == null) return '';
  if (signed < 0) return day.easeDriver || day.frictionDriver || '';
  if (signed > 0) return day.frictionDriver || day.easeDriver || '';
  return day.frictionDriver || day.easeDriver || '';
}

function planetMark(label: string): { planet: string; glyph: string; color: string } {
  const parsed = parseTransitPhrase(label);
  const raw = parsed?.transiting || label.trim().split(/\s+/)[0] || 'Peak';
  const style = resolvePlanetStyle(raw);
  if (!style) {
    return { planet: raw, glyph: raw.slice(0, 2), color: '#94a3b8' };
  }
  const glyph = style.glyph && style.glyph !== '•' ? style.glyph : raw.slice(0, 2);
  return { planet: style.name, glyph, color: style.hex };
}

function themeFor(label: string, domains?: LifeRiskDomain[]): string {
  const names = (domains || [])
    .map((domain) => DOMAIN_LABELS[domain])
    .filter((name): name is string => Boolean(name));
  if (names.length > 0) return names.join(', ');
  const parsed = parseTransitPhrase(label);
  if (parsed?.aspect && parsed.natal) return `${parsed.aspect.toLowerCase()} ${parsed.natal}`;
  return '';
}

function peakSignal(source: HorizonPeakSource): { kind: 'friction' | 'support'; intensity: number } {
  const friction = Math.max(0, Math.round(source.friction || 0));
  const ease = Math.max(0, Math.round(source.ease || 0));
  if (source.kind === 'support' || (source.kind === 'mixed' && ease > friction)) {
    return { kind: 'support', intensity: ease > 0 ? ease : friction };
  }
  return { kind: 'friction', intensity: friction };
}

function anchorFor(peakIndex: number, startIndex: number): number {
  const start = Math.min(startIndex, peakIndex);
  const spread = peakIndex - start;
  const lead = spread >= 1 ? HORIZON_INFLUENCE_LEAD_DAYS : 0;
  return Math.max(start, peakIndex - lead);
}

function comparePeaks(a: HorizonPeak, b: HorizonPeak): number {
  return (
    b.intensity - a.intensity ||
    a.anchorIndex - b.anchorIndex ||
    a.peakIndex - b.peakIndex ||
    a.label.localeCompare(b.label) ||
    a.id.localeCompare(b.id)
  );
}

function peaksNear(a: HorizonPeak, b: HorizonPeak): boolean {
  return (
    Math.abs(a.anchorIndex - b.anchorIndex) <= HORIZON_CLUSTER_DAYS ||
    Math.abs(a.peakIndex - b.peakIndex) <= HORIZON_CLUSTER_DAYS
  );
}

interface DriverRun {
  label: string;
  startIndex: number;
  peakIndex: number;
  intensity: number;
  kind: 'friction' | 'support';
}

function driverRuns(days: LifeRiskDayScore[]): DriverRun[] {
  const runs: DriverRun[] = [];
  let current: DriverRun | null = null;

  days.forEach((day, index) => {
    const signed = signedHorizonIntensity(day);
    const label = signed == null ? '' : winningDriver(day);
    const key = norm(label);
    if (!key || signed == null) {
      current = null;
      return;
    }
    const intensity = Math.abs(signed);
    const kind: 'friction' | 'support' = signed < 0 ? 'support' : 'friction';
    if (!current || norm(current.label) !== key) {
      current = { label, startIndex: index, peakIndex: index, intensity, kind };
      runs.push(current);
      return;
    }
    if (intensity > current.intensity) {
      current.intensity = intensity;
      current.peakIndex = index;
      current.kind = kind;
    }
  });

  return runs.filter((run) => run.intensity >= HORIZON_PEAK_MIN);
}

function toPeak(
  partial: Omit<HorizonPeak, 'anchorIndex' | 'anchorDate' | 'planet' | 'glyph' | 'color' | 'theme'> & {
    domains?: LifeRiskDomain[];
  },
  days: LifeRiskDayScore[],
): HorizonPeak {
  const mark = planetMark(partial.label);
  const anchorIndex = anchorFor(partial.peakIndex, partial.startIndex);
  return {
    id: partial.id,
    label: partial.label,
    planet: mark.planet,
    glyph: mark.glyph,
    color: mark.color,
    kind: partial.kind,
    intensity: partial.intensity,
    theme: themeFor(partial.label, partial.domains),
    peakIndex: partial.peakIndex,
    peakDate: days[partial.peakIndex]?.date || partial.peakDate,
    startIndex: Math.min(partial.startIndex, partial.peakIndex),
    anchorIndex,
    anchorDate: days[anchorIndex]?.date || partial.peakDate,
  };
}

/**
 * Significant transit peaks inside the horizon.
 * A spreading influence anchors one day before exactness.
 */
export function collectHorizonPeaks(
  days: LifeRiskDayScore[],
  windows: HorizonPeakSource[],
  asOfDate: string,
): HorizonPeak[] {
  if (days.length === 0) return [];
  const dates = days.map((day) => day.date);
  const peaks: HorizonPeak[] = [];

  const absorb = (next: HorizonPeak) => {
    const key = norm(next.label);
    const existing = peaks.find(
      (peak) => norm(peak.label) === key && Math.abs(peak.peakIndex - next.peakIndex) <= HORIZON_CLUSTER_DAYS,
    );
    if (!existing) {
      peaks.push(next);
      return;
    }
    const startIndex = Math.min(existing.startIndex, next.startIndex);
    const louder = next.intensity > existing.intensity ? next : existing;
    // An explicit transit window owns the exact date. A day-run only fills the spread.
    const dated = [existing, next].find((peak) => !peak.id.startsWith('run:')) ?? louder;
    const themed =
      [existing, next].find((peak) => !peak.id.startsWith('run:') && peak.theme)?.theme ||
      louder.theme ||
      existing.theme ||
      next.theme;
    const merged = toPeak(
      {
        id: dated.id,
        label: dated.label,
        kind: louder.kind,
        intensity: Math.max(existing.intensity, next.intensity),
        peakIndex: dated.peakIndex,
        peakDate: dated.peakDate,
        startIndex,
      },
      days,
    );
    merged.theme = themed;
    peaks[peaks.indexOf(existing)] = merged;
  };

  for (const source of windows) {
    if (!source?.label?.trim()) continue;
    const signal = peakSignal(source);
    if (signal.intensity < HORIZON_PEAK_MIN) continue;
    const peakDate = resolveWindowCalendarDate(source, asOfDate);
    if (!peakDate) continue;
    const peakIndex = dates.indexOf(peakDate);
    if (peakIndex < 0) continue;

    let startIndex = peakIndex;
    const startDate = calendarDateFromInstant(source.startsAt);
    if (startDate) {
      const start = dates.indexOf(startDate);
      if (start >= 0 && start <= peakIndex) startIndex = start;
    }
    const key = norm(source.label);
    while (startIndex > 0 && norm(winningDriver(days[startIndex - 1]) || '') === key) {
      startIndex -= 1;
    }

    absorb(
      toPeak(
        {
          id: `${source.id}@${peakIndex}`,
          label: source.label,
          kind: signal.kind,
          intensity: signal.intensity,
          theme: '',
          peakIndex,
          peakDate,
          startIndex,
          domains: source.domains,
        },
        days,
      ),
    );
  }

  for (const run of driverRuns(days)) {
    absorb(
      toPeak(
        {
          id: `run:${norm(run.label)}:${run.peakIndex}`,
          label: run.label,
          kind: run.kind,
          intensity: run.intensity,
          theme: '',
          peakIndex: run.peakIndex,
          peakDate: days[run.peakIndex].date,
          startIndex: run.startIndex,
          domains: undefined,
        },
        days,
      ),
    );
  }

  return peaks.sort(comparePeaks);
}

/** Group peaks that land within a couple of days. Loudest peak owns the group. */
export function clusterHorizonPeaks(peaks: HorizonPeak[]): HorizonGlyphCluster[] {
  const remaining = [...peaks].sort(comparePeaks);
  const clusters: HorizonGlyphCluster[] = [];

  while (remaining.length > 0) {
    const primary = remaining.shift();
    if (!primary) break;
    const members = [primary];
    for (let i = remaining.length - 1; i >= 0; i -= 1) {
      if (peaksNear(primary, remaining[i])) {
        members.push(remaining.splice(i, 1)[0]);
      }
    }
    members.sort(comparePeaks);
    clusters.push({
      id: members
        .map((member) => member.id)
        .sort()
        .join('~'),
      anchorIndex: members[0].anchorIndex,
      members,
    });
  }

  return clusters.sort(
    (a, b) => a.anchorIndex - b.anchorIndex || a.id.localeCompare(b.id),
  );
}

/**
 * One or two glyphs per cluster. Three or more collapse to the loudest glyph
 * plus a count, so a crowded couple of days stays readable.
 */
export function placeHorizonGlyphs(clusters: HorizonGlyphCluster[]): PlacedHorizonGlyph[] {
  const placed: PlacedHorizonGlyph[] = [];

  for (const cluster of clusters) {
    const members = cluster.members;
    if (members.length >= 3) {
      placed.push({
        id: members[0].id,
        clusterId: cluster.id,
        xIndex: members[0].anchorIndex,
        lane: 0,
        extraCount: members.length - 1,
        member: members[0],
      });
      continue;
    }
    if (members.length === 2) {
      const gap = Math.abs(members[0].anchorIndex - members[1].anchorIndex);
      const stack = gap <= 1;
      members.forEach((member, lane) => {
        placed.push({
          id: member.id,
          clusterId: cluster.id,
          xIndex: stack ? members[0].anchorIndex : member.anchorIndex,
          lane,
          extraCount: 0,
          member,
        });
      });
      continue;
    }
    if (members[0]) {
      placed.push({
        id: members[0].id,
        clusterId: cluster.id,
        xIndex: members[0].anchorIndex,
        lane: 0,
        extraCount: 0,
        member: members[0],
      });
    }
  }

  return placed.sort(
    (a, b) => a.xIndex - b.xIndex || a.lane - b.lane || a.id.localeCompare(b.id),
  );
}
