// API Route: Progressed Chart - Calculate secondary progressions
import { NextRequest, NextResponse } from "next/server";
import { BirthChartData } from "@/types/astrology";
import { getProgressionInYears } from "@/lib/astrology/progressions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chartData, yearsInFuture } = body as {
      chartData: BirthChartData;
      yearsInFuture: number;
    };

    if (!chartData || !chartData.positions) {
      return NextResponse.json(
        { success: false, error: "Chart data is required" },
        { status: 400 }
      );
    }

    if (yearsInFuture === undefined || yearsInFuture < 0) {
      return NextResponse.json(
        { success: false, error: "Valid yearsInFuture parameter required" },
        { status: 400 }
      );
    }

    console.log(`Calculating progressed chart for +${yearsInFuture} years...`);

    const progressedChart = getProgressionInYears(chartData, yearsInFuture);

    return NextResponse.json({
      success: true,
      data: progressedChart,
    });
  } catch (error) {
    console.error("Progressed chart calculation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate progressed chart",
      },
      { status: 500 }
    );
  }
}
