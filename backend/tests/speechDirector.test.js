import { describe, expect, it } from "vitest";

import { buildSpeechPacket, stylizeSpeech } from "../services/speechDirector.js";

describe("speechDirector stylizeSpeech", () => {
  it("keeps neutral text readable and unchanged for neutral profiles", () => {
    const result = stylizeSpeech("We should review the deployment plan.", {
      traits: ["analytical"],
      moodState: { arousal: 0, dominance: 0 },
      expressionStyle: { energy: "medium", sentenceStyle: "balanced", rules: [] },
    });

    expect(result).toBe("We should review the deployment plan.");
  });

  it("injects sarcastic pauses and emphasis for dominant sarcastic personas", () => {
    const result = stylizeSpeech("Yeah, genius, that is exactly what I said.", {
      traits: ["sarcastic", "commanding", "chaotic"],
      behaviorRules: ["Use obvious callouts for emphasis"],
      notablePhrases: [],
      moodState: { arousal: 0.4, dominance: 0.7 },
      expressionStyle: { energy: "high", sentenceStyle: "sharp", rules: ["dry wit"] },
    });

    expect(result).toBe("Yeah... GENIUS... that is EXACTLY what I said.");
  });

  it("converts punctuation to calmer pacing for low arousal profiles", () => {
    const result = stylizeSpeech("I hear you! We can take this slowly.", {
      traits: ["calm"],
      moodState: { arousal: -0.5, dominance: 0 },
      expressionStyle: { energy: "low", sentenceStyle: "measured", rules: [] },
    });

    expect(result).toBe("I hear you... We can take this slowly...");
  });

  it("adds bursty pacing and energetic endings for chaotic high arousal profiles", () => {
    const result = stylizeSpeech("Right, we move now, no delays.", {
      traits: ["chaotic"],
      moodState: { arousal: 0.8, dominance: 0.1 },
      expressionStyle: { energy: "very_high", sentenceStyle: "bursty", rules: [] },
    });

    expect(result).toBe("Right... we move now... no delays!");
  });

  it("allows explicit mood override when provided", () => {
    const result = stylizeSpeech(
      "I understand what you mean.",
      {
        traits: ["analytical"],
        expressionStyle: { energy: "medium", sentenceStyle: "balanced", rules: [] },
      },
      { arousal: -0.6, dominance: 0 },
    );

    expect(result).toBe("I understand what you mean...");
  });

  it("preserves literal hedging and technical phrasing in precision mode", () => {
    const result = stylizeSpeech(
      "Maybe set PORT=3101 and keep the JSON payload unchanged.",
      {
        traits: ["commanding", "sarcastic"],
        moodState: { arousal: 0.8, dominance: 0.7 },
        expressionStyle: { energy: "very_high", sentenceStyle: "sharp", rules: ["dry wit"] },
      },
      null,
      { styleMode: "precision" },
    );

    expect(result).toBe("Maybe set PORT=3101 and keep the JSON payload unchanged.");
  });

  it("suppresses notable phrase append for kokoro tts mode", () => {
    const personality = {
      name: "Injector",
      notablePhrases: ["you call that a plan?"],
      moodState: { arousal: 0.2, dominance: 0.1 },
      expressionStyle: { energy: "medium", sentenceStyle: "balanced", rules: [] },
    };

    let injectedInput = null;
    for (let index = 0; index < 200; index += 1) {
      const candidate = `seed probe ${index}`;
      const withCartesia = stylizeSpeech(candidate, personality, null, { ttsEngine: "cartesia" });
      if (withCartesia.endsWith("you call that a plan?")) {
        injectedInput = candidate;
        break;
      }
    }

    expect(injectedInput).not.toBeNull();

    const withKokoro = stylizeSpeech(injectedInput, personality, null, { ttsEngine: "kokoro" });
    expect(withKokoro).toBe(injectedInput);
  });
});

describe("speechDirector buildSpeechPacket", () => {
  it("returns a structured packet with speech payload", () => {
    const packet = buildSpeechPacket("We should review the deployment plan.", {
      traits: ["analytical"],
      moodState: { arousal: 0, dominance: 0 },
      expressionStyle: { energy: "medium", sentenceStyle: "balanced", rules: [] },
    });

    expect(packet).toMatchObject({
      speech: "We should review the deployment plan.",
      overlays: [],
      sfx: [],
      gestures: [],
      injectedPhrase: null,
      tts: {
        enabled: true,
        priority: "normal",
        channel: "tts",
      },
    });
  });

  it("keeps speech output parity with stylizeSpeech", () => {
    const text = "Right, we move now, no delays.";
    const personality = {
      traits: ["chaotic"],
      moodState: { arousal: 0.8, dominance: 0.1 },
      expressionStyle: { energy: "very_high", sentenceStyle: "bursty", rules: [] },
    };

    const packet = buildSpeechPacket(text, personality, null, { ttsEngine: "kokoro" });
    const legacy = stylizeSpeech(text, personality, null, { ttsEngine: "kokoro" });

    expect(packet.speech).toBe(legacy);
  });

  it("captures injectedPhrase metadata without appending to speech when appendInjectedPhrase=false", () => {
    const personality = {
      name: "Injector",
      notablePhrases: ["you call that a plan?"],
      moodState: { arousal: 0.2, dominance: 0.1 },
      expressionStyle: { energy: "medium", sentenceStyle: "balanced", rules: [] },
    };

    let packetWithInjection = null;
    for (let index = 0; index < 200; index += 1) {
      const candidate = `seed probe ${index}`;
      const packet = buildSpeechPacket(candidate, personality, null, {
        channel: "tts",
        ttsEngine: "cartesia",
        appendInjectedPhrase: false,
      });

      if (packet.injectedPhrase) {
        packetWithInjection = { candidate, packet };
        break;
      }
    }

    expect(packetWithInjection).not.toBeNull();
    expect(packetWithInjection.packet.injectedPhrase).toBe("you call that a plan?");
    expect(packetWithInjection.packet.speech).toBe(packetWithInjection.candidate);
  });
});