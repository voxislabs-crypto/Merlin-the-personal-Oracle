'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BirthData {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h format)
  latitude: number;
  longitude: number;
  houseSystem?: 'Placidus' | 'Koch' | 'Equal' | 'Whole';
  zodiac?: 'Tropical' | 'Sidereal';
}

export interface PlanetPosition {
  name: string;
  longitude: number; // in degrees (0-360)
  latitude: number;  // in degrees
  distance: number;  // in AU
  speed: number;     // daily motion in longitude (degrees/day)
  sign: string;      // Zodiac sign (Aries, Taurus, etc.)
  degree: number;    // Position within sign (0-29)
  minute: number;    // Minutes of arc (0-59)
  second: number;    // Seconds of arc (0-59)
  house: number;     // House number (1-12)
  dignity?: {
    type: string;    // e.g., 'Domicile', 'Exaltation', etc.
    score: number;   // Numerical score of dignity
  }[];
}

export interface HouseCusp {
  house: number;     // 1-12
  position?: number;  // Longitude in degrees (deprecated, use longitude instead)
  longitude: number; // Longitude in degrees (0-360)
  sign: string;      // Zodiac sign
  degree: number;    // 0-29
  minute: number;    // 0-59
  second: number;   // 0-59
}

export interface Aspect {
  planet1: string;   // Name of first planet
  planet2: string;   // Name of second planet
  type: string;      // e.g., 'Conjunction', 'Trine', etc.
  orb: number;       // Exactness of aspect in degrees
  exact: boolean;    // Whether the aspect is exact (within 1°)
  influence: 'positive' | 'negative' | 'neutral';
}

export interface BirthChartData {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  aspects: Aspect[];
  angles: {
    ascendant: number;
    midheaven: number;
    descendant: number;
    imumCoeli: number;
  };
  metadata: {
    calculatedAt: string;
    houseSystem: string;
    zodiac: string;
  };
}

interface BirthChartCalculatorProps {
  birthData: BirthData;
  onCalculate?: (chartData: BirthChartData) => void;
  onError?: (error: Error) => void;
  children?: (props: {
    chartData: BirthChartData | null;
    loading: boolean;
    error: Error | null;
    calculateChart: (data: BirthData) => Promise<void>;
  }) => React.ReactNode;
}

export function BirthChartCalculator({
  birthData,
  onCalculate,
  onError,
  children,
}: BirthChartCalculatorProps) {
  const [chartData, setChartData] = useState<BirthChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateChart = useCallback(async (data: BirthData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/calculate-birth-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: data.date,
          birthTime: data.time,
          lat: data.latitude,
          lon: data.longitude,
          houseSystem: data.houseSystem || 'Placidus',
          zodiac: data.zodiac || 'Tropical',
        }),
      });

      if (!response.ok) {
        throw new Error(`Error calculating chart: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to calculate birth chart');
      }

      const chartData = result.data as BirthChartData;
      setChartData(chartData);
      onCalculate?.(chartData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [onCalculate, onError]);

  // Auto-calculate when birthData changes
  useEffect(() => {
    if (birthData) {
      calculateChart(birthData);
    }
  }, [birthData, calculateChart]);

  // If children is provided as a function, render it with the render props
  if (typeof children === 'function') {
    return <>{children({ chartData, loading, error, calculateChart })}</>;
  }

  // Default render (can be overridden by children)
  return null;
}
