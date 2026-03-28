import { useCallback, useState } from 'react';
import type { BirthChartData } from '@/components/astrology/BirthChartCalculator';

export type ProphecyStyle = 'omen' | 'sonnet';
export type ProphecyEra = 'babylonian' | 'hermetic' | 'psalmic' | 'stoic';

export interface ProphecyData {
  style: ProphecyStyle;
  era: ProphecyEra;
  title: string;
  prophecy: string;
  meter?: {
    score: number;
    averageSyllables: number;
  };
  signals: {
    blessingPlanet: string;
    blessingSign: string;
    challengePlanet: string;
    challengeSign: string;
  };
}

export interface ProphecyHistoryItem {
  id: string;
  title: string;
  prophecy: string;
  style: ProphecyStyle;
  era: ProphecyEra;
  signals?: {
    blessingPlanet: string;
    blessingSign: string;
    challengePlanet: string;
    challengeSign: string;
  };
  meter?: {
    score: number;
    averageSyllables: number;
  } | null;
  fulfilled: boolean;
  createdAt: string;
}

export function useProphecy() {
  const [prophecy, setProphecy] = useState<ProphecyData | null>(null);
  const [history, setHistory] = useState<ProphecyHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateProphecy = useCallback(async (params: {
    birthChart: BirthChartData;
    style?: ProphecyStyle;
    era?: ProphecyEra;
    strictMeter?: boolean;
    saveToHistory?: boolean;
  }): Promise<ProphecyData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prophecy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to generate prophecy');
      }

      setProphecy(result.data as ProphecyData);
      return result.data as ProphecyData;
    } catch (err) {
      const parsed = err instanceof Error ? err : new Error('Unknown error');
      setError(parsed);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProphecy(null);
    setError(null);
  }, []);

  const loadHistory = useCallback(async (): Promise<ProphecyHistoryItem[]> => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/prophecy-history');
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to load prophecy history');
      }

      const parsed = (result.data || []) as ProphecyHistoryItem[];
      setHistory(parsed);
      return parsed;
    } catch (err) {
      const parsed = err instanceof Error ? err : new Error('Unknown error');
      setError(parsed);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const markHistoryFulfilled = useCallback(async (id: string, fulfilled: boolean): Promise<boolean> => {
    try {
      const response = await fetch('/api/prophecy-history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, fulfilled }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to update history item');
      }

      setHistory((prev) => prev.map((item) => (item.id === id ? { ...item, fulfilled } : item)));
      return true;
    } catch (err) {
      const parsed = err instanceof Error ? err : new Error('Unknown error');
      setError(parsed);
      return false;
    }
  }, []);

  return {
    prophecy,
    history,
    loading,
    historyLoading,
    error,
    generateProphecy,
    loadHistory,
    markHistoryFulfilled,
    reset,
  };
}
