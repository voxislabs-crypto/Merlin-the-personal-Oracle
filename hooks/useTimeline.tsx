// hooks/useTimeline.tsx - Hook for timeline generation and management

'use client';

import { useState, useCallback } from 'react';
import { Timeline } from '@/lib/timeline-service';
import { BirthChartData } from '@/types/astrology';

export interface UseTimelineState {
  timeline: Timeline | null;
  loading: boolean;
  error: string | null;
  lookAheadMonths: number;
}

export const useTimeline = () => {
  const [state, setState] = useState<UseTimelineState>({
    timeline: null,
    loading: false,
    error: null,
    lookAheadMonths: 12,
  });

  const generateTimeline = useCallback(
    async (birthChart: BirthChartData, months: number = 12) => {
      setState((prev: any) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthChart,
            lookAheadMonths: months,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate timeline');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Timeline generation failed');
        }

        setState((prev: any) => ({
          ...prev,
          timeline: result.data,
          lookAheadMonths: months,
          loading: false,
        }));

        return result.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev: any) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
        console.error('Timeline generation error:', error);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      timeline: null,
      loading: false,
      error: null,
      lookAheadMonths: 12,
    });
  }, []);

  return {
    timeline: state.timeline,
    loading: state.loading,
    error: state.error,
    lookAheadMonths: state.lookAheadMonths,
    generateTimeline,
    reset,
  };
};
