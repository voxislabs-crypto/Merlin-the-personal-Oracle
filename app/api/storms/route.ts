// API Route: Storms & Navigations
// Detects challenging astrological transits over the next 7 days
// and generates personalised MBTI-aware navigation advice
import { NextResponse } from "next/server";
import { calculateBirthChart } from "@/lib/engine";
import { calculateBirthChart as calculateBirthChartFallback } from "@/lib/engine-fallback";
import { predictStorms } from "@/lib/astrology/storms";
import { BirthChartData } from "@/types/astrology";
import { MBTIType } from "@/shared/schema";
import { generateChartHash, serverCache } from "@/lib/cache-service";

export async function POST(request: Request) {
  console.log("[Storms] Received request for weekly storm forecast");
  const TTL_24H_MS = 24 * 60 * 60 * 1000;

  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon, mbtiType, daysAhead = 7 } = body;

    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { success: false, error: "Missing birth date or time" },
        { status: 400 }
      );
    }

    // Calculate natal birth chart
    let natalChart: BirthChartData;
    try {
      natalChart = calculateBirthChart(
        birthDate,
        birthTime,
        lat ?? 0,
        lon ?? 0,
        { includePatterns: false, includeTransits: false }
      ) as BirthChartData;
      console.log("[Storms] Using Swiss Ephemeris engine");
    } catch (swephError) {
      console.warn("[Storms] Swiss Ephemeris failed, using fallback:", swephError);
      natalChart = calculateBirthChartFallback(
        birthDate,
        birthTime,
        lat ?? 0,
        lon ?? 0
      ) as BirthChartData;
    }

    const safeDaysAhead = Math.max(1, Math.min(30, Number(daysAhead) || 7));
    const cacheHash = generateChartHash(
      birthDate,
      birthTime,
      Number(lat ?? 0),
      Number(lon ?? 0),
      { useGrok: false, houseSystem: `storms-${safeDaysAhead}`, tone: "direct" }
    );
    const cacheKey = `storms:${cacheHash}:${mbtiType || "none"}`;
    const cached = serverCache.get<{ cachedAt: number; data: any }>(cacheKey);
    if (cached && Date.now() - cached.cachedAt < TTL_24H_MS) {
      return NextResponse.json({ success: true, cached: true, data: cached.data });
    }

    // Run storm detection
    const stormsReport = predictStorms(
      natalChart,
      safeDaysAhead,
      mbtiType as MBTIType | undefined
    );

    serverCache.set(cacheKey, { cachedAt: Date.now(), data: stormsReport });

    console.log(
      `[Storms] Detected ${stormsReport.storms.length} storms, ${stormsReport.clearDays.length} clear days (${safeDaysAhead}d)`
    );

    return NextResponse.json({ success: true, data: stormsReport });
  } catch (error) {
    console.error("[Storms] Error detecting storms:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
