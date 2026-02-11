// API Route: Text-to-Speech - Convert readings to audio
import { NextRequest, NextResponse } from "next/server";
import { textToSpeech, TTSRequest, blobToBase64 } from "@/lib/soul/tts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ttsRequest = body as TTSRequest;

    if (!ttsRequest.text || !ttsRequest.voice) {
      return NextResponse.json(
        { success: false, error: "Text and voice are required" },
        { status: 400 }
      );
    }

    console.log(`Generating TTS with ${ttsRequest.voice} voice...`);

    const ttsResponse = await textToSpeech(ttsRequest);

    if (ttsResponse.error) {
      return NextResponse.json(
        { success: false, error: ttsResponse.error },
        { status: 500 }
      );
    }

    // Convert blob to base64 if present
    let audioData: string | undefined;
    if (ttsResponse.audioBlob) {
      audioData = await blobToBase64(ttsResponse.audioBlob);
    } else if (ttsResponse.audioUrl) {
      audioData = ttsResponse.audioUrl;
    }

    return NextResponse.json({
      success: true,
      data: {
        audio: audioData,
        provider: ttsResponse.provider,
      },
    });
  } catch (error) {
    console.error("TTS generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate audio",
      },
      { status: 500 }
    );
  }
}
