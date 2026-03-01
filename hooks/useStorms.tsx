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

  const calculateStorms = useCallback(
    async (birthData: BirthData, mbtiType?: MBTIType): Promise<StormsReport | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/storms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            birthDate: birthData.date,
            birthTime: birthData.time,
            lat: birthData.latitude,
            lon: birthData.longitude,
            mbtiType: mbtiType ?? null,
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
