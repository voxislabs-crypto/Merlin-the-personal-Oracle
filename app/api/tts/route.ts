// API Route: Text-to-Speech - Convert readings to audio
// Supports caching via client-side localStorage to prevent API credit waste
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { textToSpeech, TTSRequest, blobToBase64 } from "@/lib/soul/tts";

interface CachedTtsPayload {
  audio: string;
  provider: string;
  cachedAt: number;
}

const TTS_CACHE_DIR = process.env.TTS_CACHE_DIR || path.join(process.cwd(), ".cache", "tts");
const TTS_CACHE_TTL_MS = Number(process.env.TTS_CACHE_TTL_MS || 30 * 24 * 60 * 60 * 1000);

function normalizeTextForCache(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function buildTtsCacheKey(request: TTSRequest): string {
  const normalized = normalizeTextForCache(request.text);
  const provider = request.provider || "elevenlabs";
  return createHash("sha256").update(`${provider}:${request.voice}:${normalized}`).digest("hex");
}

async function readTtsCache(cacheKey: string): Promise<CachedTtsPayload | null> {
  try {
    const filePath = path.join(TTS_CACHE_DIR, `${cacheKey}.json`);
    const [fileStats, raw] = await Promise.all([
      stat(filePath),
      readFile(filePath, "utf8"),
    ]);

    if (Date.now() - fileStats.mtimeMs > TTS_CACHE_TTL_MS) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedTtsPayload;
    if (!parsed?.audio || !parsed?.provider) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function writeTtsCache(cacheKey: string, payload: CachedTtsPayload): Promise<void> {
  try {
    await mkdir(TTS_CACHE_DIR, { recursive: true });
    const filePath = path.join(TTS_CACHE_DIR, `${cacheKey}.json`);
    await writeFile(filePath, JSON.stringify(payload), "utf8");
  } catch (error) {
    console.warn("[TTS] Failed writing cache entry:", error);
  }
}

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

    const cacheKey = buildTtsCacheKey(ttsRequest);
    const cached = await readTtsCache(cacheKey);
    if (cached) {
      console.log(`[TTS] Cache hit for ${ttsRequest.voice} (${cached.provider})`);
      return NextResponse.json(
        {
          success: true,
          cached: true,
          data: {
            audio: cached.audio,
            provider: cached.provider,
          },
        },
        {
          headers: {
            "X-Audio-Cache": "HIT",
          },
        },
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

    if (!audioData) {
      return NextResponse.json(
        { success: false, error: "No audio generated" },
        { status: 500 },
      );
    }

    await writeTtsCache(cacheKey, {
      audio: audioData,
      provider: ttsResponse.provider,
      cachedAt: Date.now(),
    });

    console.log(`[TTS] Successfully generated audio (${audioData?.length || 0} bytes)`);

    return NextResponse.json(
      {
        success: true,
        cached: false,
        data: {
          audio: audioData,
          provider: ttsResponse.provider,
        },
      },
      {
        headers: {
          "X-Audio-Cache": "MISS",
          "Cache-Control": "no-cache",
        },
      },
    );
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
