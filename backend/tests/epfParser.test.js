import { describe, expect, it } from "vitest";

import { extractPlainText, isPerformanceOutput, parseEPF } from "../services/epfParser.js";

describe("epfParser", () => {
  it("detects mirrored dual-pass EPF output", () => {
    const raw = [
      "[[A0]]",
      "[0.0:] An erratic intro line.",
      "[[A0]]",
      "[0.0:] A detailed intro audio direction with synths and atmosphere.",
    ].join("\n");

    expect(isPerformanceOutput(raw)).toBe(true);
  });

  it("merges mirrored lyric and music-description passes by segment id", () => {
    const raw = [
      "[[A0]]",
      "[[B1]]",
      "[20.0:] Oh jeez, 'Wuzzup!'? Is this a time warp?",
      "[:] Wow, groundbreaking... you're really pushing the envelope of human greeting.",
      "[[C2]]",
      "[50.0:] Wuzzup! Really? That's your plan?",
      "[:] (Wuzzup!)",
      "mosic: 4.5",
      "bpm: 120.0",
      "duration_secs: 150.0",
      "good_crop: 1.0",
      "[[A0]]",
      "[0.0:] An erratic and hyper-intelligent Experimental Hip-Hop intro defined by its sudden shifts in texture.",
      "[[B1]]",
      "[20.0:] A high-octane Hyperpop-influenced verse defined by its rapid-fire vocal delivery.",
      "[[C2]]",
      "[50.0:] A massive, anthemic Wonky Rap chorus defined by its heavy low-end and infectious, leaning rhythm.",
    ].join("\n");

    const script = parseEPF(raw);

    expect(script.totalDuration).toBe(150);
    expect(script.segments).toHaveLength(3);
    expect(script.segments.map((segment) => segment.id)).toEqual(["A0", "B1", "C2"]);

    expect(script.segments[0]).toMatchObject({
      id: "A0",
      startTime: 0,
      moodLoop: "ambient",
      audioDirection: expect.stringContaining("Experimental Hip-Hop intro"),
    });
    expect(script.segments[0].dialogueLines).toEqual([]);

    expect(script.segments[1]).toMatchObject({
      id: "B1",
      startTime: 20,
      type: "verse",
      moodLoop: "hype",
      audioDirection: expect.stringContaining("Hyperpop-influenced verse"),
    });
    expect(script.segments[1].dialogueLines).toEqual([
      "Oh jeez, 'Wuzzup!'? Is this a time warp?",
      "Wow, groundbreaking... you're really pushing the envelope of human greeting.",
    ]);

    expect(script.segments[2]).toMatchObject({
      id: "C2",
      startTime: 50,
      type: "chorus",
      moodLoop: "chorus",
      audioDirection: expect.stringContaining("Wonky Rap chorus"),
    });
    expect(script.segments[2].dialogueLines).toEqual([
      "Wuzzup! Really? That's your plan?",
      "(Wuzzup!)",
    ]);
  });

  it("extracts plain text from the merged mirrored EPF script", () => {
    const raw = [
      "[[B1]]",
      "[20.0:] First spoken line.",
      "[:] Second spoken line.",
      "[[B1]]",
      "[20.0:] A verse audio direction with fast digital percussion and synth stabs.",
    ].join("\n");

    const script = parseEPF(raw);

    expect(extractPlainText(script)).toBe("First spoken line.\nSecond spoken line.");
  });
});
