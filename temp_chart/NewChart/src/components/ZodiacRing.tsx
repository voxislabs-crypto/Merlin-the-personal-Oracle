import React from "react";
import { zodiacSigns } from "../data/chartData";
import { polarToCartesian } from "../utils/chartCalculations";

interface ZodiacRingProps {
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
}

export const ZodiacRing: React.FC<ZodiacRingProps> = ({
  centerX,
  centerY,
  innerRadius,
  outerRadius,
}) => {
  const glyphRadius = (innerRadius + outerRadius) / 2;

  return (
    <g className="zodiac-ring">
      {/* Zodiac glyphs positioned between inner and outer circles */}
      {zodiacSigns.map((sign) => {
        const angle = sign.startAngle + 15;
        const position = polarToCartesian(centerX, centerY, glyphRadius, angle);

        return (
          <g key={sign.name}>
            {/* Glow effect */}
            <text
              x={position.x}
              y={position.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-display text-3xl md:text-4xl"
              style={{
                userSelect: "none",
                fill: "hsl(45, 88%, 68%)",
                filter:
                  "drop-shadow(0 0 8px hsla(45, 88%, 68%, 0.8)) drop-shadow(0 0 12px hsla(45, 88%, 68%, 0.6))",
                opacity: 0.95,
              }}
            >
              {sign.glyph}
            </text>
          </g>
        );
      })}

      {/* House division lines - thin radial lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const startAngle = i * 30;
        const innerStart = polarToCartesian(
          centerX,
          centerY,
          innerRadius,
          startAngle
        );
        const outerEnd = polarToCartesian(
          centerX,
          centerY,
          outerRadius,
          startAngle
        );

        return (
          <line
            key={`house-divider-${i}`}
            x1={innerStart.x}
            y1={innerStart.y}
            x2={outerEnd.x}
            y2={outerEnd.y}
            stroke="hsl(45, 60%, 50%)"
            strokeWidth="0.5"
            opacity="0.4"
          />
        );
      })}

      {/* House numbers at specific positions */}
      {[10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((houseNum, index) => {
        const angle = index * 30 + 15;
        const numberRadius = innerRadius * 0.85;
        const position = polarToCartesian(
          centerX,
          centerY,
          numberRadius,
          angle
        );

        // Only show select house numbers like in the reference
        if (![10, 12].includes(houseNum)) return null;

        return (
          <text
            key={`house-${houseNum}`}
            x={position.x}
            y={position.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-display text-sm md:text-base"
            style={{
              userSelect: "none",
              fill: "hsl(45, 60%, 50%)",
              opacity: 0.6,
            }}
          >
            {houseNum}
          </text>
        );
      })}
    </g>
  );
};
