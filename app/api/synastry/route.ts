// API Route: Synastry - Relationship chart comparison
import { NextRequest, NextResponse } from "next/server";
import { BirthChartData } from "@/types/astrology";
import { generateSynastryReport } from "@/lib/astrology/synastry";
import { validateFeatureAccess } from '@/lib/subscription-validation';

export async function POST(request: NextRequest) {
  // Check subscription tier
  const hasAccess = await validateFeatureAccess('canAccessSynastry');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Synastry Charts are not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }
  
  try {
    const body = await request.json();
    const { chart1, chart2, person1Name, person2Name } = body as {
      chart1: BirthChartData;
      chart2: BirthChartData;
      person1Name?: string;
      person2Name?: string;
    };

    if (!chart1 || !chart1.positions || !chart2 || !chart2.positions) {
      return NextResponse.json(
        { success: false, error: "Two complete charts are required" },
        { status: 400 }
      );
    }

    console.log("Generating synastry report...");

    const synastryReport = generateSynastryReport(
      chart1,
      chart2,
      person1Name,
      person2Name
    );

    return NextResponse.json({
      success: true,
      data: synastryReport,
    });
  } catch (error) {
    console.error("Synastry generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate synastry report",
      },
      { status: 500 }
    );
  }
}
