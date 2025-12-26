import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartData } from "../types/astrology";
import { polarToCartesian } from "../utils/chartCalculations";
import { zodiacSigns } from "../data/chartData";

interface WheelVisualizationProps {
  chartData: ChartData;
  size?: number;
  className?: string;
  onPlanetHover?: (planetName: string | null) => void;
}

export const WheelVisualization: React.FC<WheelVisualizationProps> = React.memo(
  ({ chartData, size = 600, className = "", onPlanetHover }) => {
    const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
    const [lockedPlanet, setLockedPlanet] = useState<string | null>(null);
    const [hoveredAspect, setHoveredAspect] = useState<string | null>(null);

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size * 0.45;
    const zodiacRadius = size * 0.38;
    const houseRadius = size * 0.3;
    const innerRadius = size * 0.15;

    // Add rotation animation state
    const [isRotating] = React.useState(false);

    // Memoized calculations
    const relatedAspects = useMemo(() => {
      const activePlanet = lockedPlanet || hoveredPlanet;
      if (!activePlanet) return [];
      return chartData.aspects.filter(
        (aspect) => aspect.from === activePlanet || aspect.to === activePlanet
      );
    }, [hoveredPlanet, lockedPlanet, chartData.aspects]);

    const handlePlanetHover = useCallback(
      (planetName: string | null) => {
        if (!lockedPlanet) {
          setHoveredPlanet(planetName);
          onPlanetHover?.(planetName);
        }
      },
      [lockedPlanet, onPlanetHover]
    );

    const handlePlanetClick = useCallback((planetName: string) => {
      setLockedPlanet((prev) => (prev === planetName ? null : planetName));
    }, []);

    const isAspectHighlighted = useCallback(
      (aspect: (typeof chartData.aspects)[0]) => {
        const activePlanet = lockedPlanet || hoveredPlanet;
        return activePlanet
          ? aspect.from === activePlanet || aspect.to === activePlanet
          : false;
      },
      [hoveredPlanet, lockedPlanet]
    );

    return (
      <div
        className={`relative ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          <defs>
            <radialGradient id="wheelGradient" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor="hsl(258, 60%, 18%)"
                stopOpacity="0.2"
              />
              <stop
                offset="50%"
                stopColor="hsl(240, 65%, 8%)"
                stopOpacity="0.5"
              />
              <stop
                offset="100%"
                stopColor="hsl(240, 65%, 8%)"
                stopOpacity="0.8"
              />
            </radialGradient>

            <filter id="goldenGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="planetGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle with pulse animation */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill="url(#wheelGradient)"
            stroke="hsl(45, 88%, 68%)"
            strokeWidth="2"
            opacity="0.3"
            animate={{
              strokeOpacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Orbital rings with rotation */}
          {[0.3, 0.5, 0.7, 0.85, 1.0].map((ratio, i) => (
            <motion.circle
              key={`orbit-${i}`}
              cx={centerX}
              cy={centerY}
              r={innerRadius + (houseRadius - innerRadius) * ratio}
              fill="none"
              stroke="hsl(45, 88%, 68%)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              opacity="0.2"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                strokeDashoffset: isRotating ? [0, -100] : 0,
              }}
              transition={{
                pathLength: { duration: 2, delay: i * 0.2 },
                strokeDashoffset: {
                  duration: 20 + i * 5,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
            />
          ))}

          {/* House divisions */}
          {chartData.houses.map((houseAngle, index) => {
            const innerPoint = polarToCartesian(
              centerX,
              centerY,
              innerRadius,
              houseAngle
            );
            const outerPoint = polarToCartesian(
              centerX,
              centerY,
              houseRadius,
              houseAngle
            );
            const labelPoint = polarToCartesian(
              centerX,
              centerY,
              houseRadius * 0.85,
              houseAngle + 15
            );

            return (
              <g key={`house-${index}`}>
                <line
                  x1={innerPoint.x}
                  y1={innerPoint.y}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  stroke="hsl(45, 60%, 50%)"
                  strokeWidth="1"
                  opacity="0.4"
                />
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-display text-sm"
                  fill="hsl(45, 60%, 50%)"
                  opacity="0.6"
                  style={{ userSelect: "none" }}
                >
                  {index + 1}
                </text>
              </g>
            );
          })}

          {/* Zodiac signs with hover effects and tooltips */}
          {zodiacSigns.map((sign) => {
            const angle = sign.startAngle + 15;
            const position = polarToCartesian(
              centerX,
              centerY,
              zodiacRadius,
              angle
            );
            const [isHovered, setIsHovered] = React.useState(false);

            const elementColors = {
              Fire: "hsl(0, 80%, 60%)",
              Earth: "hsl(120, 40%, 50%)",
              Air: "hsl(200, 70%, 60%)",
              Water: "hsl(220, 70%, 65%)",
            };

            return (
              <g key={sign.name}>
                <motion.text
                  x={position.x}
                  y={position.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-display text-3xl cursor-pointer"
                  fill="hsl(45, 88%, 68%)"
                  opacity={isHovered ? 1 : 0.9}
                  animate={{
                    scale: isHovered ? 1.2 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    userSelect: "none",
                    filter: isHovered
                      ? "drop-shadow(0 0 12px hsla(45, 88%, 68%, 1))"
                      : "drop-shadow(0 0 6px hsla(45, 88%, 68%, 0.6))",
                    transformOrigin: "center",
                    transformBox: "fill-box",
                  }}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {sign.glyph}
                </motion.text>

                {/* Zodiac sign tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.g
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <rect
                        x={position.x - 50}
                        y={position.y - 55}
                        width="100"
                        height="40"
                        rx="8"
                        fill="hsl(240, 20%, 12%)"
                        stroke="hsl(45, 88%, 68%)"
                        strokeWidth="2"
                        opacity="0.95"
                        style={{
                          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
                        }}
                      />
                      <text
                        x={position.x}
                        y={position.y - 42}
                        textAnchor="middle"
                        className="font-display text-sm font-bold"
                        fill="hsl(45, 88%, 68%)"
                        style={{ pointerEvents: "none" }}
                      >
                        {sign.name}
                      </text>
                      <text
                        x={position.x}
                        y={position.y - 26}
                        textAnchor="middle"
                        className="font-sans text-xs"
                        fill={elementColors[sign.element]}
                        style={{ pointerEvents: "none" }}
                      >
                        {sign.element} Sign
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>
            );
          })}

          {/* Aspect lines */}
          <g className="aspect-lines">
            {chartData.aspects.map((aspect, index) => {
              const fromPlanet = chartData.planets.find(
                (p) => p.name === aspect.from
              );
              const toPlanet = chartData.planets.find(
                (p) => p.name === aspect.to
              );

              if (!fromPlanet || !toPlanet) return null;

              const fromRadius =
                innerRadius +
                (houseRadius - innerRadius) * fromPlanet.orbitalDistance;
              const toRadius =
                innerRadius +
                (houseRadius - innerRadius) * toPlanet.orbitalDistance;

              const fromPos = polarToCartesian(
                centerX,
                centerY,
                fromRadius,
                fromPlanet.angle
              );
              const toPos = polarToCartesian(
                centerX,
                centerY,
                toRadius,
                toPlanet.angle
              );

              const isHighlighted = isAspectHighlighted(aspect);
              const isHovered = hoveredAspect === `${aspect.from}-${aspect.to}`;

              return (
                <g key={`aspect-${index}`}>
                  <motion.line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke={aspect.color}
                    strokeWidth={isHighlighted || isHovered ? "2" : "1"}
                    opacity={isHighlighted || isHovered ? 0.9 : 0.3}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: isHighlighted || isHovered ? 0.9 : 0.3,
                    }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    style={{
                      filter:
                        isHighlighted || isHovered
                          ? "drop-shadow(0 0 4px currentColor)"
                          : "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={() =>
                      setHoveredAspect(`${aspect.from}-${aspect.to}`)
                    }
                    onMouseLeave={() => setHoveredAspect(null)}
                  />

                  {/* Aspect label on hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.g
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <text
                          x={(fromPos.x + toPos.x) / 2}
                          y={(fromPos.y + toPos.y) / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="font-display text-xs font-semibold"
                          fill={aspect.color}
                          style={{
                            filter: "drop-shadow(0 0 4px rgba(0,0,0,0.8))",
                            pointerEvents: "none",
                          }}
                        >
                          {aspect.label}
                        </text>
                      </motion.g>
                    )}
                  </AnimatePresence>
                </g>
              );
            })}
          </g>

          {/* Planets */}
          {chartData.planets.map((planet) => {
            const radius =
              innerRadius +
              (houseRadius - innerRadius) * planet.orbitalDistance;
            const position = polarToCartesian(
              centerX,
              centerY,
              radius,
              planet.angle
            );
            const isActive =
              planet.name === hoveredPlanet || planet.name === lockedPlanet;
            const isRelated = relatedAspects.some(
              (a) => a.from === planet.name || a.to === planet.name
            );
            const shouldHighlight =
              isActive || (relatedAspects.length > 0 && isRelated);

            return (
              <g
                key={planet.name}
                onMouseEnter={() => handlePlanetHover(planet.name)}
                onMouseLeave={() => handlePlanetHover(null)}
                onClick={() => handlePlanetClick(planet.name)}
                style={{ cursor: "pointer" }}
              >
                <motion.circle
                  cx={position.x}
                  cy={position.y}
                  r={isActive ? 20 : 16}
                  fill="hsl(240, 40%, 15%)"
                  stroke={planet.color}
                  strokeWidth={isActive ? 3 : 2}
                  opacity={shouldHighlight ? 1 : 0.6}
                  animate={{
                    scale: isActive ? 1.2 : 1,
                    opacity: shouldHighlight ? 1 : 0.6,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    filter: isActive ? `url(#goldenGlow)` : "none",
                  }}
                />

                <motion.text
                  x={position.x}
                  y={position.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-display text-xl pointer-events-none"
                  fill={planet.color}
                  animate={{
                    scale: isActive ? 1.2 : 1,
                  }}
                  style={{
                    userSelect: "none",
                    filter: isActive
                      ? "drop-shadow(0 0 6px currentColor)"
                      : "drop-shadow(0 0 2px currentColor)",
                  }}
                >
                  {planet.glyph}
                </motion.text>

                {/* Tooltip */}
                <AnimatePresence>
                  {isActive && (
                    <motion.g
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <rect
                        x={position.x - 60}
                        y={position.y - 60}
                        width="120"
                        height="50"
                        rx="8"
                        fill="hsl(240, 20%, 12%)"
                        stroke={planet.color}
                        strokeWidth="2"
                        opacity="0.95"
                        style={{
                          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
                        }}
                      />
                      <text
                        x={position.x}
                        y={position.y - 45}
                        textAnchor="middle"
                        className="font-display text-sm font-bold"
                        fill={planet.color}
                        style={{ pointerEvents: "none" }}
                      >
                        {planet.name}
                      </text>
                      <text
                        x={position.x}
                        y={position.y - 28}
                        textAnchor="middle"
                        className="font-sans text-xs"
                        fill="hsl(0, 0%, 80%)"
                        style={{ pointerEvents: "none" }}
                      >
                        {planet.sign} {planet.degree}°
                      </text>
                      <text
                        x={position.x}
                        y={position.y - 15}
                        textAnchor="middle"
                        className="font-sans text-xs"
                        fill="hsl(0, 0%, 60%)"
                        style={{ pointerEvents: "none" }}
                      >
                        {planet.element} • {planet.angle}°
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>
            );
          })}

          {/* Center point with pulse */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r="4"
            fill="hsl(45, 88%, 68%)"
            opacity="0.8"
            animate={{
              r: [4, 6, 4],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ filter: "drop-shadow(0 0 4px hsla(45, 88%, 68%, 0.8))" }}
          />
        </svg>
      </div>
    );
  }
);

WheelVisualization.displayName = "WheelVisualization";
