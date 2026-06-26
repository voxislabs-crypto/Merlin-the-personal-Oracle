import { extractPlainText, isPerformanceOutput, parseEPF } from "./epfParser.js";

export function buildAssistantPresentation(reply) {
  const rawReply = String(reply || "");
  const trimmedReply = rawReply.trim();

  if (!trimmedReply) {
    return {
      rawReply,
      displayReply: "",
      isPerformanceOutput: false,
      parseError: false,
    };
  }

  if (!isPerformanceOutput(trimmedReply)) {
    return {
      rawReply,
      displayReply: rawReply,
      isPerformanceOutput: false,
      parseError: false,
    };
  }

  try {
    const script = parseEPF(trimmedReply);
    const displayReply = extractPlainText(script).trim() || rawReply;

    return {
      rawReply,
      displayReply,
      isPerformanceOutput: true,
      parseError: false,
    };
  } catch {
    return {
      rawReply,
      displayReply: rawReply,
      isPerformanceOutput: false,
      parseError: true,
    };
  }
}