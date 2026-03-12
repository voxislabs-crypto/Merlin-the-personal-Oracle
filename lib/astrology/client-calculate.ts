import { calculateBirthChart as calculateFallbackBirthChart } from "@/lib/engine-fallback";
import { readJsonResponse, resolveApiUrl } from "@/lib/api-client";
import type { BirthChartData } from "@/types/astrology";

export interface ClientBirthChartRequest {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  houseSystem?: "Placidus" | "Koch" | "Equal" | "Whole";
  zodiac?: "Tropical" | "Sidereal";
}

interface CalculateBirthChartApiResponse {
  success: boolean;
  error?: string;
  data?: BirthChartData;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function assertValidRequest(data: ClientBirthChartRequest) {
  if (!data.birthDate || !data.birthTime) {
    throw new Error("Missing required birth date/time");
  }

  if (!isFiniteNumber(data.latitude) || !isFiniteNumber(data.longitude)) {
    throw new Error("Invalid coordinates");
  }

  if (data.latitude < -90 || data.latitude > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (data.longitude < -180 || data.longitude > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }
}

export async function calculateBirthChartClient(
  data: ClientBirthChartRequest
): Promise<BirthChartData> {
  assertValidRequest(data);

  try {
    const response = await fetch(resolveApiUrl("/api/calculate-birth-chart"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        lat: data.latitude,
        lon: data.longitude,
        houseSystem: data.houseSystem,
        zodiac: data.zodiac,
      }),
    });

    const payload = await readJsonResponse<CalculateBirthChartApiResponse>(
      response,
      "Birth chart API"
    );

    if (!response.ok || !payload.success || !payload.data) {
      throw new Error(payload.error || "Birth chart API request failed");
    }

    return payload.data;
  } catch (error) {
    console.warn(
      "[client-calculate] API chart calculation failed, using local fallback:",
      error instanceof Error ? error.message : String(error)
    );

    return calculateFallbackBirthChart(
      data.birthDate,
      data.birthTime,
      data.latitude,
      data.longitude
    );
  }
}
