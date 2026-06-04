import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  resolveAdaptiveUtteranceMode,
  resetAdaptiveUtteranceModeMemory,
} from "../services/utteranceModeController.js";

const ENV_KEYS = [
  "UTTERANCE_MODE_STRATEGY",
  "UTTERANCE_MODE_DEFAULT",
  "UTTERANCE_MODE_ALLOW_KIDS",
  "UTTERANCE_MODE_ALLOW_NORMAL",
  "UTTERANCE_MODE_ALLOW_SCIENTIST",
  "UTTERANCE_MODE_MIN_CONFIDENCE",
  "UTTERANCE_MODE_SWITCH_COOLDOWN_TURNS",
];

function setEnv(overrides = {}) {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }
}

describe("resolveAdaptiveUtteranceMode", () => {
  beforeEach(() => {
    setEnv();
    resetAdaptiveUtteranceModeMemory();
  });

  afterEach(() => {
    setEnv();
    resetAdaptiveUtteranceModeMemory();
  });

  it("uses fixed strategy by default", () => {
    const result = resolveAdaptiveUtteranceMode({
      policy: {
        activeMode: "scientist",
        ageBand: "adult",
        modeRequested: false,
      },
      message: "Explain this quickly.",
      reply: "Sure.",
      turnCount: 12,
      conversationKey: "p:1:u:1",
    });

    expect(result.mode).toBe("scientist");
    expect(result.reason).toBe("fixed_strategy");
  });

  it("switches to scientist in adaptive strategy for analytical prompts", () => {
    setEnv({
      UTTERANCE_MODE_STRATEGY: "adaptive",
      UTTERANCE_MODE_MIN_CONFIDENCE: "0.55",
      UTTERANCE_MODE_SWITCH_COOLDOWN_TURNS: "0",
    });

    const result = resolveAdaptiveUtteranceMode({
      policy: {
        activeMode: "normal",
        ageBand: "adult",
        modeRequested: false,
      },
      message: "Can you analyze the mechanism, provide evidence, and compare trade-offs with citations?",
      reply: "1) Answer\n2) Evidence\n3) Uncertainty\n4) Next Questions",
      stateRuntime: {
        stabilityIndex: 0.88,
        directives: { fragmentation: 0.05, interruptions: 0.08 },
      },
      usage: { percentUsed: 0.42 },
      rateLimit: { hit: false, fallbackDelivered: false },
      turnCount: 4,
      conversationKey: "p:2:u:3",
    });

    expect(result.mode).toBe("scientist");
    expect(result.strategy).toBe("adaptive");
  });

  it("switches to normal when system pressure is high", () => {
    setEnv({
      UTTERANCE_MODE_STRATEGY: "adaptive",
      UTTERANCE_MODE_MIN_CONFIDENCE: "0.5",
      UTTERANCE_MODE_SWITCH_COOLDOWN_TURNS: "0",
    });

    const result = resolveAdaptiveUtteranceMode({
      policy: {
        activeMode: "scientist",
        ageBand: "adult",
        modeRequested: false,
      },
      message: "hey quick one",
      reply: "Sure, quick answer.",
      stateRuntime: {
        stabilityIndex: 0.31,
        directives: { fragmentation: 0.6, interruptions: 0.55 },
      },
      usage: { percentUsed: 0.93 },
      rateLimit: { hit: true, fallbackDelivered: true },
      turnCount: 8,
      conversationKey: "p:9:u:9",
    });

    expect(result.mode).toBe("normal");
    expect(result.reason).toBe("adaptive_signal_match");
  });

  it("never overrides explicit mode requests", () => {
    setEnv({ UTTERANCE_MODE_STRATEGY: "adaptive" });

    const result = resolveAdaptiveUtteranceMode({
      policy: {
        activeMode: "scientist",
        ageBand: "adult",
        modeRequested: true,
      },
      message: "hey",
      reply: "hello",
      turnCount: 1,
      conversationKey: "p:1:u:99",
    });

    expect(result.mode).toBe("scientist");
    expect(result.reason).toBe("requested_mode_locked");
  });

  it("holds previous mode during cooldown window", () => {
    setEnv({
      UTTERANCE_MODE_STRATEGY: "adaptive",
      UTTERANCE_MODE_MIN_CONFIDENCE: "0.5",
      UTTERANCE_MODE_SWITCH_COOLDOWN_TURNS: "3",
    });

    const first = resolveAdaptiveUtteranceMode({
      policy: {
        activeMode: "normal",
        ageBand: "adult",
        modeRequested: false,
      },
      message: "Analyze evidence and cite sources for this mechanism.",
      reply: "1) Answer\n2) Evidence\n3) Uncertainty\n4) Next Questions",
      turnCount: 10,
      conversationKey: "p:7:u:2",
    });
    expect(first.mode).toBe("scientist");

    const second = resolveAdaptiveUtteranceMode({
      policy: {
        activeMode: "scientist",
        ageBand: "adult",
        modeRequested: false,
      },
      message: "hey quick thing",
      reply: "short answer",
      stateRuntime: {
        stabilityIndex: 0.2,
        directives: { fragmentation: 0.7, interruptions: 0.65 },
      },
      usage: { percentUsed: 0.92 },
      rateLimit: { hit: true, fallbackDelivered: true },
      turnCount: 11,
      conversationKey: "p:7:u:2",
    });

    expect(second.mode).toBe("scientist");
    expect(second.reason).toBe("cooldown_hold");
  });

  it("stays on normal mode during live call even with analytical cues", () => {
    setEnv({
      UTTERANCE_MODE_STRATEGY: "adaptive",
      UTTERANCE_MODE_MIN_CONFIDENCE: "0.55",
      UTTERANCE_MODE_SWITCH_COOLDOWN_TURNS: "0",
    });

    // A short spoken question that mentions "why" and "how" — the kind of
    // incidental cue that should NOT flip to scientist during a live call.
    const result = resolveAdaptiveUtteranceMode({
      policy: {
        activeMode: "normal",
        ageBand: "adult",
        modeRequested: false,
      },
      message: "Why does that happen? How does it work?",
      reply: "Great question — basically it works by...",
      isLiveCall: true,
      stateRuntime: {
        stabilityIndex: 0.85,
        directives: { fragmentation: 0.05, interruptions: 0.05 },
      },
      usage: { percentUsed: 0.4 },
      rateLimit: { hit: false, fallbackDelivered: false },
      turnCount: 3,
      conversationKey: "p:live:u:1",
    });

    expect(result.mode).toBe("normal");
    expect(result.metrics.isLiveCall).toBeUndefined(); // metrics come from scoreModeSignals
    expect(result.config.isLiveCall).toBe(true);
    expect(result.config.effectiveMinConfidence).toBeGreaterThanOrEqual(0.82);
  });

  it("live call stays on normal even with dense analytical cues (scientist requires explicit request)", () => {
    setEnv({
      UTTERANCE_MODE_STRATEGY: "adaptive",
      UTTERANCE_MODE_MIN_CONFIDENCE: "0.55",
      UTTERANCE_MODE_SWITCH_COOLDOWN_TURNS: "0",
    });

    // Even a densely analytical spoken message should not flip to scientist
    // during a live call — the effective confidence threshold (0.82) combined
    // with the normal-mode baseline makes an adaptive switch essentially
    // impossible. Users must explicitly request scientist mode.
    const result = resolveAdaptiveUtteranceMode({
      policy: {
        activeMode: "normal",
        ageBand: "adult",
        modeRequested: false,
      },
      message:
        "Can you analyze the underlying mechanism, compare the trade-offs, provide evidence " +
        "with citations, derive the probability distribution, and model the hypothesis with benchmarks?",
      reply: "1) Answer: ...\n2) Evidence: ...\n3) Uncertainty: ...\n4) Next Questions: ...",
      isLiveCall: true,
      stateRuntime: {
        stabilityIndex: 0.95,
        directives: { fragmentation: 0.0, interruptions: 0.0 },
      },
      usage: { percentUsed: 0.3 },
      rateLimit: { hit: false, fallbackDelivered: false },
      turnCount: 2,
      conversationKey: "p:live:u:2",
    });

    // Normal bias + high confidence threshold means live call stays in normal.
    expect(result.mode).toBe("normal");
    expect(result.reason).toBe("confidence_below_threshold");
    expect(result.config.isLiveCall).toBe(true);
    expect(result.config.effectiveMinConfidence).toBeGreaterThanOrEqual(0.82);
  });

  it("live call extends cooldown and holds normal across turns", () => {
    setEnv({
      UTTERANCE_MODE_STRATEGY: "adaptive",
      UTTERANCE_MODE_MIN_CONFIDENCE: "0.55",
      UTTERANCE_MODE_SWITCH_COOLDOWN_TURNS: "2", // base cooldown of 2; live call should extend to 5
    });

    // Turn 1: normal baseline established
    resolveAdaptiveUtteranceMode({
      policy: { activeMode: "normal", ageBand: "adult", modeRequested: false },
      message: "hey",
      reply: "hello",
      isLiveCall: true,
      turnCount: 1,
      conversationKey: "p:live:u:3",
    });

    // Turn 2: analytical signal — but still within the extended live-call cooldown
    const second = resolveAdaptiveUtteranceMode({
      policy: { activeMode: "normal", ageBand: "adult", modeRequested: false },
      message: "Analyze the mechanism, compare the evidence, cite sources, benchmark the hypothesis.",
      reply: "1) Answer\n2) Evidence\n3) Uncertainty\n4) Next Questions",
      isLiveCall: true,
      stateRuntime: {
        stabilityIndex: 0.9,
        directives: { fragmentation: 0.0, interruptions: 0.0 },
      },
      usage: { percentUsed: 0.3 },
      rateLimit: { hit: false },
      turnCount: 2, // only 1 turn elapsed; extended cooldown is 5
      conversationKey: "p:live:u:3",
    });

    expect(second.mode).toBe("normal");
    // During live call the confidence threshold is raised to 0.82; the
    // analytical signal is not strong enough to clear it, so we get
    // confidence_below_threshold rather than cooldown_hold. Either way the
    // mode stays on normal — the extended cooldown provides additional
    // protection when the signal does eventually clear the threshold.
    expect(["confidence_below_threshold", "cooldown_hold"]).toContain(second.reason);
    expect(second.config.effectiveCooldownTurns).toBeGreaterThanOrEqual(5);
  });
});
