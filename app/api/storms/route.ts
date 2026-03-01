// API Route: Storms & Navigations
// Detects challenging astrological transits over the next 7 days
// and generates personalised MBTI-aware navigation advice
import { NextResponse } from "next/server";
import { calculateBirthChart } from "@/lib/engine";
import { calculateBirthChart as calculateBirthChartFallback } from "@/lib/engine-fallback";
import { detectWeeklyStorms } from "@/lib/astrology/storms";
import { BirthChartData } from "@/types/astrology";
import { MBTIType } from "@/shared/schema";

export async function POST(request: Request) {
  console.log("[Storms] Received request for weekly storm forecast");

  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon, mbtiType } = body;

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

    // Run storm detection
    const stormsReport = detectWeeklyStorms(natalChart, mbtiType as MBTIType | undefined);

    console.log(
      `[Storms] Detected ${stormsReport.storms.length} storms, ${stormsReport.clearDays.length} clear days`
    );

    return NextResponse.json({ success: true, data: stormsReport });
  } catch (error) {
    console.error("[Storms] Error detecting storms:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
