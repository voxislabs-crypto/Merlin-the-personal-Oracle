// app/page.tsx (partial update)
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { transformChartData } from "@/lib/astrology/transform";
import { getAspectColor } from "@/lib/astrology/chartCalculations";

// Import WheelVisualization with SSR disabled
const WheelVisualization = dynamic(
  () => import("@/components/astrology/WheelVisualization").then(mod => ({ default: mod.WheelVisualization })),
  { ssr: false }
);

export default function Home() {
  const [chart, setChart] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calculate-birth-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: "1983-08-14",
          birthTime: "12:21",
          lat: 36.85,
          lon: -76.29,
        }),
      });
      const data = await res.json();
      console.log("API Response:", data);
      console.log(
        "Raw API data structure:",
        JSON.stringify(data.data, null, 2)
      );
      if (data.success) {
        const transformed = transformChartData(data.data);
        console.log("Transformed chart data:", transformed);
        setChart(transformed);
      } else {
        console.error("API Error:", data.error);
        setError(data.error || "Failed to calculate chart");
      }
    } catch (error) {
      console.error("Error calculating chart:", error);
      setError("An error occurred while calculating the chart");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            The Oracle
          </h1>
          <p className="text-gray-400 mb-6">Your personal astrological guide</p>

          <button
            onClick={calculate}
            disabled={loading}
            className={`px-6 py-3 rounded-full font-medium ${
              loading
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-900/30"
            }`}
          >
            {loading ? "Calculating..." : "Enter the Oracle"}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {chart && chart.planets && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-800/50">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-2/3">
                <WheelVisualization
                  chartData={chart}
                />
              </div>

              <div className="w-full md:w-1/3 space-y-6">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                  <h3 className="text-xl font-semibold mb-4 text-yellow-400">
                    Planetary Positions
                  </h3>
                  <div className="space-y-3">
                    {chart.planets?.map((planet: any) => (
                      <div
                        key={planet.name}
                        className="flex items-center space-x-3"
                      >
                        <span className="text-yellow-400 w-6">
                          {planet.glyph}
                        </span>
                        <span className="font-medium">{planet.name}</span>
                        <span className="ml-auto text-gray-400">
                          {planet.sign} {planet.degree}°
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                  <h3 className="text-xl font-semibold mb-4 text-purple-400">
                    Notable Aspects
                  </h3>
                  <div className="space-y-3">
                    {chart.aspects
                      ?.slice(0, 5)
                      .map((aspect: any, i: number) => (
                        <div key={i} className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              background:
                                aspect.color || getAspectColor(aspect.type),
                            }}
                          />
                          <span>
                            {aspect.from} {aspect.type} {aspect.to} (
                            {aspect.angle}°)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
