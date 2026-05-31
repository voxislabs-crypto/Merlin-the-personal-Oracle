'use client';

import React, { useMemo } from 'react';
import type { ChartData } from '@/lib/astrology/newWheelTypes';

interface TransitArcMiniProps {
  chartData: ChartData;
}

type ArcPoint = {
  x: number;
  y: number;
  glyph: string;
  name: string;
};

const ARC_PATHS = [
  'M 48 310 C 116 226, 174 168, 412 42',
  'M 62 316 C 126 242, 194 184, 398 58',
  'M 76 322 C 142 258, 216 202, 384 76',
  'M 94 330 C 160 274, 236 220, 366 98',
];

function pointOnArc(t: number, lane: number): { x: number; y: number } {
  const laneOffset = lane * 14;
  const x = 48 + 360 * t + Math.sin((t + lane * 0.07) * Math.PI * 2) * 12;
  const y = 310 - 250 * t + Math.cos((t + lane * 0.11) * Math.PI * 1.2) * 10 + laneOffset;
  return { x, y };
}

export function TransitArcMini({ chartData }: TransitArcMiniProps) {
  const arcPlanets = useMemo<ArcPoint[]>(() => {
    const sorted = [...(chartData.planets || [])]
      .sort((a, b) => a.angle - b.angle)
      .slice(0, 10);

    return sorted.map((planet, idx) => {
      const t = (idx + 1) / (sorted.length + 1);
      const lane = idx % ARC_PATHS.length;
      const p = pointOnArc(t, lane);
      return {
        x: p.x,
        y: p.y,
        glyph: planet.glyph || planet.name?.[0] || 'o',
        name: planet.name,
      };
    });
  }, [chartData.planets]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#05070f]">
      <svg viewBox="0 0 460 360" className="h-full w-full" aria-label="Transit arc display">
        <defs>
          <radialGradient id="arcBg" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#16326a" />
            <stop offset="55%" stopColor="#0a1a3e" />
            <stop offset="100%" stopColor="#04070f" />
          </radialGradient>
          <linearGradient id="goldPath" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#eab308" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#fcd34d" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0.65" />
          </linearGradient>
          <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="planetGlow" x="-120%" y="-120%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="4.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="460" height="360" fill="url(#arcBg)" />

        <g opacity="0.7">
          {Array.from({ length: 32 }).map((_, i) => {
            const x = 20 + ((i * 37) % 420);
            const y = 18 + ((i * 53) % 320);
            const r = i % 3 === 0 ? 1.4 : 0.9;
            return (
              <circle key={`star-${i}`} cx={x} cy={y} r={r} fill="#dbeafe" opacity="0.5">
                <animate
                  attributeName="opacity"
                  values="0.25;0.75;0.25"
                  dur={`${4 + (i % 5)}s`}
                  begin={`${(i % 7) * 0.45}s`}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}
        </g>

        <g filter="url(#arcGlow)">
          {ARC_PATHS.map((d, i) => (
            <path
              key={`arc-${i}`}
              d={d}
              fill="none"
              stroke="url(#goldPath)"
              strokeWidth={i === 0 ? 2.1 : 1.4}
              opacity={0.92 - i * 0.14}
              strokeDasharray="6 10"
            />
          ))}
        </g>

        <g filter="url(#arcGlow)" opacity="0.9">
          {ARC_PATHS.map((d, i) => (
            <path
              key={`arc-overlay-${i}`}
              d={d}
              fill="none"
              stroke="#fde68a"
              strokeWidth={i === 0 ? 0.9 : 0.6}
              opacity={0.5 - i * 0.08}
              strokeDasharray="18 120"
              strokeLinecap="round"
            >
              <animate attributeName="stroke-dashoffset" values="0;-138" dur={`${10 + i * 1.8}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.18;0.58;0.18" dur={`${7 + i}s`} repeatCount="indefinite" />
            </path>
          ))}
        </g>

        <g>
          {arcPlanets.map((planet, i) => (
            <g key={`${planet.name}-${i}`} filter="url(#planetGlow)">
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0 0; 0 ${i % 2 === 0 ? -4 : 4}; 0 0`}
                dur={`${6 + (i % 4)}s`}
                begin={`${i * 0.35}s`}
                repeatCount="indefinite"
              />
              <circle cx={planet.x} cy={planet.y} r={11} fill="#f59e0b" opacity="0.22" />
              <circle cx={planet.x} cy={planet.y} r={6.2} fill="#fde68a" stroke="#fcd34d" strokeWidth="1.2">
                <animate attributeName="r" values="6.2;6.9;6.2" dur={`${4.5 + (i % 3)}s`} begin={`${i * 0.25}s`} repeatCount="indefinite" />
              </circle>
              <text
                x={planet.x}
                y={planet.y + 2.8}
                textAnchor="middle"
                fontSize="8.5"
                fill="#1f2937"
                fontWeight="700"
              >
                {planet.glyph}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div className="pointer-events-none absolute left-4 top-3 text-[10px] uppercase tracking-[0.18em] text-amber-200/85">
        Current Transit Timeline
      </div>
    </div>
  );
}
