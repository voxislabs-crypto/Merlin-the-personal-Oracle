import React from "react";
import { motion } from "framer-motion";
import { AspectLine, PlanetPosition } from "../types/astrology";
import { polarToCartesian } from "../utils/chartCalculations";

interface AspectLinesLayerProps {
  centerX: number;
  centerY: number;
  radius: number;
  aspects: AspectLine[];
  planets: PlanetPosition[];
}

export const AspectLinesLayer: React.FC<AspectLinesLayerProps> = ({
  centerX,
  centerY,
  radius,
  aspects,
  planets,
}) => {
  const getPlanetPosition = (planetName: string) => {
    const planet = planets.find((p) => p.name === planetName);
    if (!planet) return { x: centerX, y: centerY };
    return polarToCartesian(centerX, centerY, radius, planet.angle);
  };

  return (
    <g className="aspect-lines-layer">
      {aspects.map((aspect, index) => {
        const fromPos = getPlanetPosition(aspect.from);
        const toPos = getPlanetPosition(aspect.to);

        return (
          <motion.line
            key={`${aspect.from}-${aspect.to}-${index}`}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke={aspect.color}
            strokeWidth="1"
            opacity="0.7"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 1, delay: index * 0.1 }}
            style={{
              filter: "drop-shadow(0 0 2px currentColor)",
            }}
          />
        );
      })}
    </g>
  );
};
