'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface WheelProps {
  chartData: any;
}

export function WheelVisualization({ chartData }: WheelProps) {
  const size = 800;
  const center = size / 2;
  const radius = size * 0.45;

  const getXY = (deg: number, r = radius) => ({
    x: center + r * Math.sin((deg * Math.PI) / 180),
    y: center - r * Math.cos((deg * Math.PI) / 180),
  });

  if (!chartData) return null;

  const planets = chartData.planets || [];
  const houses = chartData.houses || [];

  return (
    <div className="flex justify-center py-12 bg-black">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Navy starfield background */}
        <defs>
          <radialGradient id="navyBg">
            <stop offset="0%" stopColor="#0a1428" />
            <stop offset="100%" stopColor="#020817" />
          </radialGradient>
          <pattern id="stars" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="#ffffff" opacity="0.3" />
            <circle cx="70" cy="40" r="1.5" fill="#ffffff" opacity="0.4" />
            <circle cx="40" cy="80" r="1" fill="#ffffff" opacity="0.2" />
          </pattern>
        </defs>

        <rect width={size} height={size} fill="url(#navyBg)" />
        <rect width={size} height={size} fill="url(#stars)" opacity="0.4" />

        {/* Golden concentric rings */}
        {[1, 0.9, 0.8, 0.7, 0.6, 0.5].map((scale, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke="#d4af37"
            strokeWidth={i === 0 ? 4 : 2}
            opacity={i === 0 ? 1 : 0.6}
          />
        ))}

        {/* Central golden starburst */}
        <g>
          <circle cx={center} cy={center} r="50" fill="#d4af37" opacity="0.9" />
          <circle cx={center} cy={center} r="35" fill="#f1c40f" opacity="0.8" />
          <circle cx={center} cy={center} r="20" fill="#e67e22" opacity="1" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            const inner = getXY(angle, 50);
            const outer = getXY(angle, 80);
            return (
              <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#d4af37" strokeWidth="3" />
            );
          })}
        </g>

        {/* Subtle constellation lines (example connections) */}
        <path d="M 300 200 L 500 300 L 400 500 L 200 400 Z" fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.3" />

        {/* Planets on orbits */}
        {planets.map((p: any, i: number) => {
          const orbitR = radius * (0.5 + i * 0.05);
          const { x, y } = getXY(p.angle, orbitR);
          return (
            <g key={p.name}>
              <circle cx={x} cy={y} r="12" fill="#d4af37" />
              <text x={x} y={y + 5} textAnchor="middle" fill="#ffffff" fontSize="14">
                {p.glyph}
              </text>
            </g>
          );
        })}

        {/* Zodiac symbols outer */}
        {['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((glyph, i) => {
          const angle = i * 30;
          const { x, y } = getXY(angle, radius * 1.05);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" fill="#d4af37" fontSize="32">
              {glyph}
            </text>
          );
        })}
      </svg>
    </div>
  );
}