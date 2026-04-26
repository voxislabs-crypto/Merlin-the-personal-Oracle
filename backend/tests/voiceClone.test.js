import { describe, it, expect, vi, beforeEach } from "vitest";

// ── deriveMoodVoiceParams ────────────────────────────────────────────────────

describe("deriveMoodVoiceParams", () => {
  let deriveMoodVoiceParams;

  beforeEach(async () => {
    // Import lazily so mocks for sibling services don't interfere
    vi.resetModules();
    // Stub heavy ttsService dependencies
    vi.doMock("../services/openVoiceAdapter.js", () => ({ synthesizeOpenVoice: vi.fn(), isOpenVoiceInstalled: vi.fn(() => false), hasReference: vi.fn(() => false) }));
    vi.doMock("../services/rvcAdapter.js", () => ({ convertWithRvc: vi.fn(), isRvcInstalled: vi.fn(() => false), resolveModelPath: vi.fn() }));
    vi.doMock("../models/voiceCloneModel.js", () => ({ getPersonalityCloneMeta: vi.fn(() => null) }));
    vi.doMock("../services/kokoroService.js", () => ({ synthesizeKokoro: vi.fn(), getKokoroVoices: vi.fn(() => []) }));
    vi.doMock("../services/piperService.js", () => ({ synthesizePiper: vi.fn(), listPiperVoices: vi.fn(() => []) }));
    const mod = await import("../services/ttsService.js");
    deriveMoodVoiceParams = mod.deriveMoodVoiceParams;
  });

  it("returns rate=1 and pitchShift=0 for neutral mood with no prosody envelope", () => {
    const result = deriveMoodVoiceParams({}, {});
    expect(result.rate).toBe(1);
    expect(result.pitchShift).toBe(0);
  });

  it("high arousal nudges rate upward from baseline", () => {
    const result = deriveMoodVoiceParams({ arousal: 1 }, { targetRate: 1 });
    expect(result.rate).toBeCloseTo(1.15, 2);
  });

  it("low arousal nudges rate downward from baseline", () => {
    const result = deriveMoodVoiceParams({ arousal: -1 }, { targetRate: 1 });
    expect(result.rate).toBeCloseTo(0.85, 2);
  });

  it("clamps rate to [0.7, 1.3]", () => {
    // extreme arousal + high base rate should still cap at 1.3
    expect(deriveMoodVoiceParams({ arousal: 1 }, { targetRate: 1.3 }).rate).toBe(1.3);
    expect(deriveMoodVoiceParams({ arousal: -1 }, { targetRate: 0.7 }).rate).toBe(0.7);
  });

  it("positive valence with high dominance yields positive pitchShift", () => {
    const { pitchShift } = deriveMoodVoiceParams({ valence: 1, dominance: 1 }, {});
    expect(pitchShift).toBeGreaterThan(0);
    expect(pitchShift).toBeLessThanOrEqual(3);
  });

  it("negative valence with high dominance yields negative pitchShift", () => {
    const { pitchShift } = deriveMoodVoiceParams({ valence: -1, dominance: 1 }, {});
    expect(pitchShift).toBeLessThan(0);
    expect(pitchShift).toBeGreaterThanOrEqual(-3);
  });

  it("clamps pitchShift to [-3, 3]", () => {
    // extreme values cannot exceed bounds
    const high = deriveMoodVoiceParams({ valence: 1, dominance: 1 }, {}).pitchShift;
    const low = deriveMoodVoiceParams({ valence: -1, dominance: 1 }, {}).pitchShift;
    expect(high).toBeLessThanOrEqual(3);
    expect(low).toBeGreaterThanOrEqual(-3);
  });

  it("handles missing/undefined mood fields gracefully", () => {
    expect(() => deriveMoodVoiceParams({ valence: null }, {})).not.toThrow();
    expect(() => deriveMoodVoiceParams(undefined, undefined)).not.toThrow();
  });
});

// ── voiceCloneModel round-trip ───────────────────────────────────────────────

describe("voiceCloneModel — personality clone meta round-trip", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("stores and retrieves clone meta for a personality", async () => {
    const { getPersonalityCloneMeta, setPersonalityCloneMeta, clearPersonalityCloneMeta } =
      await import("../models/voiceCloneModel.js");

    const testId = 99999;
    const meta = {
      cloneEngine: "openvoice",
      cloneReferenceClipPath: "/tmp/test-ref.wav",
      cloneRvcPackId: null,
    };

    setPersonalityCloneMeta(testId, meta);
    const retrieved = getPersonalityCloneMeta(testId);
    expect(retrieved).not.toBeNull();
    expect(retrieved.cloneEngine).toBe("openvoice");
    expect(retrieved.cloneReferenceClipPath).toBe("/tmp/test-ref.wav");

    clearPersonalityCloneMeta(testId);
    const afterClear = getPersonalityCloneMeta(testId);
    expect(afterClear?.cloneEngine ?? null).toBeNull();
    expect(afterClear?.cloneReferenceClipPath ?? null).toBeNull();
  });
});

// ── openvoice runEngine path ─────────────────────────────────────────────────

describe("generateSpeechAudio — openvoice engine", () => {
  it("calls synthesizeOpenVoice with text and personality id", async () => {
    vi.resetModules();

    const fakeWav = Buffer.from("RIFF....WAVE");
    const synthesizeOpenVoice = vi.fn().mockResolvedValue(fakeWav);
    vi.doMock("../services/openVoiceAdapter.js", () => ({
      synthesizeOpenVoice,
      isOpenVoiceInstalled: vi.fn(() => true),
      hasReference: vi.fn(() => true),
    }));
    vi.doMock("../services/rvcAdapter.js", () => ({ convertWithRvc: vi.fn(), isRvcInstalled: vi.fn(() => false), resolveModelPath: vi.fn() }));
    vi.doMock("../models/voiceCloneModel.js", () => ({ getPersonalityCloneMeta: vi.fn(() => null) }));
    vi.doMock("../services/kokoroService.js", () => ({ synthesizeKokoro: vi.fn(), getKokoroVoices: vi.fn(() => []) }));
    vi.doMock("../services/piperService.js", () => ({ synthesizePiper: vi.fn(), listPiperVoices: vi.fn(() => []) }));

    const { generateSpeechAudio } = await import("../services/ttsService.js");

    const result = await generateSpeechAudio({
      text: "Hello from OpenVoice",
      personality: { id: 42, name: "TestBot", moodState: { valence: 0.5, arousal: 0.2, dominance: 0 } },
      voiceProfile: { engine: "openvoice" },
    });

    expect(synthesizeOpenVoice).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Hello from OpenVoice", personalityId: 42 }),
    );
    expect(result.audioBuffer).toBe(fakeWav);
  });
});

// ── kokoro-rvc graceful fallback ─────────────────────────────────────────────

describe("generateSpeechAudio — kokoro-rvc fallback when no pack configured", () => {
  it("returns raw kokoro audio and sets rvcSkipped=true when no packId", async () => {
    vi.resetModules();

    const kokoroWav = Buffer.from("RIFF....WAVE-kokoro");
    const synthesizeKokoro = vi.fn().mockResolvedValue(kokoroWav);
    const convertWithRvc = vi.fn();

    vi.doMock("../services/kokoroService.js", () => ({ synthesizeKokoro, getKokoroVoices: vi.fn(() => []) }));
    vi.doMock("../services/rvcAdapter.js", () => ({ convertWithRvc, isRvcInstalled: vi.fn(() => true), resolveModelPath: vi.fn() }));
    vi.doMock("../models/voiceCloneModel.js", () => ({
      // No packId configured — should trigger skip
      getPersonalityCloneMeta: vi.fn(() => ({ cloneEngine: "kokoro-rvc", cloneRvcPackId: null })),
    }));
    vi.doMock("../services/openVoiceAdapter.js", () => ({ synthesizeOpenVoice: vi.fn(), isOpenVoiceInstalled: vi.fn(() => false), hasReference: vi.fn(() => false) }));
    vi.doMock("../services/piperService.js", () => ({ synthesizePiper: vi.fn(), listPiperVoices: vi.fn(() => []) }));

    const { generateSpeechAudio } = await import("../services/ttsService.js");

    const result = await generateSpeechAudio({
      text: "Hello from Kokoro",
      personality: { id: 7, name: "TestBot", moodState: { valence: 0, arousal: 0, dominance: 0 } },
      voiceProfile: { engine: "kokoro-rvc", voice: "af_heart" },
    });

    expect(convertWithRvc).not.toHaveBeenCalled();
    expect(result.audioBuffer).toBe(kokoroWav);
    expect(result.rvcSkipped).toBe(true);
  });
});
