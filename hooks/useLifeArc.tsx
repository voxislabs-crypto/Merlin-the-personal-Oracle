import { useState, useCallback } from 'react';
import { LifeTimeline } from '@/lib/astrology/life-timeline-engine';
import { BirthData, BirthChartData } from '@/components/astrology/BirthChartCalculator';

export function useLifeArc() {
  const [lifeArc, setLifeArc] = useState<LifeTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateLifeArc = useCallback(async (birthData: BirthData, chartData: BirthChartData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/life-arc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: birthData.date,
          birthTime: birthData.time,
          lat: birthData.latitude,
          lon: birthData.longitude,
          chartData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to calculate life arc: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to calculate life arc');
      }

      setLifeArc(result.data);
      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error calculating life arc:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    lifeArc,
    loading,
    error,
    calculateLifeArc
  };
}
