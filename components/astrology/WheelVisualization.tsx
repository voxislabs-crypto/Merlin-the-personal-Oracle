// components/astrology/WheelVisualization.tsx
"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  polarToCartesian,
  describeArc,
  getAspectColor,
} from "@/lib/astrology/chartCalculations";
import type { ChartData } from "@/lib/astrology/newWheelTypes";

interface WheelVisualizationProps {
  chartData: ChartData;
  size?: number;
  className?: string;
}

export const WheelVisualization: React.FC<WheelVisualizationProps> = ({
  chartData,
  size = 800,
  className = "",
}) => {
  // Return early if no chart data
  if (!chartData) {
    return (
      <div className={`relative ${className}`}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-auto"
        >
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            fill="white"
            fontSize="16"
          >
            Loading chart data...
          </text>
        </svg>
      </div>
    );
  }

  const center = size / 2;
  const outerRadius = size * 0.45;
  const zodiacRadius = size * 0.38;
  const houseRadius = size * 0.3;
  const innerRadius = size * 0.15;

  // Memoize calculations with fallbacks
  const planets = chartData.planets || [];
  const aspects = chartData.aspects || [];
  const houses = chartData.houses || [];

  // Generate planet positions
  const planetElements = useMemo(() => {
    return planets.map((planet) => {
      const angle = typeof planet.angle === "number" ? planet.angle : 0;
      const { x, y } = polarToCartesian(
        center,
        center,
        outerRadius * 0.7,
        angle
      );
      return (
        <motion.g
          key={`planet-${planet.name}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <circle
            cx={x}
            cy={y}
            r={12}
            fill={planet.color}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={1}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
          <text
            x={x}
            y={y + 5}
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
            className="pointer-events-none"
          >
            {planet.glyph}
          </text>
        </motion.g>
      );
    });
  }, [planets, center, outerRadius]);

  // Generate aspect lines
  const aspectLines = useMemo(() => {
    return aspects.map((aspect, i) => {
      const fromPlanet = planets.find((p) => p.name === aspect.from);
      const toPlanet = planets.find((p) => p.name === aspect.to);

      if (!fromPlanet || !toPlanet) return null;

      const fromAngle =
        typeof fromPlanet.angle === "number" ? fromPlanet.angle : 0;
      const toAngle = typeof toPlanet.angle === "number" ? toPlanet.angle : 0;

      const from = polarToCartesian(
        center,
        center,
        outerRadius * 0.7,
        fromAngle
      );
      const to = polarToCartesian(center, center, outerRadius * 0.7, toAngle);

      return (
        <motion.path
          key={`aspect-${i}`}
          d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
          stroke={aspect.color || getAspectColor(aspect.type)}
          strokeWidth={1.5}
          strokeDasharray={aspect.type === "sextile" ? "5,5" : "none"}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="pointer-events-none"
        />
      );
    });
  }, [aspects, planets, center, outerRadius]);

  // Generate zodiac signs
  const zodiacSigns = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = i * 30 - 15; // Offset by 15 degrees to center the glyph
      const { x, y } = polarToCartesian(center, center, zodiacRadius, angle);
      const sign = [
        { glyph: "♈", element: "Fire" }, // Aries
        { glyph: "♉", element: "Earth" }, // Taurus
        { glyph: "♊", element: "Air" }, // Gemini
        { glyph: "♋", element: "Water" }, // Cancer
        { glyph: "♌", element: "Fire" }, // Leo
        { glyph: "♍", element: "Earth" }, // Virgo
        { glyph: "♎", element: "Air" }, // Libra
        { glyph: "♏", element: "Water" }, // Scorpio
        { glyph: "♐", element: "Fire" }, // Sagittarius
        { glyph: "♑", element: "Earth" }, // Capricorn
        { glyph: "♒", element: "Air" }, // Aquarius
        { glyph: "♓", element: "Water" }, // Pisces
      ][i];

      return (
        <motion.g
          key={`sign-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.05 }}
        >
          <text
            x={x}
            y={y}
            textAnchor="middle"
            fill="white"
            fontSize="24"
            className="pointer-events-none"
          >
            {sign.glyph}
          </text>
        </motion.g>
      );
    });
  }, [center, zodiacRadius]);

  // Generate house lines
  const houseLines = useMemo(() => {
    return houses.map((angle, i) => {
      const safeAngle = typeof angle === "number" ? angle : i * 30;
      const start = polarToCartesian(center, center, innerRadius, safeAngle);
      const end = polarToCartesian(center, center, outerRadius, safeAngle);

      return (
        <line
          key={`house-${i}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={1}
        />
      );
    });
  }, [houses, center, innerRadius, outerRadius]);

  return (
    <div className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto"
      >
        {/* Outer circle */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={1}
        />

        {/* Zodiac ring */}
        <circle
          cx={center}
          cy={center}
          r={zodiacRadius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={2}
        />

        {/* House lines */}
        {houseLines}

        {/* Zodiac signs */}
        {zodiacSigns}

        {/* Aspect lines */}
        {aspectLines}

        {/* Planets */}
        {planetElements}

        {/* Inner circle */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="rgba(0, 0, 0, 0.3)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={1}
        />

        {/* Ascendant line */}
        <line
          x1={center}
          y1={center - innerRadius}
          x2={center}
          y2={center - outerRadius}
          stroke="hsl(45, 100%, 60%)"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
        <text
          x={center + 10}
          y={center - outerRadius + 15}
          fill="hsl(45, 100%, 60%)"
          fontSize="12"
          fontWeight="bold"
        >
          ASC
        </text>
      </svg>
    </div>
  );
};

export default WheelVisualization;
