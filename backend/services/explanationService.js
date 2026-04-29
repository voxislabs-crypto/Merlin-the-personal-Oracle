import { generateChatCompletion } from "./llmService.js";
import { getSessionTrace } from "./brainObserver.js";
import { compileTraceForExplanation } from "./traceCompiler.js";

const EXPLANATION_SYSTEM_PROMPT = `You are Voxis, a system-level AI interpreter.

Your job is to explain why the AI produced a specific response.

You are given a structured execution trace containing:
- personality signals (traits, behavior rules)
- mood state
- memory influence
- prompt structure
- generated output

You must explain causality.

Rules:
- Do NOT speculate outside provided data
- Focus on "what caused what"
- Be concise and structured
- No fluff, no storytelling
- 2-3 sentences maximum

Example output:
"The response used dark humor because the personality prioritizes cynical traits and has a high 'disturbing humor' quirk. The mood was slightly elevated, increasing expressive energy. A prior memory about 'finding humor in unsettling situations' reinforced the joke selection."

Return the explanation as plain text, no JSON.`;

export async function explainBehavior({ personality, memories, mood, observerTrace, sessionId }) {
  try {
    let compiledTrace;

    // If sessionId provided, use trace compiler for structured context
    if (sessionId) {
      const trace = getSessionTrace(sessionId);
      compiledTrace = compileTraceForExplanation(trace);
      console.log("[ExplanationService] Compiled trace:", compiledTrace.summary);
    } else {
      // Fallback to manually constructed context for backward compatibility
      compiledTrace = {
        summary: {
          personalityName: personality?.name || null,
          mood: mood || null,
          memoryCount: Array.isArray(memories) ? memories.length : 0
        },
        signals: {
          traits: personality?.traits || [],
          behaviorRules: personality?.behaviorRules || [],
          moodState: mood || null,
          memory: Array.isArray(memories) ? memories.slice(0, 5) : [],
        },
        generation: {
          promptPreview: null,
          responsePreview: null
        }
      };
    }

    const messages = [
      { role: "system", content: EXPLANATION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Execution trace:\n${JSON.stringify(compiledTrace, null, 2)}\n\nExplain why the AI responded this way based on the provided signals.`
      }
    ];

    const explanation = await generateChatCompletion(messages);
    
    console.log("[ExplanationService] Generated explanation:", explanation);

    return {
      success: true,
      explanation: typeof explanation === "string" ? explanation : String(explanation),
      traceSummary: compiledTrace.summary,
    };
  } catch (error) {
    console.error("[ExplanationService] Error generating explanation:", error);
    return {
      success: false,
      error: error.message || "Failed to generate explanation",
    };
  }
}
