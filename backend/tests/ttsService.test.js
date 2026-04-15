import os from "node:os";
import path from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

function createTestWav(sampleCount = 8, sampleRate = 16000) {
  const pcm = Buffer.alloc(sampleCount * 2);
  for (let index = 0; index < sampleCount; index += 1) {
    pcm.writeInt16LE(index * 200, index * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

describe("ttsService Piper voice discovery", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "voxis-piper-voices-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("lists local Piper voices and speaker metadata from discovered models", async () => {
    const modelPath = path.join(tempDir, "en_US-lessac-medium.onnx");
    await writeFile(modelPath, "fake-model");
    await writeFile(
      `${modelPath}.json`,
      JSON.stringify({
        speaker_id_map: {
          default: 0,
          bright: 1,
        },
      }),
    );

    const { listPiperVoiceOptions } = await import("../services/ttsService.js");
    const result = await listPiperVoiceOptions({ searchDirs: [tempDir] });

    expect(result.voices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "en_US-lessac-medium",
          path: modelPath,
          speakerCount: 2,
          speakers: [
            { id: 0, label: "default" },
            { id: 1, label: "bright" },
          ],
        }),
      ]),
    );
  });

  it("prepares directed text and mood-adjusted voice settings for synthesis", async () => {
    const { prepareSpeechSynthesis } = await import("../services/ttsService.js");

    const result = prepareSpeechSynthesis({
      personality: {
        traits: ["sarcastic", "commanding", "chaotic"],
        behaviorRules: ["Use obvious callouts for emphasis"],
        notablePhrases: [],
        moodState: { arousal: 0.8, dominance: 0.7 },
        expressionStyle: { energy: "high", sentenceStyle: "sharp", rules: ["dry wit"] },
      },
      text: "Yeah, genius, that is exactly what I said.",
      voiceProfile: { rate: 1, pitch: 1 },
      speechHint: "rapid and sharp delivery",
    });

    expect(result.directedText).toContain("GENIUS");
    expect(result.directedText.endsWith("!")).toBe(true);
    expect(result.adjustedVoiceProfile.rate).toBeGreaterThan(1);
    expect(result.adjustedVoiceProfile.pitch).toBeLessThan(1);
    expect(result.prosodyEnvelope).toEqual(
      expect.objectContaining({
        phrasing: expect.any(String),
        intensity: expect.any(Number),
        confidence: expect.any(Number),
      }),
    );
  });

  it("classifies technical turns as precision contexts for TTS stylization", async () => {
    const { prepareSpeechSynthesis } = await import("../services/ttsService.js");

    const result = prepareSpeechSynthesis({
      personality: {
        traits: ["sarcastic", "commanding"],
        moodState: { arousal: 0.8, dominance: 0.7 },
        expressionStyle: { energy: "very_high", sentenceStyle: "sharp", rules: ["dry wit"] },
      },
      text: "Maybe set PORT=3101 and keep the JSON payload unchanged.",
      voiceProfile: { rate: 1, pitch: 1 },
      speechHint: "deployment instructions",
    });

    expect(result.speechContext).toEqual(
      expect.objectContaining({
        category: "precision",
        styleMode: "precision",
      }),
    );
    expect(result.directedText).toBe("Maybe set PORT=3101 and keep the JSON payload unchanged.");
    expect(result.prosodyEnvelope.emphasis.count).toBe(0);
  });

  it("builds identity-preserving fallback voices for Kokoro and cloud", async () => {
    const { buildFallbackVoiceProfile, getEngineCapabilities } = await import("../services/ttsService.js");

    const personality = { speechStyle: "measured and clear" };
    const baseProfile = {
      preferredVoice: "deep mentor",
      selectedVoiceLabel: "baritone",
      selectedVoiceSample: { voiceLabel: "baritone", voiceBand: "low", voiceQuality: "clear" },
    };

    const kokoroProfile = buildFallbackVoiceProfile("kokoro", baseProfile, personality);
    const cloudProfile = buildFallbackVoiceProfile("cloud", baseProfile, personality);

    expect(kokoroProfile.kokoroVoice).toBe("am_onyx");
    expect(cloudProfile.providerVoice).toBe("onyx");
    expect(getEngineCapabilities("piper")).toEqual(
      expect.objectContaining({
        textShaping: true,
        nativeControls: expect.arrayContaining(["lengthScale"]),
      }),
    );
  });

  it("plans piper chunked synthesis with pause shaping", async () => {
    const { planPiperChunkSynthesis } = await import("../services/ttsService.js");

    const result = planPiperChunkSynthesis("Hey there. This might actually work! Keep going?", {
      moodArousal: 0.2,
    });

    expect(result).toHaveLength(3);
    expect(result[0].text).toBe("Hey there.");
    expect(result[0].pauseMs).toBeGreaterThan(0);
    expect(result[2].pauseMs).toBe(0);
  });

  it("concatenates wav buffers with inserted silence", async () => {
    const { concatenateWavBuffers } = await import("../services/ttsService.js");

    const first = createTestWav(8, 16000);
    const second = createTestWav(4, 16000);
    const combined = concatenateWavBuffers([first, second], [250, 0]);

    expect(combined.toString("ascii", 0, 4)).toBe("RIFF");
    expect(combined.toString("ascii", 8, 12)).toBe("WAVE");
    const dataSize = combined.readUInt32LE(40);
    expect(dataSize).toBe(16 + 8000 + 8);
  });

  it("reports forced piper routing diagnostics with debug lock metadata", async () => {
    const previousEngine = process.env.TTS_ENGINE;
    const previousModelPath = process.env.PIPER_MODEL_PATH;
    const previousSpeaker = process.env.PIPER_SPEAKER;
    const previousTimeout = process.env.PIPER_TIMEOUT_MS;

    process.env.TTS_ENGINE = "piper";
    process.env.PIPER_MODEL_PATH = "/opt/piper/models/en_US-lessac-medium.onnx";
    process.env.PIPER_SPEAKER = "1";
    process.env.PIPER_TIMEOUT_MS = "120000";

    try {
      const { getTtsHealthStatus } = await import("../services/ttsService.js");
      const result = await getTtsHealthStatus();

      expect(result.routing).toEqual(
        expect.objectContaining({
          envEngine: "piper",
          requestedEngine: "piper",
        }),
      );

      expect(result.engines.piper).toEqual(
        expect.objectContaining({
          available: false,
          disabledByDebugLock: true,
          command: "piper",
          modelPathConfigured: true,
          modelPath: "/opt/piper/models/en_US-lessac-medium.onnx",
          speakerConfigured: true,
          timeoutMs: 120000,
        }),
      );
    } finally {
      if (previousEngine === undefined) delete process.env.TTS_ENGINE;
      else process.env.TTS_ENGINE = previousEngine;

      if (previousModelPath === undefined) delete process.env.PIPER_MODEL_PATH;
      else process.env.PIPER_MODEL_PATH = previousModelPath;

      if (previousSpeaker === undefined) delete process.env.PIPER_SPEAKER;
      else process.env.PIPER_SPEAKER = previousSpeaker;

      if (previousTimeout === undefined) delete process.env.PIPER_TIMEOUT_MS;
      else process.env.PIPER_TIMEOUT_MS = previousTimeout;
    }
  });

  it("uses providerVoice as a Cartesia voice fallback when chat state omits cartesiaVoiceId", async () => {
    const previousApiKey = process.env.CARTESIA_API_KEY;
    const previousEngine = process.env.TTS_ENGINE;
    const originalFetch = global.fetch;
    const fetchCalls = [];

    process.env.CARTESIA_API_KEY = "test-cartesia-key";
    process.env.TTS_ENGINE = "cartesia";

    global.fetch = async (url, options = {}) => {
      fetchCalls.push({ url, options });
      return {
        ok: true,
        headers: new Headers({ "content-type": "audio/mpeg" }),
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      };
    };

    try {
      const { generateSpeechAudio } = await import("../services/ttsService.js");
      const result = await generateSpeechAudio({
        personality: {
          name: "Cartesia Persona",
          moodState: { arousal: 0.1, dominance: 0.2 },
          expressionStyle: { energy: "medium", sentenceStyle: "balanced", rules: [] },
        },
        text: "Keep the pacing deliberate.",
        voiceProfile: {
          engine: "cartesia",
          providerVoice: "voice-from-provider-field",
          cartesiaVoiceId: "",
          cartesiaModel: "sonic-2",
          rate: 1,
          pitch: 1,
        },
      });

      expect(result.engine).toBe("cartesia");
      expect(fetchCalls).toHaveLength(1);

      const payload = JSON.parse(String(fetchCalls[0].options?.body || "{}"));
      expect(payload.voice).toEqual({ mode: "id", id: "voice-from-provider-field" });
      expect(payload.model_id).toBe("sonic-2");
    } finally {
      global.fetch = originalFetch;

      if (previousApiKey === undefined) delete process.env.CARTESIA_API_KEY;
      else process.env.CARTESIA_API_KEY = previousApiKey;

      if (previousEngine === undefined) delete process.env.TTS_ENGINE;
      else process.env.TTS_ENGINE = previousEngine;
    }
  });
});
