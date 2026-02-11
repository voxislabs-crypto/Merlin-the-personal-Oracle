// Soul Dashboard Page - Full soul layer experience
"use client";

import React, { useState } from "react";
import { BirthChartCalculator, BirthChartData, BirthData } from "@/components/astrology/BirthChartCalculator";
import { SoulDashboard } from "@/components/astrology/SoulDashboard";

export default function SoulDashboardPage() {
  const [chartData, setChartData] = useState<any | null>(null);
  const [userAge, setUserAge] = useState<number>(30);
  const [userMood, setUserMood] = useState<
    "energized" | "exhausted" | "anxious" | "peaceful" | "restless" | "grieving" | "inspired" | "lost"
  >("peaceful");
  const [birthData] = useState<BirthData>({
    date: "",
    time: "",
    latitude: 0,
    longitude: 0,
  });

  const handleChartCalculated = (data: BirthChartData) => {
    // Convert BirthChartCalculator format to expected format
    const convertedData = {
      positions: data.planets || [],
      houses: data.houses || [],
      aspects: data.aspects || [],
      ascendant: {
        longitude: data.angles?.ascendant || 0,
        sign: "",
        degree: 0,
        minute: 0,
      },
      mc: {
        longitude: data.angles?.midheaven || 0,
        sign: "",
        degree: 0,
        minute: 0,
      },
      birthData: {
        birthDate: birthData.date,
        birthTime: birthData.time,
        coordinates: {
          lat: birthData.latitude,
          lon: birthData.longitude,
        },
      },
      jd: 0,
      aspectPatterns: [],
      midpoints: [],
      fixedStars: [],
      karmic: [],
      progressed: {} as any,
      electional: [],
      moonPhase: {} as any,
      transits: [],
    };
    
    // Add MBTI if present
    if ((data as any).mbti) {
      (convertedData as any).mbti = (data as any).mbti;
    }
    
    setChartData(convertedData);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="container mx-auto py-8">
        {!chartData ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-yellow-300 mb-2">
                Soul Dashboard
              </h1>
              <p className="text-slate-400">
                Enter your birth data to unlock your soul reading
              </p>
            </div>

            <BirthChartCalculator birthData={birthData} onCalculate={handleChartCalculated}>
              {({ chartData, loading, error, calculateChart }) => (
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-900 text-red-200 p-4 rounded">
                      {error.message}
                    </div>
                  )}

                  {loading && (
                    <div className="text-center text-slate-400">
                      Calculating your chart...
                    </div>
                  )}

                  {/* Chart data will trigger redirect to soul dashboard */}
                </div>
              )}
            </BirthChartCalculator>

            {/* Optional: User context inputs */}
            <div className="mt-8 bg-slate-800 p-6 rounded-lg space-y-4">
              <h3 className="text-xl font-semibold text-yellow-300">
                Personalize Your Reading (Optional)
              </h3>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Your Age
                </label>
                <input
                  type="number"
                  value={userAge}
                  onChange={(e) => setUserAge(Number(e.target.value))}
                  className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded"
                  min="1"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Current Mood
                </label>
                <select
                  value={userMood}
                  onChange={(e) =>
                    setUserMood(
                      e.target.value as typeof userMood
                    )
                  }
                  className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded"
                >
                  <option value="peaceful">Peaceful</option>
                  <option value="energized">Energized</option>
                  <option value="exhausted">Exhausted</option>
                  <option value="anxious">Anxious</option>
                  <option value="restless">Restless</option>
                  <option value="grieving">Grieving</option>
                  <option value="inspired">Inspired</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <SoulDashboard
            chartData={chartData}
            userAge={userAge}
            userMood={userMood}
          />
        )}
      </div>
    </div>
  );
}
