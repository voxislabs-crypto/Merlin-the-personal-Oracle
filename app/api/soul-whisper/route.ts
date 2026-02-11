// API Route: Soul Whisper - Personalized guidance
import { NextRequest, NextResponse } from "next/server";
import { getSoulWhisper, WhisperContext } from "@/lib/soul/whisper-library";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = body as WhisperContext;

    if (context.age === undefined || !context.theme) {
      return NextResponse.json(
        { success: false, error: "Age and theme are required" },
        { status: 400 }
      );
    }

    console.log("Generating soul whisper...");

    const whisper = getSoulWhisper(context);

    return NextResponse.json({
      success: true,
      data: whisper,
    });
  } catch (error) {
    console.error("Soul whisper generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate soul whisper",
      },
      { status: 500 }
    );
  }
}
