import { useCallback, useRef, useState } from 'react';
import type { BirthChartData } from '@/components/astrology/BirthChartCalculator';
import type { ProphecyPolishMode } from '@/lib/prophecy-polish';

export type ProphecyStyle = 'omen' | 'sonnet';
export type ProphecyEra = 'babylonian' | 'hermetic' | 'psalmic' | 'stoic';

export interface ProphecyData {
  style: ProphecyStyle;
  era: ProphecyEra;
  polishedBy?: 'engine' | 'groq';
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
  /** Monotonic request id so a slow auto-generate cannot overwrite a newer regenerate. */
  const requestIdRef = useRef(0);

  const generateProphecy = useCallback(async (params: {
    birthChart: BirthChartData;
    style?: ProphecyStyle;
    era?: ProphecyEra;
    strictMeter?: boolean;
    saveToHistory?: boolean;
    polishMode?: ProphecyPolishMode;
    /** Force a new variant (Regenerate button) */
    regenerate?: boolean;
    seedSalt?: string | number;
  }): Promise<ProphecyData | null> => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    // Clear old text immediately on regenerate so the UI doesn't look frozen on the prior reading.
    if (params.regenerate) {
      setProphecy(null);
    }

    const seedSalt =
      params.seedSalt ??
      (params.regenerate
        ? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}-${requestId}`
        : undefined);

    try {
      const response = await fetch('/api/prophecy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          ...params,
          seedSalt,
          regenerate: Boolean(params.regenerate || seedSalt),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to generate prophecy');
      }

      // Drop stale responses (e.g. initial load finishing after regenerate).
      if (requestId !== requestIdRef.current) {
        return result.data as ProphecyData;
      }

      setProphecy(result.data as ProphecyData);
      return result.data as ProphecyData;
    } catch (err) {
      if (requestId === requestIdRef.current) {
        const parsed = err instanceof Error ? err : new Error('Unknown error');
        setError(parsed);
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
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
