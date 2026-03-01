// Voice Mode Pipeline - Text-to-Speech for Merlin readings
// Supports ElevenLabs and PlayHT APIs

export type VoiceProvider = "elevenlabs" | "playht";

export type VoiceArchetype =
  | "mentor" // Deep, calm, wise
  | "mystic" // Ethereal, soft, reverent
  | "warrior" // Firm, direct, grounded
  | "sage" // Balanced, warm, knowing
  | "oracle"; // Mystical, authoritative, otherworldly

export interface VoiceConfig {
  provider: VoiceProvider;
  voiceId: string;
  archetype: VoiceArchetype;
  stability?: number; // 0-1 (ElevenLabs)
  similarityBoost?: number; // 0-1 (ElevenLabs)
  speed?: number; // 0.5-2.0 (PlayHT)
}

export interface TTSRequest {
  text: string;
  voice: VoiceArchetype;
  provider?: VoiceProvider;
}

export interface TTSResponse {
  audioUrl?: string;
  audioBlob?: Blob;
  error?: string;
  provider: VoiceProvider;
}

// Backup ElevenLabs voice ID used when no env override and no archetype default
const BACKUP_VOICE_ID = "nPczCjzI2devNBz1zQrb";

// Get custom voice ID from environment (fallback to archetype default, then backup)
const getVoiceId = (defaultVoice: string): string => {
  return process.env.ELEVENLABS_VOICE_ID || defaultVoice || BACKUP_VOICE_ID;
};

// Voice presets for different archetypes
const VOICE_PRESETS: Record<VoiceArchetype, VoiceConfig> = {
  mentor: {
    provider: "elevenlabs",
    voiceId: getVoiceId("pNInz6obpgDQGcFmaJgB"), // Custom or Adam (deep male voice)
    archetype: "mentor",
    stability: 0.75,
    similarityBoost: 0.75,
  },
  mystic: {
    provider: "elevenlabs",
    voiceId: getVoiceId("EXAVITQu4vr4xnSDxMaL"), // Custom or Bella (soft female voice)
    archetype: "mystic",
    stability: 0.5,
    similarityBoost: 0.8,
  },
  warrior: {
    provider: "elevenlabs",
    voiceId: getVoiceId("TxGEqnHWrfWFTfGW9XjX"), // Custom or Josh (firm male voice)
    archetype: "warrior",
    stability: 0.85,
    similarityBoost: 0.7,
  },
  sage: {
    provider: "elevenlabs",
    voiceId: getVoiceId("21m00Tcm4TlvDq8ikWAM"), // Custom or Rachel (balanced female voice)
    archetype: "sage",
    stability: 0.7,
    similarityBoost: 0.75,
  },
  oracle: {
    provider: "elevenlabs",
    voiceId: getVoiceId("EXAVITQu4vr4xnSDxMaL"), // Custom or Bella (mystical female voice)
    archetype: "oracle",
    stability: 0.65,
    similarityBoost: 0.8,
  },
};

// ElevenLabs TTS API call
async function generateWithElevenLabs(
  text: string,
  config: VoiceConfig
): Promise<TTSResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.warn('[ElevenLabs TTS] API key not configured');
    return {
      error: "ElevenLabs API key not configured",
      provider: "elevenlabs",
    };
  }

  try {
    console.log(`[ElevenLabs TTS] Generating audio with voice ID: ${config.voiceId} (archetype: ${config.archetype})`);
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: text.slice(0, 2500), // Limit to 2500 chars for faster generation
          model_id: "eleven_turbo_v2", // MUCH faster than v1 (3-5x speedup)
          voice_settings: {
            stability: config.stability || 0.75,
            similarity_boost: config.similarityBoost || 0.75,
          },
          optimize_streaming_latency: 3, // Max optimization for speed
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ElevenLabs TTS] API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    console.log(`[ElevenLabs TTS] Successfully generated audio (${audioBlob.size} bytes, archetype: ${config.archetype})`);

    return {
      audioBlob,
      provider: "elevenlabs",
    };
  } catch (error) {
    console.error("[ElevenLabs TTS] Error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      provider: "elevenlabs",
    };
  }
}

// PlayHT TTS API call
async function generateWithPlayHT(
  text: string,
  config: VoiceConfig
): Promise<TTSResponse> {
  const apiKey = process.env.PLAYHT_API_KEY;
  const userId = process.env.PLAYHT_USER_ID;

  if (!apiKey || !userId) {
    return {
      error: "PlayHT API credentials not configured",
      provider: "playht",
    };
  }

  try {
    const response = await fetch("https://api.play.ht/api/v2/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice: config.voiceId,
        speed: config.speed || 1.0,
        output_format: "mp3",
      }),
    });

    if (!response.ok) {
      throw new Error(`PlayHT API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      audioUrl: data.url,
      provider: "playht",
    };
  } catch (error) {
    console.error("PlayHT TTS error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      provider: "playht",
    };
  }
}

// Main TTS function
export async function textToSpeech(
  request: TTSRequest
): Promise<TTSResponse> {
  const config = VOICE_PRESETS[request.voice];
  const provider = request.provider || config.provider;

  // Sanitize text (remove markdown, excessive formatting)
  const cleanText = sanitizeTextForTTS(request.text);

  if (provider === "elevenlabs") {
    return generateWithElevenLabs(cleanText, config);
  } else if (provider === "playht") {
    return generateWithPlayHT(cleanText, config);
  } else {
    return {
      error: `Unsupported provider: ${provider}`,
      provider,
    };
  }
}

// Sanitize text for TTS (remove markdown, etc.)
function sanitizeTextForTTS(text: string): string {
  return (
    text
      // Remove markdown bold/italic
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      // Remove markdown headers
      .replace(/^#+\s+/gm, "")
      // Remove line breaks (replace with space)
      .replace(/\n+/g, " ")
      // Remove extra spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Get voice archetype based on content theme
export function chooseVoiceForTheme(theme: string): VoiceArchetype {
  const themeVoiceMap: Record<string, VoiceArchetype> = {
    Career: "warrior",
    Relationships: "sage",
    Transformation: "mystic",
    Spirituality: "mystic",
    "Home & Family": "sage",
    "Mental Focus": "mentor",
    Opportunities: "warrior",
    "Trial by Fire": "warrior",
  };

  return themeVoiceMap[theme] || "mentor";
}

// Convert audio blob to base64 (works on both client and server)
export async function blobToBase64(blob: Blob): Promise<string> {
  // Server-side: use Buffer
  if (typeof FileReader === 'undefined') {
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:audio/mpeg;base64,${base64}`;
  }
  
  // Client-side: use FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Client-side audio player helper
export function createAudioPlayer(audioSrc: string): HTMLAudioElement {
  const audio = new Audio(audioSrc);
  audio.preload = "auto";
  return audio;
}

// Estimate reading time (for UI feedback)
export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 150; // Average speaking rate
  const words = text.split(/\s+/).length;
  return Math.ceil((words / wordsPerMinute) * 60); // Return seconds
}

// Check if TTS is configured
export function isTTSConfigured(provider?: VoiceProvider): boolean {
  if (!provider || provider === "elevenlabs") {
    return !!process.env.ELEVENLABS_API_KEY;
  }

  if (provider === "playht") {
    return !!(process.env.PLAYHT_API_KEY && process.env.PLAYHT_USER_ID);
  }

  return false;
}

// Format text for better TTS pacing (add pauses)
export function formatTextForSpeech(text: string): string {
  return (
    text
      // Add pause after sentences
      .replace(/\.\s+/g, ". ... ")
      // Add pause after colons
      .replace(/:\s+/g, ": ... ")
      // Add pause after em-dashes
      .replace(/—\s+/g, "— ... ")
      .trim()
  );
}

// Helper: Get all available voice archetypes
export function getAvailableVoices(): Array<{
  archetype: VoiceArchetype;
  description: string;
}> {
  return [
    { archetype: "mentor", description: "Deep, calm, wise — like a trusted guide" },
    { archetype: "mystic", description: "Ethereal, soft, reverent — for spiritual wisdom" },
    { archetype: "warrior", description: "Firm, direct, grounded — for action and strength" },
    { archetype: "sage", description: "Balanced, warm, knowing — for life wisdom" },
  ];
}
