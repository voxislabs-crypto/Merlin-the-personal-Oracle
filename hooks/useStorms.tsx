import { useState, useCallback } from "react";
import { BirthData } from "@/components/astrology/BirthChartCalculator";
import { getLocalCalendarDate } from "@/lib/datetime/local-calendar";
import { MBTIType } from "@/shared/schema";
import {
  enrichStorms,
  groupStormsByCategory,
  STORM_CATEGORY_META,
  type StormLifeCategory,
  type StormPlaybookFields,
  type StormWhenInfo,
} from "@/lib/astrology/storm-playbook";

export type { StormLifeCategory, StormWhenInfo };

export interface AstroStorm extends StormPlaybookFields {
  id: string;
  date: string;
  dayName: string;
  title: string;
  intensity: "severe" | "moderate" | "mild";
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  lifeArea: string;
  description: string;
  navigation: string;
  personalityReaction?: string;
  recoveryNote?: string;
  peakWindow?: string;
  intensityScore?: number;
  phase?: "brewing" | "peak";
  keywords: string[];
}

export interface StormCategorySummary {
  category: StormLifeCategory;
  label: string;
  count: number;
  maxConfidence: number;
  nextWhen?: string;
}

export interface StormsReport {
  storms: AstroStorm[];
  byCategory?: Record<StormLifeCategory, AstroStorm[]>;
  categorySummary?: StormCategorySummary[];
  clearDays: string[];
  weekSummary: string;
  mbtiType?: string;
  horizonDays?: number;
  dayHorizon?: import('@/lib/atmosphere/types').LifeRiskDayScore[];
}

/** Ensure older cached payloads still get playbook fields client-side */
function ensurePlaybook(report: StormsReport): StormsReport {
  const needsEnrich =
    !report.storms?.length ||
    report.storms.some((s) => !s.category || !s.when || !s.actionableSteps?.length);

  const storms = needsEnrich
    ? (enrichStorms(report.storms || []) as AstroStorm[])
    : report.storms;

  const byCategory =
    report.byCategory && !needsEnrich
      ? report.byCategory
      : groupStormsByCategory(storms);

  const categorySummary =
    report.categorySummary && !needsEnrich
      ? report.categorySummary
      : (['social', 'work', 'financial', 'health'] as StormLifeCategory[])
          .map((category) => {
            const list = byCategory[category] || [];
            return {
              category,
              label: STORM_CATEGORY_META[category].shortLabel,
              count: list.length,
              maxConfidence: list.reduce((max, s) => Math.max(max, s.confidence || 0), 0),
              nextWhen: list[0]?.when?.summary,
            };
          })
          .filter((row) => row.count > 0);

  return {
    ...report,
    storms,
    byCategory,
    categorySummary,
    horizonDays: report.horizonDays ?? 30,
  };
}

export function useStorms() {
  const [stormsReport, setStormsReport] = useState<StormsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const buildCacheKey = (birthData: BirthData, mbtiType?: MBTIType, daysAhead = 30) => {
    const day = typeof window !== 'undefined' ? getLocalCalendarDate() : 'ssr';
    return `merlin_storms_v4_${birthData.date}_${birthData.time}_${birthData.latitude.toFixed(3)}_${birthData.longitude.toFixed(3)}_${mbtiType || 'none'}_${daysAhead}_${day}`;
  };

  const calculateStorms = useCallback(
    async (birthData: BirthData, mbtiType?: MBTIType, daysAhead = 30): Promise<StormsReport | null> => {
      setLoading(true);
      setError(null);
      const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;
      const clientDate = getLocalCalendarDate();

      try {
        const cacheKey = buildCacheKey(birthData, mbtiType, daysAhead);
        if (typeof window !== 'undefined') {
          const cachedRaw = localStorage.getItem(cacheKey);
          if (cachedRaw) {
            try {
              const cached = JSON.parse(cachedRaw) as { data: StormsReport; timestamp: number };
              // 24 hour cache window for storms radar
              if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
                const ensured = ensurePlaybook(cached.data);
                setStormsReport(ensured);
                return ensured;
              }
            } catch {
              // ignore malformed cache
            }
          }
        }

        const response = await fetch("/api/storms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            birthDate: birthData.date,
            birthTime: birthData.time,
            lat: birthData.latitude,
            lon: birthData.longitude,
            timezoneOffset: timezoneOffsetHours,
            clientDate,
            mbtiType: mbtiType ?? null,
            daysAhead,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error ?? "Failed to calculate storms");
        }

        const ensured = ensurePlaybook(result.data as StormsReport);
        setStormsReport(ensured);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({ data: ensured, timestamp: Date.now() })
            );
          } catch {
            // storage full — ignore
          }
        }

        return ensured;
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error("Unknown storms error");
        setError(wrapped);
        console.error("Storms error:", wrapped);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStormsReport(null);
    setError(null);
  }, []);

  return {
    stormsReport,
    loading,
    error,
    calculateStorms,
    reset,
  };
}
