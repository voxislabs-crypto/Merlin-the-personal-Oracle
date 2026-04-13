import { describe, expect, it } from "vitest";
import { shouldExtractPreferencesWithCooldown } from "../services/preferencesService.js";

describe("shouldExtractPreferencesWithCooldown", () => {
  it("blocks when no emotional signal is present", () => {
    const result = shouldExtractPreferencesWithCooldown({
      userMessage: "Tell me the weather.",
      assistantReply: "It is clear today.",
      moodDelta: { valence: 0.01, arousal: 0.02 },
      currentTurn: 20,
      minIntervalMs: 45_000,
      minTurns: 3,
      nowMs: 1_000_000,
    });

    expect(result.shouldExtract).toBe(false);
    expect(result.signalTriggered).toBe(false);
    expect(result.reason).toBe("no_emotional_signal");
  });

  it("allows extraction when signal exists and cooldown is satisfied", () => {
    const result = shouldExtractPreferencesWithCooldown({
      userMessage: "I love this.",
      assistantReply: "That is amazing.",
      moodDelta: { valence: 0.26, arousal: 0.62 },
      lastExtractionAtMs: 100_000,
      lastExtractionTurn: 10,
      currentTurn: 20,
      minIntervalMs: 45_000,
      minTurns: 3,
      nowMs: 200_000,
    });

    expect(result.shouldExtract).toBe(true);
    expect(result.signalTriggered).toBe(true);
    expect(result.reason).toBe("allowed");
  });

  it("blocks extraction when time cooldown is still active", () => {
    const result = shouldExtractPreferencesWithCooldown({
      userMessage: "I hate this.",
      assistantReply: "You sound upset.",
      moodDelta: { valence: -0.4, arousal: 0.7 },
      lastExtractionAtMs: 190_000,
      lastExtractionTurn: 17,
      currentTurn: 22,
      minIntervalMs: 45_000,
      minTurns: 3,
      nowMs: 200_000,
    });

    expect(result.shouldExtract).toBe(false);
    expect(result.signalTriggered).toBe(true);
    expect(result.reason).toBe("cooldown_ms");
    expect(result.cooldownRemainingMs).toBeGreaterThan(0);
  });

  it("blocks extraction when turn cooldown is still active", () => {
    const result = shouldExtractPreferencesWithCooldown({
      userMessage: "I absolutely adore this.",
      assistantReply: "That means a lot.",
      moodDelta: { valence: 0.3, arousal: 0.4 },
      lastExtractionAtMs: 100_000,
      lastExtractionTurn: 19,
      currentTurn: 20,
      minIntervalMs: 1_000,
      minTurns: 3,
      nowMs: 200_000,
    });

    expect(result.shouldExtract).toBe(false);
    expect(result.signalTriggered).toBe(true);
    expect(result.reason).toBe("cooldown_turns");
    expect(result.cooldownRemainingTurns).toBeGreaterThan(0);
  });
});
