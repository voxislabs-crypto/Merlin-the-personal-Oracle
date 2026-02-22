// API Route: Soul Reading - Generate narrative interpretation of birth chart
import { NextRequest, NextResponse } from "next/server";
import { BirthChartData } from "@/types/astrology";
import { generateSoulReading } from "@/lib/soul/natal-voice";
import { awardBadges } from "@/lib/soul/badges";
import { validateFeatureAccess } from '@/lib/subscription-validation';

export async function POST(request: NextRequest) {
  // Check subscription tier
  const hasAccess = await validateFeatureAccess('canAccessSoulReading');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Soul Readings are not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }
  
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
