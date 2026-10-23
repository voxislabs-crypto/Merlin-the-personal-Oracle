'use client';

import { useId, useMemo, useState } from 'react';
import { TransitAspectLabel } from '@/components/astrology/PlanetLabel';
import {
  buildHorizonCurvePaths,
  clusterHorizonPeaks,
  collectHorizonPeaks,
  horizonDayX,
  horizonIntensityY,
  horizonMidY,
  HORIZON_CURVE_LAYOUT,
  placeHorizonGlyphs,
  signedHorizonIntensity,
  type HorizonGlyphCluster,
  type HorizonPeak,
  type HorizonPeakSource,
} from '@/lib/atmosphere/horizon-curve';
import {
  formatHorizonTooltip,
  horizonHasUnscored,
  isHorizonFlowWindow,
} from '@/lib/atmosphere/life-risk';
import type { LifeRiskDayScore } from '@/lib/atmosphere/types';
import { getLocalCalendarDate } from '@/lib/datetime/local-calendar';
import { cn } from '@/lib/utils';

const FRICTION_COLOR = '#f97316';
const FRICTION_HOT = '#ea580c';
const EASE_COLOR = '#0284c7';

const LAYOUT = HORIZON_CURVE_LAYOUT;
const GLYPH_LANE_TOP = [4, 32];

function formatDayLabel(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day, 12).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function glyphSummary(peak: HorizonPeak): string {
  const meter = peak.kind === 'support' ? 'ease' : 'friction load';
  const theme = peak.theme ? ` · ${peak.theme}` : '';
  return `${peak.planet} ${peak.glyph}. ${peak.label}. ${meter} ${peak.intensity}${theme}. Exact ${formatDayLabel(peak.peakDate)}.`;
}

export interface HorizonCurveChartProps {
  horizon: LifeRiskDayScore[];
  windowDays: number;
  asOfDate: string;
  windows: HorizonPeakSource[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

/**
 * One continuous pressure curve for the forecast horizon, with planet glyphs
 * on the approach to each significant peak.
 */
export function HorizonCurveChart({
  horizon,
  windowDays,
  asOfDate,
  windows,
  selectedDate,
  onSelectDate,
}: HorizonCurveChartProps) {
  const reactId = useId().replace(/:/g, '');
  const [openClusterId, setOpenClusterId] = useState<string | null>(null);
  const today = getLocalCalendarDate();
  const series = horizon;
  const count = series.length;
  const midY = horizonMidY(LAYOUT);
  const windowLabel =
    windowDays === 10
      ? 'Next ten days — pressure and ease'
      : `Next ${windowDays} days — pressure and ease`;

  const paths = useMemo(() => buildHorizonCurvePaths(series, LAYOUT), [series]);
  const clusters = useMemo(
    () => clusterHorizonPeaks(collectHorizonPeaks(series, windows, asOfDate)),
    [series, windows, asOfDate],
  );
  const glyphs = useMemo(() => placeHorizonGlyphs(clusters), [clusters]);
  const openCluster: HorizonGlyphCluster | null =
    clusters.find((cluster) => cluster.id === openClusterId) ?? null;
  const selectedIndex = series.findIndex((day) => day.date === selectedDate);

  const selectDay = (date: string) => {
    setOpenClusterId(null);
    onSelectDate(selectedDate === date ? null : date);
  };

  const selectGlyph = (clusterId: string, peakDate: string) => {
    onSelectDate(peakDate);
    setOpenClusterId((current) => (current === clusterId ? null : clusterId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{windowLabel}</p>
        <p className="text-[10px] text-slate-500">tap a day · 0–100</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 px-2 pt-3 pb-2">
        <p className="mb-1 text-[10px] text-slate-500 sm:hidden">Swipe sideways for the full month.</p>
        <div
          className="touch-pan-x overflow-x-auto overscroll-x-contain pb-1"
          role="group"
          aria-label={windowLabel}
        >
          <div className="min-w-[52rem]">
            <div className="relative">
              <svg
                viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`}
                className="pointer-events-none block h-auto w-full"
                aria-hidden
              >
                <defs>
                  <linearGradient
                    id={`${reactId}-pressure`}
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    y1={LAYOUT.plotTop}
                    x2="0"
                    y2={LAYOUT.plotBottom}
                  >
                    <stop offset="0%" stopColor={FRICTION_HOT} />
                    <stop offset="46%" stopColor={FRICTION_COLOR} />
                    <stop offset="50%" stopColor="#94a3b8" />
                    <stop offset="54%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor={EASE_COLOR} />
                  </linearGradient>
                  <pattern
                    id={`${reactId}-hatch`}
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-45)"
                  >
                    <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(148,163,184,0.45)" strokeWidth="2" />
                  </pattern>
                  <clipPath id={`${reactId}-plot`}>
                    <rect
                      x={LAYOUT.padX}
                      y={LAYOUT.plotTop}
                      width={LAYOUT.width - LAYOUT.padX * 2}
                      height={LAYOUT.plotBottom - LAYOUT.plotTop}
                    />
                  </clipPath>
                </defs>

                <line
                  x1={LAYOUT.padX}
                  x2={LAYOUT.width - LAYOUT.padX}
                  y1={midY}
                  y2={midY}
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1"
                />

                {paths.unscored.map((band) => (
                  <g key={`unscored-${band.x}`}>
                    <rect
                      x={band.x}
                      y={LAYOUT.plotTop}
                      width={band.width}
                      height={LAYOUT.plotBottom - LAYOUT.plotTop}
                      fill={`url(#${reactId}-hatch)`}
                      opacity={0.45}
                    />
                    <line
                      x1={band.x}
                      x2={band.x + band.width}
                      y1={midY}
                      y2={midY}
                      stroke="#64748b"
                      strokeWidth="1.5"
                      strokeDasharray="3 4"
                    />
                  </g>
                ))}

                <g clipPath={`url(#${reactId}-plot)`}>
                  {paths.fills.map((fill, index) => (
                    <path key={`fill-${index}`} d={fill} fill={`url(#${reactId}-pressure)`} opacity={0.18} />
                  ))}
                  {paths.strokes.map((stroke, index) => (
                    <path
                      key={`stroke-${index}`}
                      d={stroke}
                      fill="none"
                      stroke={`url(#${reactId}-pressure)`}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ))}
                </g>

                {clusters.flatMap((cluster) =>
                  cluster.members.map((member) => {
                    if (member.startIndex === member.peakIndex) return null;
                    return (
                      <line
                        key={`span-${member.id}`}
                        x1={horizonDayX(member.startIndex, count, LAYOUT)}
                        x2={horizonDayX(member.peakIndex, count, LAYOUT)}
                        y1={LAYOUT.plotTop + 3}
                        y2={LAYOUT.plotTop + 3}
                        stroke={member.kind === 'support' ? EASE_COLOR : FRICTION_COLOR}
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity={0.7}
                      />
                    );
                  }),
                )}

                {clusters.flatMap((cluster) =>
                  cluster.members.map((member) => {
                    const day = series[member.peakIndex];
                    const intensity = day ? signedHorizonIntensity(day) : null;
                    if (intensity == null) return null;
                    return (
                      <circle
                        key={`dot-${member.id}`}
                        cx={horizonDayX(member.peakIndex, count, LAYOUT)}
                        cy={horizonIntensityY(intensity, LAYOUT)}
                        r="3.6"
                        fill={member.color}
                        stroke="#020617"
                        strokeWidth="1"
                      />
                    );
                  }),
                )}

                {selectedIndex >= 0 ? (
                  <line
                    x1={horizonDayX(selectedIndex, count, LAYOUT)}
                    x2={horizonDayX(selectedIndex, count, LAYOUT)}
                    y1={LAYOUT.plotTop}
                    y2={LAYOUT.plotBottom}
                    stroke="#ddd6fe"
                    strokeWidth="1.5"
                  />
                ) : null}

                {series.map((day, index) =>
                  day.date === today ? (
                    <circle
                      key={`today-${day.date}`}
                      cx={horizonDayX(index, count, LAYOUT)}
                      cy={LAYOUT.plotBottom - 1}
                      r="2.6"
                      fill="#c4b5fd"
                    />
                  ) : null,
                )}
              </svg>

              {count > 0
                ? series.map((day, index) => {
                    const slot = (LAYOUT.width - LAYOUT.padX * 2) / count;
                    const left = ((horizonDayX(index, count, LAYOUT) - slot / 2) / LAYOUT.width) * 100;
                    const width = (slot / LAYOUT.width) * 100;
                    return (
                      <button
                        key={`hit-${day.date}`}
                        type="button"
                        tabIndex={-1}
                        aria-hidden
                        onClick={() => selectDay(day.date)}
                        className="absolute z-10 touch-pan-x bg-transparent"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          top: `${(LAYOUT.plotTop / LAYOUT.height) * 100}%`,
                          bottom: 0,
                        }}
                      />
                    );
                  })
                : null}

              {glyphs.map((glyph) => {
                const summary =
                  glyph.extraCount > 0
                    ? `${glyphSummary(glyph.member)} ${glyph.extraCount} more in this cluster.`
                    : glyphSummary(glyph.member);
                const open = openClusterId === glyph.clusterId;
                return (
                  <button
                    key={glyph.id}
                    type="button"
                    aria-expanded={open}
                    aria-label={summary}
                    title={summary}
                    onClick={() => selectGlyph(glyph.clusterId, glyph.member.peakDate)}
                    className="absolute flex -translate-x-1/2 touch-pan-x items-center gap-0.5 rounded-full border bg-slate-950/95 px-1.5 py-0.5 text-base leading-none shadow-md shadow-black/50"
                    style={{
                      left: `${(horizonDayX(glyph.xIndex, count, LAYOUT) / LAYOUT.width) * 100}%`,
                      top: `${(((GLYPH_LANE_TOP[glyph.lane] ?? GLYPH_LANE_TOP[0]) / LAYOUT.height) * 100)}%`,
                      zIndex: 30 - glyph.lane,
                      color: glyph.member.color,
                      borderColor: glyph.member.color,
                    }}
                  >
                    <span aria-hidden>{glyph.member.glyph}</span>
                    {glyph.extraCount > 0 ? (
                      <span className="text-[10px] font-semibold text-slate-100">+{glyph.extraCount}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div
              className="mt-1.5 flex"
              style={{
                paddingLeft: `${(LAYOUT.padX / LAYOUT.width) * 100}%`,
                paddingRight: `${(LAYOUT.padX / LAYOUT.width) * 100}%`,
              }}
            >
              {series.map((day) => {
                const label = new Date(`${day.date}T12:00:00`).toLocaleDateString('en-US', {
                  weekday: 'narrow',
                });
                const dayNum = new Date(`${day.date}T12:00:00`).getDate();
                const active = selectedDate === day.date;
                const isToday = day.date === today;
                const flow = isHorizonFlowWindow(day);
                return (
                  <button
                    key={`lbl-${day.date}`}
                    type="button"
                    aria-pressed={active}
                    aria-label={formatHorizonTooltip(day)}
                    onClick={() => selectDay(day.date)}
                    className="flex min-w-0 flex-1 flex-col items-center leading-none"
                  >
                    <span
                      className={cn(
                        'text-[8px] font-medium uppercase sm:text-[9px]',
                        !day.scored
                          ? 'text-slate-600'
                          : isToday
                            ? 'text-violet-300'
                            : active
                              ? 'text-sky-300'
                              : flow
                                ? 'text-sky-400/80'
                                : 'text-slate-500',
                      )}
                    >
                      {label}
                    </span>
                    <span
                      className={cn(
                        'text-[9px] tabular-nums sm:text-[10px]',
                        !day.scored
                          ? 'text-slate-600'
                          : isToday
                            ? 'font-bold text-violet-200'
                            : active
                              ? 'font-semibold text-sky-200'
                              : 'text-slate-500',
                      )}
                    >
                      {dayNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-2 border-t border-white/5 pt-1.5 text-[10px] leading-relaxed text-slate-500">
          Orange above the line is hard pressure. Blue below is supportive flow.
          {horizonHasUnscored(series) ? ' Grey dashes are not scored yet.' : ''}
        </p>
      </div>

      {openCluster ? (
        <div className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-200">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
            {openCluster.members.length > 1 ? 'Peaks a couple of days apart' : 'Peak'}
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {openCluster.members.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => onSelectDate(member.peakDate)}
                  className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 text-left"
                >
                  <span className="text-base leading-none" style={{ color: member.color }} aria-hidden>
                    {member.glyph}
                  </span>
                  <span className="font-medium text-slate-100">{member.label}</span>
                  <span className="text-slate-400">
                    {member.kind === 'support' ? 'ease' : 'friction load'} {member.intensity}
                    {member.theme ? ` · ${member.theme}` : ''}
                  </span>
                  <span className="text-slate-500">exact {formatDayLabel(member.peakDate)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {selectedDate ? (
        <div className="rounded-lg border border-sky-400/25 bg-sky-950/25 px-3 py-2 text-xs text-slate-200">
          {(() => {
            const day = series.find((entry) => entry.date === selectedDate);
            if (!day) return null;
            const when = formatDayLabel(day.date);
            if (!day.scored) {
              return (
                <>
                  <span className="font-semibold text-slate-300">{when}</span>
                  <span className="text-slate-500"> · Not scored yet</span>
                  <p className="mt-1 text-slate-400">Not calculated past the current window.</p>
                </>
              );
            }
            return (
              <>
                <span className="font-semibold text-sky-100">{when}</span>
                {isHorizonFlowWindow(day) ? (
                  <span className="ml-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-200">
                    Flow window
                  </span>
                ) : null}
                <div className="mt-1.5 space-y-1">
                  <p>
                    <span className="text-slate-500">friction load </span>
                    <span className="font-semibold tabular-nums" style={{ color: FRICTION_COLOR }}>
                      {day.friction}
                    </span>
                    {day.frictionDriver ? (
                      <span className="ml-2 text-slate-300">
                        <TransitAspectLabel label={day.frictionDriver} showGlyphs />
                      </span>
                    ) : null}
                  </p>
                  <p>
                    <span className="text-slate-500">ease </span>
                    <span className="font-semibold tabular-nums" style={{ color: EASE_COLOR }}>
                      {day.ease}
                    </span>
                    {day.easeDriver ? (
                      <span className="ml-2 text-slate-300">
                        <TransitAspectLabel label={day.easeDriver} showGlyphs />
                      </span>
                    ) : null}
                  </p>
                  {day.friction <= 0 && day.ease <= 0 ? (
                    <p className="text-slate-500">No major hard or supportive hits scored this day.</p>
                  ) : null}
                </div>
              </>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}
