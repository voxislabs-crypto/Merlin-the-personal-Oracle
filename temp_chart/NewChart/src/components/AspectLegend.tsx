import React from "react";
import { motion } from "framer-motion";

export const AspectLegend: React.FC = () => {
  const aspects = [
    {
      name: "Conjunction",
      color: "hsl(45, 100%, 70%)",
      angle: "0°",
      description: "Unity & Blending",
    },
    {
      name: "Opposition",
      color: "hsl(320, 80%, 65%)",
      angle: "180°",
      description: "Tension & Balance",
    },
    {
      name: "Trine",
      color: "hsl(185, 70%, 65%)",
      angle: "120°",
      description: "Harmony & Flow",
    },
    {
      name: "Square",
      color: "hsl(0, 62%, 50%)",
      angle: "90°",
      description: "Challenge & Growth",
    },
    {
      name: "Sextile",
      color: "hsl(45, 88%, 68%)",
      angle: "60°",
      description: "Opportunity & Support",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.9 }}
      className="bg-card/50 backdrop-blur-sm border border-cosmic-gold/30 rounded-lg p-6 max-w-2xl mx-auto"
    >
      <h3 className="font-display font-semibold text-cosmic-gold mb-4 text-center">
        Aspect Legend
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {aspects.map((aspect) => (
          <motion.div
            key={aspect.name}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center text-center space-y-2 p-3 rounded-lg hover:bg-cosmic-gold/5 transition-colors"
          >
            <div
              className="w-12 h-1 rounded-full"
              style={{
                backgroundColor: aspect.color,
                boxShadow: `0 0 8px ${aspect.color}`,
              }}
            />
            <div>
              <p
                className="font-display font-semibold text-sm"
                style={{ color: aspect.color }}
              >
                {aspect.name}
              </p>
              <p className="text-xs text-gray-400">{aspect.angle}</p>
              <p className="text-xs text-gray-500 mt-1">{aspect.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
