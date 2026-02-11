// API Route: Soul Reading - Generate narrative interpretation of birth chart
import { NextRequest, NextResponse } from "next/server";
import { BirthChartData } from "@/types/astrology";
import { generateSoulReading } from "@/lib/soul/natal-voice";
import { awardBadges } from "@/lib/soul/badges";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chartData } = body as { chartData: BirthChartData };

    if (!chartData || !chartData.positions) {
      return NextResponse.json(
        { success: false, error: "Chart data is required" },
        { status: 400 }
      );
    }

    console.log("Generating soul reading for chart...");

    // Generate soul reading
    const soulReading = generateSoulReading(chartData);

    // Award badges
    const badges = awardBadges(chartData);

    const response = {
      success: true,
      data: {
        soulReading,
        badges,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Soul reading generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate soul reading",
      },
      { status: 500 }
    );
  }
}
