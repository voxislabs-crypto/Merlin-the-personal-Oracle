import { NextRequest, NextResponse } from "next/server";
import { calculateBirthChart } from "@/lib/engine-fallback";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon, options } = body;

    if (!birthDate) {
      return NextResponse.json(
        { error: "Birth date is required" },
        { status: 400 }
      );
    }

    const chartData = calculateBirthChart(birthDate, birthTime, lat, lon);

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Chart calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate birth chart" },
      { status: 500 }
    );
  }
}
