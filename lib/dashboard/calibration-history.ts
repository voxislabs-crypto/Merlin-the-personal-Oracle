export type CalibrationSortMode = 'recent' | 'impact';

export type CalibrationHistoryEntry = {
  id: string;
  createdAt: string;
  windowDays: number | null;
  sampleSize: number | null;
  minSamples: number | null;
  strongestModifier: { planet?: string; multiplier?: number } | null;
  modifierCount: number;
  modifiers: Record<string, number>;
  modifierDelta: Array<{ planet: string; previous: number; current: number; delta: number }>;
  impactScore?: number;
};

export type CalibrationDelta = {
  planet: string;
  previous: number;
  current: number;
  delta: number;
};

export function parseCalibrationHistoryDays(raw: string | null): 7 | 30 | 90 | null {
  if (raw === '7' || raw === '30' || raw === '90') {
    return Number(raw) as 7 | 30 | 90;
  }
  return null;
}

export function parseCalibrationSortMode(raw: string | null): CalibrationSortMode | null {
  if (raw === 'recent' || raw === 'impact') {
    return raw;
  }
  return null;
}

export function getCalibrationImpact(entry: CalibrationHistoryEntry): number {
  if (typeof entry.impactScore === 'number') {
    return entry.impactScore;
  }

  return Math.max(...entry.modifierDelta.map((item) => Math.abs(item.delta)), 0);
}

export function getTopMover(entry: CalibrationHistoryEntry): CalibrationDelta | null {
  if (!entry.modifierDelta.length) {
    return null;
  }

  return [...entry.modifierDelta].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
}

export function getLatestCalibrationComparison(entries: CalibrationHistoryEntry[]): {
  latest: CalibrationHistoryEntry;
  previous: CalibrationHistoryEntry;
  topMovers: CalibrationDelta[];
} | null {
  const recent = sortCalibrationHistory(entries, 'recent');
  if (recent.length < 2) {
    return null;
  }

  const latest = recent[0];
  const previous = recent[1];
  const topMovers = [...latest.modifierDelta].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);

  return { latest, previous, topMovers };
}

export function sortCalibrationHistory(
  entries: CalibrationHistoryEntry[],
  sortMode: CalibrationSortMode
): CalibrationHistoryEntry[] {
  return [...entries].sort((a, b) => {
    if (sortMode === 'impact') {
      const impactA = getCalibrationImpact(a);
      const impactB = getCalibrationImpact(b);
      if (impactB !== impactA) {
        return impactB - impactA;
      }
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
