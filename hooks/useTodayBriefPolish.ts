'use client';

import { useEffect, useRef, useState } from 'react';
import {
  normalizeTodayBriefEvidence,
  todayBriefEvidenceKey,
} from '@/lib/atmosphere/today-brief-evidence';

export interface TodayBriefPolishSnapshot {
  date?: string | null;
  leadFact?: string | null;
  leadFactDisplay?: string | null;
  chartWhy?: string | null;
  move?: string | null;
  watchFor?: string | null;
  operationalTension?: string | null;
  doNot?: string | null;
  coreType?: string | null;
  maskType?: string | null;
  sunSign?: string | null;
  moonSign?: string | null;
  moonPhase?: string | null;
  domains?: string[] | null;
  supportingFacts?: string[] | null;
  heldFromYesterday?: boolean;
  yesterdayRestless?: boolean;
  streak?: number | null;
  loading?: boolean;
}

export interface TodayBriefPolishResult {
  chartWhy: string;
  watchFor: string;
  operationalTension: string | null;
  source: 'llm';
}

export interface TodayBriefVisibleLines {
  chartWhy?: string;
  watchFor?: string;
  tensionLine?: string;
  behaviorTell?: string;
}

/**
 * Polish may replace chartWhy, the watch line, and the tension line.
 * A rejected line comes back equal to the deterministic draft, so the
 * engine's tension line and behavior tell stay.
 */
export function mergeTodayBriefPolish(
  brief: TodayBriefVisibleLines & { operationalTension?: string | null },
  polish: TodayBriefPolishResult | null,
): TodayBriefVisibleLines {
  if (!polish) {
    return {
      chartWhy: brief.chartWhy,
      watchFor: brief.watchFor,
      tensionLine: brief.tensionLine,
      behaviorTell: brief.behaviorTell,
    };
  }
  const watchReplaced = Boolean(polish.watchFor) && polish.watchFor !== brief.watchFor;
  const tensionReplaced =
    Boolean(polish.operationalTension) && polish.operationalTension !== brief.operationalTension;
  return {
    chartWhy: polish.chartWhy || brief.chartWhy,
    watchFor: polish.watchFor || brief.watchFor,
    tensionLine: tensionReplaced ? polish.operationalTension || brief.tensionLine : brief.tensionLine,
    behaviorTell: watchReplaced ? undefined : brief.behaviorTell,
  };
}

const SETTLED_LIMIT = 12;

function snapshotKey(snap: TodayBriefPolishSnapshot): string {
  return todayBriefEvidenceKey(normalizeTodayBriefEvidence(snap));
}

/**
 * Optional LLM overlay for the three Today lines. Deterministic copy stays on
 * screen until a response for the current evidence arrives. A failed polish is
 * not retried until the evidence changes. The POST is not aborted: cutting the
 * body makes the route throw "Unexpected end of JSON input".
 */
export function useTodayBriefPolish(snapshot: TodayBriefPolishSnapshot) {
  const [polish, setPolish] = useState<TodayBriefPolishResult | null>(null);
  const requestId = useRef(0);
  const settled = useRef(new Map<string, TodayBriefPolishResult | null>());
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const key = snapshotKey(snapshot);
  const ready = Boolean(
    !snapshot.loading && snapshot.date && snapshot.leadFact && snapshot.chartWhy,
  );
  const [shownKey, setShownKey] = useState(key);

  if (!ready) {
    if (polish !== null) setPolish(null);
  } else if (shownKey !== key) {
    setShownKey(key);
    if (polish !== null) setPolish(null);
  }

  useEffect(() => {
    if (!ready) {
      setPolish(null);
      requestId.current += 1;
      return;
    }

    const remembered = settled.current.get(key);
    if (remembered !== undefined) {
      requestId.current += 1;
      setPolish(remembered);
      return;
    }

    setPolish(null);
    const id = ++requestId.current;
    const snap = snapshotRef.current;
    const payload = {
      date: snap.date,
      leadFact: snap.leadFact,
      leadFactDisplay: snap.leadFactDisplay,
      chartWhy: snap.chartWhy,
      move: snap.move,
      watchFor: snap.watchFor,
      operationalTension: snap.operationalTension,
      doNot: snap.doNot,
      coreType: snap.coreType,
      maskType: snap.maskType,
      sunSign: snap.sunSign,
      moonSign: snap.moonSign,
      moonPhase: snap.moonPhase,
      domains: snap.domains || [],
      supportingFacts: snap.supportingFacts || [],
      heldFromYesterday: snap.heldFromYesterday,
      yesterdayRestless: snap.yesterdayRestless,
      streak: snap.streak,
    };
    const timer = window.setTimeout(() => {
      void fetch('/api/today-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          if (!response.ok) return null;
          const json = (await response.json()) as {
            success?: boolean;
            data?: TodayBriefPolishResult | null;
          };
          if (!json?.success || !json.data?.chartWhy) return null;
          return json.data;
        })
        .then((data) => {
          if (id !== requestId.current) {
            if (data && !settled.current.has(key)) remember(settled.current, key, data);
            return;
          }
          remember(settled.current, key, data);
          setPolish(data);
        })
        .catch(() => {
          if (id !== requestId.current) return;
          remember(settled.current, key, null);
        });
    }, 400);

    return () => {
      window.clearTimeout(timer);
      requestId.current += 1;
    };
    // The key is the full evidence identity. The payload is read from the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key]);

  return polish;
}

function remember(
  cache: Map<string, TodayBriefPolishResult | null>,
  key: string,
  value: TodayBriefPolishResult | null,
): void {
  if (!cache.has(key) && cache.size >= SETTLED_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, value);
}
