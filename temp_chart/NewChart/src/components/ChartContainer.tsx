import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartData } from "../types/astrology";
import { WheelVisualization } from "./WheelVisualization";
import { BackgroundStars } from "./BackgroundStars";
import { AspectLegend } from "./AspectLegend";
import { PlanetList } from "./PlanetList";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { exportChartData, getChartDataJSON, logChartData } from "../utils/exportData";

interface ChartContainerProps {
  chartData: ChartData;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  chartData,
}) => {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [chartSize, setChartSize] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
      ? 350
      : window.innerWidth < 1024
      ? 550
      : 650
  );

  React.useEffect(() => {
    const handleResize = () => {
      setChartSize(
        window.innerWidth < 768 ? 350 : window.innerWidth < 1024 ? 550 : 650
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center py-16 md:py-24 px-4 md:px-8 overflow-hidden">
      <BackgroundStars />
      <KeyboardShortcuts />

      <div className="relative z-10 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-cosmic-gold mb-4">
            Interactive Astrology Wheel
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-4">
            A fully interactive celestial visualization with hover effects,
            aspect highlighting, and detailed planetary information.
          </p>
          <div className="h-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {hoveredPlanet && (
                <motion.p
                  key={hoveredPlanet}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-cosmic-cyan absolute"
                >
                  Currently viewing:{" "}
                  <span className="font-semibold">{hoveredPlanet}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex justify-center items-center"
        >
          <div className="relative">
            <WheelVisualization
              chartData={chartData}
              size={chartSize}
              onPlanetHover={setHoveredPlanet}
              className="mx-auto"
            />

            {/* Floating info button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowInfo(!showInfo)}
              className="absolute top-4 right-4 bg-cosmic-gold/20 backdrop-blur-sm border border-cosmic-gold/50 rounded-full p-3 hover:bg-cosmic-gold/30 transition-colors"
              title="Chart Information"
            >
              <svg
                className="w-5 h-5 text-cosmic-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.button>

            {/* Info panel */}
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-16 right-4 bg-card/95 backdrop-blur-md border border-cosmic-gold/30 rounded-lg p-4 w-64 shadow-xl"
                >
                  <h3 className="font-display font-semibold text-cosmic-gold mb-3">
                    Chart Details
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Planets:</span>
                      <span className="text-cosmic-cyan">
                        {chartData.planets.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aspects:</span>
                      <span className="text-cosmic-cyan">
                        {chartData.aspects.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Houses:</span>
                      <span className="text-cosmic-cyan">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ascendant:</span>
                      <span className="text-cosmic-cyan">
                        {chartData.ascendant}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Midheaven:</span>
                      <span className="text-cosmic-cyan">
                        {chartData.midheaven}°
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-12 md:mt-16 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-cosmic-gold/30 rounded-lg p-4">
              <h3 className="font-display font-semibold text-cosmic-gold mb-2">
                Hover
              </h3>
              <p className="text-sm text-gray-400">
                Hover over planets to see details and related aspects
              </p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-cosmic-gold/30 rounded-lg p-4">
              <h3 className="font-display font-semibold text-cosmic-gold mb-2">
                Click
              </h3>
              <p className="text-sm text-gray-400">
                Click planets to lock the view and explore connections
              </p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-cosmic-gold/30 rounded-lg p-4">
              <h3 className="font-display font-semibold text-cosmic-gold mb-2">
                Aspects
              </h3>
              <p className="text-sm text-gray-400">
                Hover aspect lines to see their type and relationship
              </p>
            </div>
          </div>

          <div className="mt-12 space-y-8">
            <AspectLegend />
            <PlanetList
              planets={chartData.planets}
              onPlanetClick={setHoveredPlanet}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px hsla(45, 88%, 68%, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                exportChartData();
                logChartData();
              }}
              className="bg-gradient-cta text-primary font-semibold px-8 py-3 rounded-lg font-display transition-all duration-300 shadow-lg"
            >
              Export Chart JSON
            </motion.button>

            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px hsla(45, 88%, 68%, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigator.clipboard.writeText(getChartDataJSON());
                alert('Chart JSON copied to clipboard!');
              }}
              className="bg-transparent text-cosmic-gold border-2 border-cosmic-gold font-semibold px-8 py-3 rounded-lg font-display transition-all duration-300 hover:bg-cosmic-gold hover:bg-opacity-10"
            >
              Copy JSON
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-transparent text-cosmic-cyan border-2 border-cosmic-cyan font-semibold px-8 py-3 rounded-lg font-display transition-all duration-300 hover:bg-cosmic-cyan hover:bg-opacity-10"
            >
              Share Chart
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
