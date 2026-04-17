import { describe, expect, it } from "vitest";

import { regulateReplyCadence } from "../services/cadenceRegulator.js";

describe("cadenceRegulator", () => {
  it("keeps neutral replies unchanged", () => {
    const result = regulateReplyCadence({
      reply: "Let's review the data and move forward.",
      personality: {
        creativeContext: "default",
        expressionStyle: { energy: "medium" },
      },
      history: [
        { role: "assistant", content: "Got it." },
        { role: "user", content: "continue" },
      ],
      mood: { arousal: 0.1, valence: 0.1 },
    });

    expect(result.adjusted).toBe(false);
    expect(result.text).toBe("Let's review the data and move forward.");
  });

  it("trims repeated notable phrase signoff across recent turns", () => {
    const phrase = "Careful now, you might like where this goes";
    const result = regulateReplyCadence({
      reply: `We'll see. ${phrase}.`,
      personality: {
        notablePhrases: [phrase],
        creativeContext: "narrative_antagonist",
        expressionStyle: {
          energy: "high",
          cadenceRegulator: {
            teasingFrequency: 0.25,
            repetitionPenalty: "strong",
            cooldownTurns: 2,
            windowTurns: 6,
          },
        },
      },
      history: [
        { role: "assistant", content: `Earlier line. ${phrase}.` },
        { role: "user", content: "more" },
      ],
      mood: { arousal: 0.4, valence: -0.1 },
    });

    expect(result.adjusted).toBe(true);
    expect(result.reasons).toContain("repeated_notable_signoff");
    expect(result.text).not.toContain(phrase);
  });

  it("enforces cooldown on provocative closings", () => {
    const result = regulateReplyCadence({
      reply: "You made your point. Careful now, you might like where this goes.",
      personality: {
        creativeContext: "narrative_antagonist",
        expressionStyle: {
          energy: "high",
          cadenceRegulator: {
            teasingFrequency: 0.2,
            repetitionPenalty: "strong",
            cooldownTurns: 2,
            windowTurns: 6,
          },
        },
      },
      history: [
        { role: "assistant", content: "Cute move, darlin'." },
        { role: "assistant", content: "You're already in deep." },
      ],
      mood: { arousal: 0.6, valence: -0.2 },
    });

    expect(result.adjusted).toBe(true);
    expect(result.reasons).toContain("cooldown_enforced");
    expect(result.text).not.toMatch(/you might like where this goes/i);
  });
});
