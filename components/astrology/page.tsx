// app/page.tsx
"use client";

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
// import { useChartCalculation } from '@/hooks/useChartCalculation';
import { ErrorBoundary } from 'react-error-boundary';

// Import types for type safety
import type { PlanetPosition, HousePosition, Aspect } from '@/types/astrology';
import type { WheelVisualizationProps, SimpleChartTabsProps } from '@/types/chart';

import { WheelVisualization } from '@/components/astrology/newchart/WheelVisualization';
import { transformChartData } from '@/lib/astrology/chartDataTransformers';
import { SimpleChartTabs } from '@/components/astrology/SimpleChartTabs';

// Test data for development
const createPlanet = (
  name: string,
  longitude: number,
  sign: string,
  degree: number,
  minute: number,
  house: number,
  latitude = 0,
  distance = 1
): PlanetPosition => ({
  name,
  longitude,
  latitude,
  distance,
  sign,
  degree,
  minute,
  house,
  dignities: []
});

const TEST_PLANETS: PlanetPosition[] = [
  createPlanet('Sun', 120, 'Leo', 20, 30, 5),
  createPlanet('Moon', 45, 'Taurus', 15, 0, 2),
  createPlanet('Mercury', 100, 'Cancer', 10, 45, 4),
  createPlanet('Venus', 150, 'Virgo', 0, 15, 6),
  createPlanet('Mars', 200, 'Scorpio', 10, 0, 8),
  createPlanet('Jupiter', 30, 'Aries', 25, 30, 1),
  createPlanet('Saturn', 90, 'Gemini', 5, 45, 3),
  createPlanet('Uranus', 180, 'Libra', 15, 20, 7),
  createPlanet('Neptune', 240, 'Sagittarius', 5, 10, 9),
  createPlanet('Pluto', 270, 'Capricorn', 20, 0, 10),
  createPlanet('North Node', 60, 'Taurus', 0, 0, 2),
  createPlanet('South Node', 240, 'Scorpio', 0, 0, 8),
];

const TEST_HOUSES: HousePosition[] = Array.from({ length: 12 }, (_, i) => ({
  house: i + 1,
  position: i * 30,
  sign: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][i],
  degree: 0,
  minute: 0
}));

const createAspect = (
  planet1Name: string,
  planet2Name: string,
  type: string,
  orb: number
): Aspect => {
  // Helper function to create a minimal planet object
  const createMinimalPlanet = (name: string) => {
    const planet = TEST_PLANETS.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (planet) return planet;

    // Return a minimal valid planet object if not found in test data
    return {
      name: name,
      longitude: 0,
      latitude: 0,
      distance: 1,
      sign: 'Aries',
      degree: 0,
      minute: 0,
      house: 1
    };
  };

  const planet1 = createMinimalPlanet(planet1Name);
  const planet2 = createMinimalPlanet(planet2Name);

  return {
    planet1: {
      name: planet1.name,
      longitude: planet1.longitude,
      latitude: planet1.latitude,
      distance: planet1.distance,
      sign: planet1.sign,
      degree: planet1.degree,
      minute: planet1.minute,
      house: planet1.house
    },
    planet2: {
      name: planet2.name,
      longitude: planet2.longitude,
      latitude: planet2.latitude,
      distance: planet2.distance,
      sign: planet2.sign,
      degree: planet2.degree,
      minute: planet2.minute,
      house: planet2.house
    },
    type,
    orb
  };
};

const TEST_ASPECTS: Aspect[] = [
  createAspect('Sun', 'Moon', 'Trine', 3.5),
  createAspect('Mercury', 'Venus', 'Conjunction', 2.1),
  createAspect('Mars', 'Jupiter', 'Square', 1.8),
  createAspect('Saturn', 'Uranus', 'Opposition', 4.2),
  createAspect('Neptune', 'Pluto', 'Sextile', 0.7),
];

// Error boundary fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  return (
    <div role="alert" className="p-4 bg-red-100 text-red-700 rounded-lg">
      <p className="font-bold">Something went wrong:</p>
      <pre className="whitespace-pre-wrap">{errorMessage}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Try again
      </button>
    </div>
  );
}

// Default birth data (could be moved to a config or form state)
const DEFAULT_BIRTH_DATA = {
  birthDate: '1983-08-14',
  birthTime: '12:21',
  lat: 36.85,
  lon: -76.29
};

export default function Home() {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [hoveredAspect, setHoveredAspect] = useState<string | null>(null);

  // Using test data since hook is commented out
  const chart = {
    positions: TEST_PLANETS,
    houses: TEST_HOUSES,
    aspects: TEST_ASPECTS
  };

  // Transform chart data to NewChart format
  const transformedChartData = useMemo(() => {
    if (!chart) return null;

    // Pass chart data as a single object matching the function signature
    return transformChartData({
      planets: chart.positions,
      houses: chart.houses,
      aspects: chart.aspects
    });
  }, [chart]);

  if (!transformedChartData) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 md:mb-12 bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">
            Merlin
          </h1>
          <p className="text-amber-300">Loading chart data...</p>
        </div>
      </main>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">
            Merlin — Your Sky
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Wheel - takes 2/3 on large screens */}
            <div className="lg:col-span-2 flex justify-center">
              <WheelVisualization
                chartData={transformedChartData}
                size={600}
                onPlanetHover={setHoveredPlanet}
                className="w-full max-w-4xl"
              />
            </div>

            {/* Tabs - takes 1/3, vertical */}
            <div className="lg:col-span-1 h-[80vh] overflow-hidden">
              {chart && (
                <SimpleChartTabs
                  planets={chart.positions}
                  aspects={chart.aspects}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}