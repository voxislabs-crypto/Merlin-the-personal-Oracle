import React from "react";
import { polarToCartesian } from "../utils/chartCalculations";

interface LabelsLayerProps {
  centerX: number;
  centerY: number;
  radius: number;
  ascendant: number;
  midheaven: number;
}

export const LabelsLayer: React.FC<LabelsLayerProps> = ({
  centerX,
  centerY,
  radius,
  ascendant,
  midheaven,
}) => {
  const ascPos = polarToCartesian(centerX, centerY, radius + 40, ascendant);
  const mcPos = polarToCartesian(centerX, centerY, radius + 40, midheaven);

  return (
    <g className="labels-layer">
      <text
        x={ascPos.x}
        y={ascPos.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-display text-xs md:text-sm font-semibold"
        style={{
          userSelect: "none",
          fill: "hsl(185, 70%, 65%)",
          filter: "drop-shadow(0 0 4px hsla(185, 70%, 65%, 0.6))",
        }}
      >
        Ascendant
      </text>

      <text
        x={mcPos.x}
        y={mcPos.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-display text-xs md:text-sm font-semibold"
        style={{
          userSelect: "none",
          fill: "hsl(185, 70%, 65%)",
          filter: "drop-shadow(0 0 4px hsla(185, 70%, 65%, 0.6))",
        }}
      >
        MC
      </text>

      {[0, 90, 180, 270].map((angle) => {
        const pos = polarToCartesian(centerX, centerY, radius - 10, angle);
        return (
          <circle
            key={`marker-${angle}`}
            cx={pos.x}
            cy={pos.y}
            r="2"
            fill="hsl(45, 88%, 68%)"
            opacity="0.6"
          />
        );
      })}
    </g>
  );
};
