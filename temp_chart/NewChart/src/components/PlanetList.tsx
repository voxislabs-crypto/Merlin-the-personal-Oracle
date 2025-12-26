import React from "react";
import { motion } from "framer-motion";
import { PlanetPosition } from "../types/astrology";

interface PlanetListProps {
  planets: PlanetPosition[];
  onPlanetClick?: (planetName: string) => void;
}

export const PlanetList: React.FC<PlanetListProps> = ({
  planets,
  onPlanetClick,
}) => {
  const elementColors = {
    Fire: "hsl(0, 80%, 60%)",
    Earth: "hsl(120, 40%, 50%)",
    Air: "hsl(200, 70%, 60%)",
    Water: "hsl(220, 70%, 65%)",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.2 }}
      className="bg-card/50 backdrop-blur-sm border border-cosmic-gold/30 rounded-lg p-6 max-w-4xl mx-auto"
    >
      <h3 className="font-display font-semibold text-cosmic-gold mb-4 text-center">
        Planetary Positions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {planets.map((planet, index) => (
          <motion.button
            key={planet.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 + index * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPlanetClick?.(planet.name)}
            className="flex flex-col items-center p-3 rounded-lg border border-cosmic-gold/20 hover:border-cosmic-gold/50 hover:bg-cosmic-gold/5 transition-all"
          >
            <span
              className="text-3xl mb-2"
              style={{
                color: planet.color,
                filter: "drop-shadow(0 0 4px currentColor)",
              }}
            >
              {planet.glyph}
            </span>
            <span className="font-display text-sm font-semibold text-gray-200">
              {planet.name}
            </span>
            <span className="text-xs text-gray-400">
              {planet.sign} {planet.degree}°
            </span>
            <span
              className="text-xs mt-1 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${elementColors[planet.element]}20`,
                color: elementColors[planet.element],
              }}
            >
              {planet.element}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
