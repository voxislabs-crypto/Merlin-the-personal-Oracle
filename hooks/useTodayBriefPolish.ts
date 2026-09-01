'use client';

import { useEffect, useRef, useState } from 'react';

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

function snapshotKey(snap: TodayBriefPolishSnapshot): string {
  return [
    snap.date || '',
    snap.leadFactDisplay || '',
    snap.coreType || '',
    snap.maskType || '',
    snap.sunSign || '',
  ].join('|');
}

/**
 * Optional LLM overlay for the Today card. Deterministic copy stays on screen;
 * this swaps in a sharper lived-meaning pass when the model returns.
 */
export function useTodayBriefPolish(snapshot: TodayBriefPolishSnapshot) {
  const [polish, setPolish] = useState<TodayBriefPolishResult | null>(null);
  const lastKey = useRef('');

  useEffect(() => {
    if (snapshot.loading) return;
    if (!snapshot.date || !snapshot.leadFact || !snapshot.chartWhy) return;
    const key = snapshotKey(snapshot);
    if (key === lastKey.current && polish) return;
    lastKey.current = key;

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);

    void fetch('/api/today-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        date: snapshot.date,
        leadFact: snapshot.leadFact,
        leadFactDisplay: snapshot.leadFactDisplay,
        chartWhy: snapshot.chartWhy,
        move: snapshot.move,
        watchFor: snapshot.watchFor,
        operationalTension: snapshot.operationalTension,
        doNot: snapshot.doNot,
        coreType: snapshot.coreType,
        maskType: snapshot.maskType,
        sunSign: snapshot.sunSign,
        moonSign: snapshot.moonSign,
        moonPhase: snapshot.moonPhase,
        heldFromYesterday: snapshot.heldFromYesterday,
        yesterdayRestless: snapshot.yesterdayRestless,
        streak: snapshot.streak,
      }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const json = (await response.json()) as { success?: boolean; data?: TodayBriefPolishResult | null };
        if (!json?.success || !json.data?.chartWhy) return null;
        return json.data;
      })
      .then((data) => {
        if (data) setPolish(data);
      })
      .catch(() => {
        // Deterministic copy is the product; polish is extra.
      })
      .finally(() => {
        window.clearTimeout(timer);
      });

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // Intentionally keyed by snapshot identity, not every field object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    snapshot.loading,
    snapshot.date,
    snapshot.leadFact,
    snapshot.leadFactDisplay,
    snapshot.coreType,
    snapshot.maskType,
    snapshot.sunSign,
  ]);

  return polish;
}
