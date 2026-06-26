"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { PLANET_GLYPHS } from "@/lib/astrology/planetaryData";
import { PLANET_TOOLTIPS } from "@/lib/astrology/BirthChartTooltips";

interface WheelProps {
  chart: any; // Your raw data format
  hoveredPlanet?: string | null;
}

export function GoldenWheel({ chart, hoveredPlanet }: WheelProps) {
  const width = 800;
  const height = 800;
  const radius = 360;
  const centerX = width / 2;
  const centerY = height / 2;

  const getXY = (deg: number, r = radius) => ({
    x: centerX + r * Math.sin((deg * Math.PI) / 180),
    y: centerY - r * Math.cos((deg * Math.PI) / 180),
  });

  return (
    <div className="flex justify-center my-16">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="drop-shadow-2xl"
      >
        {/* Exact book cover background */}
        <defs>
          <radialGradient id="bookBg" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="#0a1428" />
            <stop offset="50%" stopColor="#0f1e3a" />
            <stop offset="100%" stopColor="#020817" />
          </radialGradient>

          {/* Subtle star field */}
          <pattern
            id="stars"
            x="0"
            y="0"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="30" cy="50" r="1" fill="#e2e8f0" opacity="0.4" />
            <circle cx="100" cy="150" r="1.5" fill="#e2e8f0" opacity="0.6" />
            <circle cx="170" cy="80" r="1" fill="#e2e8f0" opacity="0.3" />
            <circle cx="60" cy="170" r="2" fill="#e2e8f0" opacity="0.5" />
            <circle cx="140" cy="30" r="1.2" fill="#e2e8f0" opacity="0.4" />
            <circle cx="80" cy="110" r="1" fill="#e2e8f0" opacity="0.3" />
          </pattern>

          {/* Golden glow */}
          <filter id="goldenGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#fcd34d" floodOpacity="0.8" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={width} height={height} fill="url(#bookBg)" />
        <rect width={width} height={height} fill="url(#stars)" opacity="0.25" />

        {/* 6 golden orbital rings */}
        {[1, 0.92, 0.84, 0.76, 0.68, 0.6].map((scale, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={radius * scale}
            fill="none"
            stroke="#fcd34d"
            strokeWidth={i === 0 ? 3 : 1}
            opacity={i === 0 ? 1 : 0.5}
          />
        ))}

        {/* Central radiant sunburst */}
        <g>
          <circle cx={centerX} cy={centerY} r="60" fill="#fcd34d" opacity="0.9">
            <animate
              attributeName="r"
              values="60;65;60"
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={centerX}
            cy={centerY}
            r="45"
            fill="#fbbf24"
            opacity="0.8"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r="30"
            fill="#f59e0b"
            opacity="0.9"
          />
          <circle cx={centerX} cy={centerY} r="15" fill="#d97706" opacity="1" />
        </g>
      </svg>
    </div>
  );
}
