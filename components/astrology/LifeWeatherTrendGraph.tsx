'use client';

import React, { useMemo, useState } from 'react';

type TrendMetricKey =
  | 'cafeIndex'
  | 'cognitiveClarity'
  | 'emotionalPressure'
  | 'recoveryCapacity'
  | 'opportunityWindow';

export interface LifeWeatherTrendPoint {
  label: string;
  timestamp: string;
  cafeIndex: number;
  cognitiveClarity: number;
  emotionalPressure: number;
  recoveryCapacity: number;
  opportunityWindow: number;
}

interface LifeWeatherTrendGraphProps {
  points: LifeWeatherTrendPoint[];
  title?: string;
}

const METRICS: Array<{ key: TrendMetricKey; label: string; color: string }> = [
  { key: 'cafeIndex', label: 'CAFE index', color: '#a78bfa' },
  { key: 'cognitiveClarity', label: 'Clarity', color: '#22d3ee' },
  { key: 'emotionalPressure', label: 'Pressure', color: '#fb7185' },
  { key: 'recoveryCapacity', label: 'Recovery', color: '#34d399' },
  { key: 'opportunityWindow', label: 'Opportunity', color: '#fbbf24' },
];

const DEFAULT_VISIBLE: TrendMetricKey[] = ['cafeIndex', 'cognitiveClarity', 'emotionalPressure'];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

export function LifeWeatherTrendGraph({
  points,
  title = 'Life Weather trend graph',
}: LifeWeatherTrendGraphProps) {
  const [visibleMetrics, setVisibleMetrics] = useState<Set<TrendMetricKey>>(() => new Set(DEFAULT_VISIBLE));

  const safePoints = useMemo(() => points.map((point) => ({
    ...point,
    cafeIndex: clamp(point.cafeIndex),
    cognitiveClarity: clamp(point.cognitiveClarity),
    emotionalPressure: clamp(point.emotionalPressure),
    recoveryCapacity: clamp(point.recoveryCapacity),
    opportunityWindow: clamp(point.opportunityWindow),
  })), [points]);

  const graph = useMemo(() => {
    const width = 1000;
    const height = 340;
    const padX = 56;
    const padY = 26;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const count = Math.max(1, safePoints.length - 1);

    const xAt = (idx: number) => padX + (idx / count) * innerW;
    const yAt = (value: number) => padY + (1 - value / 100) * innerH;

    const pressureArea = safePoints
      .map((point, idx) => `${xAt(idx)},${yAt(point.emotionalPressure)}`)
      .join(' ');

    const pressureBase = `${xAt(safePoints.length - 1)},${yAt(0)} ${xAt(0)},${yAt(0)}`;

    const toPath = (metric: TrendMetricKey) =>
      safePoints
        .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${xAt(idx)} ${yAt(point[metric])}`)
        .join(' ');

    return {
      width,
      height,
      xAt,
      yAt,
      pressureArea,
      pressureBase,
      toPath,
    };
  }, [safePoints]);

  if (safePoints.length < 2) {
    return (
      <div className="rounded-2xl border border-zinc-700 bg-zinc-950/70 p-5 text-sm text-zinc-300">
        Trend graph will appear after more forecast runs are collected.
      </div>
    );
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-zinc-900/70 p-6 md:p-8">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Signal trajectories</p>
          <h3 className="mt-1 text-2xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-zinc-400">Observed changes from your recent forecast snapshots.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {METRICS.map((metric) => {
            const active = visibleMetrics.has(metric.key);
            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => {
                  setVisibleMetrics((current) => {
                    const next = new Set(current);
                    if (next.has(metric.key)) {
                      next.delete(metric.key);
                    } else {
                      next.add(metric.key);
                    }

                    // Keep at least one metric visible.
                    if (next.size === 0) {
                      next.add(metric.key);
                    }
                    return next;
                  });
                }}
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] transition ${active ? 'text-zinc-100' : 'text-zinc-500 border-zinc-700 hover:text-zinc-300'}`}
                style={active ? { borderColor: `${metric.color}66`, backgroundColor: `${metric.color}1a` } : undefined}
              >
                {metric.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-700 bg-gradient-to-b from-zinc-950 to-zinc-900 p-2">
        <svg viewBox={`0 0 ${graph.width} ${graph.height}`} className="h-[340px] w-full">
          <defs>
            <linearGradient id="lw-pressure-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={56}
                x2={graph.width - 56}
                y1={graph.yAt(tick)}
                y2={graph.yAt(tick)}
                stroke="#3f3f46"
                strokeOpacity="0.45"
              />
              <text x={24} y={graph.yAt(tick) + 4} fill="#71717a" fontSize="11">
                {tick}
              </text>
            </g>
          ))}

          <polygon
            points={`${graph.pressureArea} ${graph.pressureBase}`}
            fill="url(#lw-pressure-gradient)"
          />

          {METRICS.filter((metric) => visibleMetrics.has(metric.key)).map((metric) => (
            <path
              key={metric.key}
              d={graph.toPath(metric.key)}
              fill="none"
              stroke={metric.color}
              strokeWidth={metric.key === 'cafeIndex' ? 3.2 : 2.3}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 8px ${metric.color}66)` }}
            />
          ))}

          {safePoints.map((point, idx) => (
            <g key={`${point.timestamp}-${idx}`}>
              {METRICS.filter((metric) => visibleMetrics.has(metric.key)).map((metric) => (
                <circle
                  key={metric.key}
                  cx={graph.xAt(idx)}
                  cy={graph.yAt(point[metric.key])}
                  r={2.8}
                  fill={metric.color}
                >
                  <title>{`${point.label} · ${metric.label}: ${Math.round(point[metric.key])}`}</title>
                </circle>
              ))}
              <text
                x={graph.xAt(idx)}
                y={graph.height - 10}
                fill="#71717a"
                fontSize="11"
                textAnchor="middle"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
