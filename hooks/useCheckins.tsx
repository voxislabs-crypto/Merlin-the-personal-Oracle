import { useCallback, useState } from 'react';

export interface CheckinEntry {
  id: string;
  createdAt: string;
  mood: number | null;
  stress: number | null;
  energy: number | null;
  confidence: number | null;
  domains: Record<string, number>;
  notes: string | null;
}

export interface CheckinPayload {
  mood: number;
  stress: number;
  energy: number;
  confidence?: number;
  domains?: Record<string, number>;
  notes?: string;
  timestamp?: string;
}

export function useCheckins() {
  const [entries, setEntries] = useState<CheckinEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitCheckin = useCallback(async (payload: CheckinPayload): Promise<CheckinEntry | null> => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || response.statusText || 'Failed to submit checkin');
      }

      const entry: CheckinEntry = {
        id: result.data.id,
        createdAt: result.data.createdAt,
        mood: payload.mood,
        stress: payload.stress,
        energy: payload.energy,
        confidence: payload.confidence ?? null,
        domains: payload.domains || {},
        notes: payload.notes || null,
      };

      setEntries((prev) => [entry, ...prev].slice(0, 300));
      return entry;
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error('Unknown checkin error');
      setError(wrapped);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const loadHistory = useCallback(async (options?: { days?: number }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.days) {
        params.set('days', String(options.days));
      }

      const response = await fetch(`/api/checkin/history${params.toString() ? `?${params.toString()}` : ''}`);
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || response.statusText || 'Failed to load checkin history');
      }

      const nextEntries = Array.isArray(result?.data?.entries) ? (result.data.entries as CheckinEntry[]) : [];
      setEntries(nextEntries);
      return nextEntries;
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error('Unknown history error');
      setError(wrapped);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    entries,
    loading,
    submitting,
    error,
    submitCheckin,
    loadHistory,
  };
}
