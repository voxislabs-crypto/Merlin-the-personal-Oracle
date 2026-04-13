import { describe, expect, it } from "vitest";

import { shapeForKokoro } from "../services/kokoroShaper.js";

describe("kokoroShaper", () => {
  it("applies bursty phrasing and emphasis words", () => {
    const result = shapeForKokoro("Really, we should plan this carefully. This is classic.", {
      phrasing: "bursty",
      provider: {
        kokoro: {
          phrasing: "bursty",
          emphasisMode: "ellipses",
          pauseSeconds: 0.35,
        },
      },
      emphasis: {
        words: [{ term: "plan", strength: 0.8 }, { term: "classic", strength: 0.7 }],
      },
    });

    expect(result).toContain("PLAN");
    expect(result).toContain("CLASSIC");
    expect(result).toContain("...");
  });

  it("applies measured pacing and sad mood softening", () => {
    const result = shapeForKokoro("I understand. We proceed carefully.", {
      phrasing: "measured",
      provider: {
        kokoro: {
          phrasing: "measured",
          pauseSeconds: 0.55,
        },
      },
      mood: "sad",
      emphasis: {
        words: [{ term: "carefully", strength: 0.8 }],
      },
    });

    expect(result).toContain("...");
    expect(result).toContain("carefully");
  });

  it("keeps precision-mode text literal", () => {
    const text = "Keep the JSON payload unchanged.";
    const result = shapeForKokoro(text, {
      phrasing: "bursty",
      source: { styleMode: "precision" },
      emphasis: { words: [{ term: "payload", strength: 0.9 }] },
    });

    expect(result).toBe(text);
  });

  it("derives happy mood from mood object", () => {
    const result = shapeForKokoro("we can do this. keep going.", {
      mood: { valence: 0.6, arousal: 0.5 },
      provider: { kokoro: { phrasing: "balanced" } },
    });

    expect(result.includes("....")).toBe(false);
    expect(result.length).toBeGreaterThan(0);
  });
});
