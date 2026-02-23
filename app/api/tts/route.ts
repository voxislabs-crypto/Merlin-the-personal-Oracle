// API Route: Text-to-Speech - Convert readings to audio
// Supports caching via client-side localStorage to prevent API credit waste
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

    console.log(`[TTS] Generating audio with ${ttsRequest.voice} voice (provider: ${ttsRequest.provider || 'elevenlabs'})...`);

    // Verify API keys are configured
    if (!process.env.ELEVENLABS_API_KEY) {
      console.warn('[TTS] WARNING: ELEVENLABS_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: "ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY in your environment." },
        { status: 500 }
      );
    }

    const ttsResponse = await textToSpeech(ttsRequest);

    if (ttsResponse.error) {
      console.error(`[TTS] Error: ${ttsResponse.error}`);
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

    console.log(`[TTS] Successfully generated audio (${audioData?.length || 0} bytes)`);

    return NextResponse.json({
      success: true,
      data: {
        audio: audioData,
        provider: ttsResponse.provider,
      },
      // Add cache header hint to client
      headers: {
        'X-Audio-Cacheable': 'true',
        'Cache-Control': 'no-cache', // Don't cache HTTP response, but client can cache audio data
      },
    });
  } catch (error) {
    console.error("[TTS] Generation error:", error);
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
