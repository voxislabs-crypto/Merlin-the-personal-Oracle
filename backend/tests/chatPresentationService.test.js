import { describe, expect, it, vi } from "vitest";
import { buildAssistantPresentation } from "../services/chatPresentationService.js";
import * as epfParser from "../services/epfParser.js";

describe("chatPresentationService", () => {
  it("leaves plain chat replies untouched", () => {
    const result = buildAssistantPresentation("Plain answer for the user.");

    expect(result).toEqual({
      rawReply: "Plain answer for the user.",
      displayReply: "Plain answer for the user.",
      isPerformanceOutput: false,
      parseError: false,
    });
  });

  it("extracts dialogue from EPF replies for chat display", () => {
    const epf = [
      "[[A0]]",
      "[0.0:]",
      "[:] First line.",
      "[:] Second line.",
      "A glitchy synth intro with bright noise bursts.",
      "bpm: 120.0 duration_secs: 10.0",
    ].join("\n");

    const result = buildAssistantPresentation(epf);

    expect(result.rawReply).toBe(epf);
    expect(result.displayReply).toBe("First line.\nSecond line.");
    expect(result.isPerformanceOutput).toBe(true);
    expect(result.parseError).toBe(false);
  });

  it("strips inline EPF metadata token leakage from dialogue", () => {
    const epf = [
      "[[E1]]",
      "[88.0:]",
      "[:] Oh jeez... 'Something'... Seriously.mosic: 4.5 bpm: 120.0 duration_secs: 150.0",
    ].join("\n");

    const result = buildAssistantPresentation(epf);

    expect(result.displayReply).toBe("Oh jeez... 'Something'... Seriously.");
    expect(result.displayReply).not.toMatch(/mosic|music|duration_secs|bpm/i);
    expect(result.isPerformanceOutput).toBe(true);
  });

  it("falls back to plain chat semantics when EPF parsing fails", () => {
    const parserSpy = vi.spyOn(epfParser, "parseEPF").mockImplementation(() => {
      throw new Error("parse failed");
    });
    const malformed = "[[A0]]\n[0.0:]\n[:] line";

    const result = buildAssistantPresentation(malformed);
    parserSpy.mockRestore();

    expect(result.rawReply).toBe(malformed);
    expect(result.displayReply).toBe(malformed);
    expect(result.isPerformanceOutput).toBe(false);
    expect(result.parseError).toBe(true);
  });
});