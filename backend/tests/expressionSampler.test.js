import { describe, expect, it } from "vitest";
import { applyBoundedExpressionSampling } from "../services/expressionSampler.js";

describe("expressionSampler", () => {
  const baseConfig = {
    enabled: true,
    deterministicSeed: true,
    modeProfiles: {
      kids: { enabled: true, topK: 2, temperature: 0.3, maxReplacements: 1 },
      scientist: { enabled: false, topK: 1, temperature: 0.1, maxReplacements: 0 },
      normal: { enabled: true, topK: 3, temperature: 0.6, maxReplacements: 2 },
    },
  };

  it("keeps output deterministic when deterministicSeed is enabled", () => {
    const input = "I understand. Thank you. Let's continue.";
    const a = applyBoundedExpressionSampling(input, {
      config: baseConfig,
      mode: "normal",
      seedInput: "same-seed",
      mood: { valence: 0.1, arousal: 0.2, dominance: 0.1 },
      emotionSignal: "neutral",
    });
    const b = applyBoundedExpressionSampling(input, {
      config: baseConfig,
      mode: "normal",
      seedInput: "same-seed",
      mood: { valence: 0.1, arousal: 0.2, dominance: 0.1 },
      emotionSignal: "neutral",
    });

    expect(a.text).toBe(b.text);
    expect(a.seed).toBe(b.seed);
  });

  it("does not apply sampling when mode profile is disabled", () => {
    const input = "I understand your point.";
    const result = applyBoundedExpressionSampling(input, {
      config: baseConfig,
      mode: "scientist",
      seedInput: "seed",
      mood: { valence: 0, arousal: 0, dominance: 0 },
      emotionSignal: "neutral",
    });

    expect(result.applied).toBe(false);
    expect(result.reason).toBe("mode_disabled");
    expect(result.text).toBe(input);
  });

  it("returns trace metadata for applied replacements", () => {
    const input = "I understand. Thank you.";
    const result = applyBoundedExpressionSampling(input, {
      config: baseConfig,
      mode: "normal",
      seedInput: "trace-seed",
      mood: { valence: 0.3, arousal: 0.5, dominance: 0.2 },
      emotionSignal: "praise",
    });

    if (result.applied) {
      expect(result.replacements.length).toBeGreaterThan(0);
      expect(result.replacements[0]).toEqual(
        expect.objectContaining({
          bucket: expect.any(String),
          from: expect.any(String),
          to: expect.any(String),
          candidates: expect.any(Array),
        }),
      );
    } else {
      expect(result.reason).toBe("no_match");
    }
  });
});
