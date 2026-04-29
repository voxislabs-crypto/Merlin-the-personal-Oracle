/**
 * Trace Compiler - Converts raw brainObserver traces into structured explanation context
 * 
 * This layer sits between brainObserver (raw events) and the explanation engine (LLM).
 * It extracts relevant signals and compiles them into a clean, stable format for causal reasoning.
 */

/**
 * Compile a session trace into structured explanation context
 * @param {Array} sessionTrace - Raw trace entries from brainObserver
 * @returns {Object} Compiled trace with summary, signals, timeline, and generation data
 */
export function compileTraceForExplanation(sessionTrace = []) {
  if (!Array.isArray(sessionTrace) || sessionTrace.length === 0) {
    return {
      summary: { personalityName: null, mood: null, memoryCount: 0 },
      signals: { traits: [], behaviorRules: [], moodState: null, memory: [] },
      timeline: [],
      generation: { promptPreview: null, responsePreview: null }
    };
  }

  const getLast = (type) =>
    [...sessionTrace].reverse().find(s => s.stepType === type);

  const personality = getLast("personality")?.outputSnapshot || null;
  const mood = getLast("mood")?.outputSnapshot || null;
  const memory = getLast("memory")?.outputSnapshot || null;
  const prompt = getLast("prompt")?.outputSnapshot || null;
  const llm = getLast("llm")?.outputSnapshot || null;

  // Build timeline with step order
  const timeline = sessionTrace
    .map((entry, index) => ({
      step: entry.stepType,
      t: index + 1,
      timestamp: entry.timestamp
    }))
    .sort((a, b) => a.t - b.t);

  return {
    summary: {
      personalityName: personality?.name || null,
      mood: mood?.state || mood || null,
      memoryCount: Array.isArray(memory) ? memory.length : 0
    },

    signals: {
      traits: personality?.traits || [],
      behaviorRules: personality?.behaviorRules || [],
      moodState: personality?.moodState || mood || null,
      memory: Array.isArray(memory) ? memory.slice(0, 5) : [],
    },

    timeline,

    generation: {
      promptPreview: prompt?.systemPrompt?.slice?.(0, 800) || prompt?.slice?.(0, 800) || null,
      responsePreview: llm?.response?.slice?.(0, 300) || llm?.slice?.(0, 300) || null
    }
  };
}

/**
 * Extract specific signal types from trace
 * @param {Array} sessionTrace - Raw trace entries
 * @param {string} signalType - Type of signal to extract (personality, mood, memory, prompt, llm)
 * @returns {Object|null} Extracted signal or null
 */
export function extractSignal(sessionTrace, signalType) {
  if (!Array.isArray(sessionTrace)) return null;
  
  const entry = [...sessionTrace].reverse().find(s => s.stepType === signalType);
  return entry?.outputSnapshot || null;
}

/**
 * Get trace statistics for debugging
 * @param {Array} sessionTrace - Raw trace entries
 * @returns {Object} Statistics about the trace
 */
export function getTraceStats(sessionTrace) {
  if (!Array.isArray(sessionTrace)) {
    return { totalSteps: 0, byType: {} };
  }

  const byType = {};
  for (const entry of sessionTrace) {
    byType[entry.stepType] = (byType[entry.stepType] || 0) + 1;
  }

  return {
    totalSteps: sessionTrace.length,
    byType,
    hasPersonality: !!sessionTrace.find(s => s.stepType === "personality"),
    hasMood: !!sessionTrace.find(s => s.stepType === "mood"),
    hasMemory: !!sessionTrace.find(s => s.stepType === "memory"),
    hasPrompt: !!sessionTrace.find(s => s.stepType === "prompt"),
    hasLLM: !!sessionTrace.find(s => s.stepType === "llm"),
  };
}
