import React from "react";
import { motion } from "framer-motion";
import { ChartData } from "../types/astrology";
import { ZodiacRing } from "./ZodiacRing";
import { PlanetLayer } from "./PlanetLayer";
import { AspectLinesLayer } from "./AspectLinesLayer";
import { LabelsLayer } from "./LabelsLayer";

interface ChartSVGProps {
  chartData: ChartData;
  size: number;
}

export const ChartSVG: React.FC<ChartSVGProps> = ({ chartData, size }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.45;
  const zodiacOuterRadius = size * 0.4;
  const zodiacInnerRadius = size * 0.32;
  const planetRadius = size * 0.28;
  const innerRadius = size * 0.2;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 12, ease: "linear", repeat: 0 }}
    >
      <defs>
        <radialGradient id="chartGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(258, 60%, 18%)" stopOpacity="0.3" />
          <stop offset="50%" stopColor="hsl(240, 65%, 8%)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(240, 65%, 8%)" stopOpacity="0.9" />
        </radialGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer circle */}
      <circle
        cx={centerX}
        cy={centerY}
        r={outerRadius}
        fill="none"
        stroke="hsl(45, 88%, 68%)"
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Zodiac ring outer boundary */}
      <circle
        cx={centerX}
        cy={centerY}
        r={zodiacOuterRadius}
        fill="none"
        stroke="hsl(45, 88%, 68%)"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Zodiac ring inner boundary (main circle) */}
      <circle
        cx={centerX}
        cy={centerY}
        r={zodiacInnerRadius}
        fill="url(#chartGradient)"
        stroke="hsl(45, 88%, 68%)"
        strokeWidth="2"
        opacity="0.8"
      />

      {/* Inner planet circle */}
      <circle
        cx={centerX}
        cy={centerY}
        r={innerRadius}
        fill="none"
        stroke="hsl(240, 30%, 30%)"
        strokeWidth="1"
        opacity="0.4"
      />

      <AspectLinesLayer
        centerX={centerX}
        centerY={centerY}
        radius={innerRadius * 0.85}
        aspects={chartData.aspects}
        planets={chartData.planets}
      />

      <ZodiacRing
        centerX={centerX}
        centerY={centerY}
        innerRadius={zodiacInnerRadius}
        outerRadius={zodiacOuterRadius}
      />

      <PlanetLayer
        centerX={centerX}
        centerY={centerY}
        radius={planetRadius}
        planets={chartData.planets}
      />

      <LabelsLayer
        centerX={centerX}
        centerY={centerY}
        radius={outerRadius}
        ascendant={chartData.ascendant}
        midheaven={chartData.midheaven}
      />
    </motion.svg>
  );
};
