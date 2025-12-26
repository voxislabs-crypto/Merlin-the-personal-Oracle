import React, { useState } from "react";
import { PlanetPosition } from "../types/astrology";
import { polarToCartesian } from "../utils/chartCalculations";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlanetLayerProps {
  centerX: number;
  centerY: number;
  radius: number;
  planets: PlanetPosition[];
}

export const PlanetLayer: React.FC<PlanetLayerProps> = ({
  centerX,
  centerY,
  radius,
  planets,
}) => {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  return (
    <TooltipProvider delayDuration={200}>
      <g className="planet-layer">
        {planets.map((planet) => {
          const position = polarToCartesian(
            centerX,
            centerY,
            radius,
            planet.angle
          );
          const isHovered = hoveredPlanet === planet.name;

          return (
            <Tooltip key={planet.name}>
              <TooltipTrigger asChild>
                <g
                  onMouseEnter={() => setHoveredPlanet(planet.name)}
                  onMouseLeave={() => setHoveredPlanet(null)}
                  className="cursor-pointer transition-transform duration-300"
                  style={{
                    transform: isHovered ? "scale(1.2)" : "scale(1)",
                    transformOrigin: `${position.x}px ${position.y}px`,
                  }}
                >
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r="16"
                    fill="hsl(240, 40%, 15%)"
                    stroke="hsl(45, 88%, 68%)"
                    strokeWidth="1.5"
                    opacity={isHovered ? "1" : "0.9"}
                    style={{
                      filter: isHovered
                        ? "drop-shadow(0 0 8px hsla(45, 88%, 68%, 0.6))"
                        : "none",
                    }}
                  />
                  <text
                    x={position.x}
                    y={position.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-display text-lg md:text-xl pointer-events-none"
                    style={{
                      userSelect: "none",
                      fill: "hsl(45, 88%, 68%)",
                      filter: "drop-shadow(0 0 4px hsla(45, 88%, 68%, 0.5))",
                    }}
                  >
                    {planet.glyph}
                  </text>
                </g>
              </TooltipTrigger>
              <TooltipContent className="bg-card text-card-foreground border-cosmic-gold">
                <div className="space-y-1">
                  <p className="font-display font-semibold text-cosmic-gold">
                    {planet.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {planet.sign} {planet.degree}°
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Position: {planet.angle}°
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </g>
    </TooltipProvider>
  );
};
