import { useState, useCallback } from "react";
import { BirthData } from "@/components/astrology/BirthChartCalculator";
import { MBTIType } from "@/shared/schema";

export interface AstroStorm {
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

export interface StormsReport {
  storms: AstroStorm[];
  clearDays: string[];
  weekSummary: string;
  mbtiType?: string;
}

export function useStorms() {
  const [stormsReport, setStormsReport] = useState<StormsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const buildCacheKey = (birthData: BirthData, mbtiType?: MBTIType, daysAhead = 7) => {
    return `merlin_storms_${birthData.date}_${birthData.time}_${birthData.latitude.toFixed(3)}_${birthData.longitude.toFixed(3)}_${mbtiType || 'none'}_${daysAhead}`;
  };

  const calculateStorms = useCallback(
    async (birthData: BirthData, mbtiType?: MBTIType, daysAhead = 7): Promise<StormsReport | null> => {
      setLoading(true);
      setError(null);
      const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;

      try {
        const cacheKey = buildCacheKey(birthData, mbtiType, daysAhead);
        if (typeof window !== 'undefined') {
          const cachedRaw = localStorage.getItem(cacheKey);
          if (cachedRaw) {
            try {
              const cached = JSON.parse(cachedRaw) as { data: StormsReport; timestamp: number };
              // 24 hour cache window for storms radar
              if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
                setStormsReport(cached.data);
                return cached.data;
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

        setStormsReport(result.data);
        if (typeof window !== 'undefined') {
          const cacheKey = buildCacheKey(birthData, mbtiType, daysAhead);
          localStorage.setItem(cacheKey, JSON.stringify({ data: result.data, timestamp: Date.now() }));
        }
        return result.data;
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Unknown error");
        setError(e);
        console.error("[useStorms] Error:", e);
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

  return { stormsReport, loading, error, calculateStorms, reset };
}
