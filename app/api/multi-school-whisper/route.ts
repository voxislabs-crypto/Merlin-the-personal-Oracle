// API Route: Multi-School Whisper - Consensus across three astrology systems
import { NextRequest, NextResponse } from "next/server";
import { BirthChartData } from "@/types/astrology";
import { getMultiSchoolWhisper, getDetailedMultiSchoolReading } from "@/lib/schools/multi-whisper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chartData, transits, date } = body as {
      chartData: BirthChartData;
      transits?: any[];
      date?: string;
    };

    if (!chartData || !chartData.positions) {
      return NextResponse.json(
        { success: false, error: "Chart data is required" },
        { status: 400 }
      );
    }

    // Use current date if not provided
    const targetDate = date ? new Date(date) : new Date();
    const transitData = transits || [];

    console.log("Generating multi-school whisper...");

    // Get multi-school reading
    const whisper = getMultiSchoolWhisper(chartData, transitData, targetDate);
    const detailedReading = getDetailedMultiSchoolReading(chartData, transitData, targetDate);

    return NextResponse.json({
      success: true,
      data: {
        ...whisper,
        detailedReading,
      },
    });
  } catch (error) {
    console.error("Multi-school whisper error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate multi-school whisper",
      },
      { status: 500 }
    );
  }
}
