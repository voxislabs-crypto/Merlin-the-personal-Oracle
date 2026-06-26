/**
 * Brain Observer - Passive observational sidecar layer
 * 
 * This is a spectator + diagnostic + advisory layer around the existing brain.
 * It NEVER modifies chat flow, only records and traces state transitions.
 * 
 * ChatController remains the immutable execution core.
 */

const traceStore = new Map(); // sessionId -> array of trace entries

/**
 * Generate a unique session ID for a chat request
 */
export function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Record a trace entry with unified schema
 */
function recordTrace(sessionId, stepType, inputSnapshot, outputSnapshot, delta) {
  const traceEntry = {
    sessionId,
    stepType,
    timestamp: new Date().toISOString(),
    inputSnapshot,
    outputSnapshot,
    delta,
  };

  if (!traceStore.has(sessionId)) {
    traceStore.set(sessionId, []);
  }
  traceStore.get(sessionId).push(traceEntry);

  console.log(`[VOXIS TRACE] ${stepType}:`, delta?.summary || "completed");
  return traceEntry;
}

/**
 * Compute state delta between input and output snapshots
 */
function computeDelta(input, output) {
  const delta = {
    summary: "",
    changes: [],
  };

  if (!input || !output) {
    delta.summary = "initial state";
    return delta;
  }

  // Compare top-level keys
  const allKeys = new Set([...Object.keys(input), ...Object.keys(output)]);
  
  for (const key of allKeys) {
    const inputValue = input[key];
    const outputValue = output[key];
    
    if (JSON.stringify(inputValue) !== JSON.stringify(outputValue)) {
      delta.changes.push({
        field: key,
        from: inputValue,
        to: outputValue,
      });
    }
  }

  delta.summary = delta.changes.length > 0
    ? `${delta.changes.length} field(s) changed`
    : "no changes";

  return delta;
}

/**
 * Record personality state at execution start
 */
export function observePersonalityLoad(sessionId, personality) {
  const inputSnapshot = null;
  const outputSnapshot = {
    id: personality.id,
    name: personality.name,
    traits: (personality.traits || []).slice(0, 3),
    behaviorRules: (personality.behaviorRules || []).slice(0, 3),
    mood: personality.mood,
    creativeContext: personality.creativeContext,
  };
  const delta = { summary: "personality loaded" };

  return recordTrace(sessionId, "personality", inputSnapshot, outputSnapshot, delta);
}

/**
 * Record mood state transition
 */
export function observeMoodTransition(sessionId, { before, after, label, stepDiagnostics }) {
  const inputSnapshot = {
    valence: before.valence,
    arousal: before.arousal,
    dominance: before.dominance,
  };
  const outputSnapshot = {
    valence: after.valence,
    arousal: after.arousal,
    dominance: after.dominance,
    label,
  };
  const delta = computeDelta(inputSnapshot, outputSnapshot);
  delta.diagnostics = stepDiagnostics;

  return recordTrace(sessionId, "mood", inputSnapshot, outputSnapshot, delta);
}

/**
 * Record memory retrieval and injection
 */
export function observeMemoryInjection(sessionId, { retrieved, injected, promptSection }) {
  const inputSnapshot = {
    retrievedCount: retrieved.length,
  };
  const outputSnapshot = {
    injectedCount: injected.length,
    anchorCount: injected.filter(m => m.injectedAs === "anchor").length,
    contextCount: injected.filter(m => m.injectedAs === "context").length,
    schemeCount: injected.filter(m => m.injectedAs === "scheme").length,
    retrieved: retrieved.map(m => ({
      content: m.content.substring(0, 100),
      importance: m.importance,
      type: m.memoryType,
    })),
    injected: injected.map(m => ({
      content: m.content.substring(0, 100),
      injectedAs: m.injectedAs,
    })),
  };
  const delta = {
    summary: `${injected.length} memories injected`,
    injected: injected.map(m => m.content.substring(0, 50)),
  };

  return recordTrace(sessionId, "memory", inputSnapshot, outputSnapshot, delta);
}

/**
 * Record prompt construction
 */
export function observePromptConstruction(sessionId, { promptPackage, moodLabel, activeGoal, activeResponseLens }) {
  const inputSnapshot = {
    moodLabel,
  };
  const outputSnapshot = {
    moodLabel,
    activeGoal: activeGoal?.goal || null,
    activeResponseLens: activeResponseLens?.label || null,
    promptBudget: promptPackage.debug?.promptBudget || null,
    sections: {
      traits: promptPackage.debug?.sections?.traits || null,
      behaviorRules: promptPackage.debug?.sections?.behaviorRules || null,
      memory: {
        anchors: promptPackage.debug?.sections?.anchors || null,
        context: promptPackage.debug?.sections?.context || null,
      },
    },
  };
  const delta = {
    summary: `prompt built with lens: ${activeResponseLens?.label || "none"}`,
    lens: activeResponseLens?.label || null,
    goal: activeGoal?.goal || null,
  };

  return recordTrace(sessionId, "prompt", inputSnapshot, outputSnapshot, delta);
}

/**
 * Record LLM generation
 */
export function observeLLMGeneration(sessionId, { inputTokens, model, usage }) {
  const inputSnapshot = {
    inputTokens,
    model,
  };
  const outputSnapshot = {
    inputTokens,
    model,
    usage,
  };
  const delta = {
    summary: `generated with ${inputTokens} input tokens`,
    usage,
  };

  return recordTrace(sessionId, "llm", inputSnapshot, outputSnapshot, delta);
}

/**
 * Record utterance plan construction
 */
export function observeUtterancePlan(sessionId, { utterancePlan, reply }) {
  const inputSnapshot = {
    replyLength: reply.length,
  };
  const outputSnapshot = {
    mode: utterancePlan.mode,
    isPerformanceOutput: utterancePlan.isPerformanceOutput,
    speechImpulses: utterancePlan.speechImpulses,
    stateSnapshot: utterancePlan.stateSnapshot,
    replyLength: reply.length,
  };
  const delta = {
    summary: `utterance plan: ${utterancePlan.mode}`,
    mode: utterancePlan.mode,
  };

  return recordTrace(sessionId, "utterance", inputSnapshot, outputSnapshot, delta);
}

/**
 * Get full reasoning timeline for a session
 */
export function getSessionTrace(sessionId) {
  return traceStore.get(sessionId) || [];
}

/**
 * Get consolidated trace across all sessions
 */
export function getConsolidatedTrace(limit = 100) {
  const allTraces = [];
  for (const traces of traceStore.values()) {
    allTraces.push(...traces);
  }
  return allTraces.slice(-limit);
}

/**
 * Get step-by-step replay for a session
 */
export function getSessionReplay(sessionId) {
  const traces = getSessionTrace(sessionId);
  return traces.map(trace => ({
    step: trace.stepType,
    timestamp: trace.timestamp,
    delta: trace.delta,
    state: trace.outputSnapshot,
  }));
}

/**
 * Get state diff tracking for a session
 */
export function getSessionStateDiffs(sessionId) {
  const traces = getSessionTrace(sessionId);
  return traces
    .filter(trace => trace.delta.changes && trace.delta.changes.length > 0)
    .map(trace => ({
      step: trace.stepType,
      timestamp: trace.timestamp,
      changes: trace.delta.changes,
    }));
}

/**
 * Clear trace for a specific session
 */
export function clearSessionTrace(sessionId) {
  traceStore.delete(sessionId);
}

/**
 * Clear all traces (for testing)
 */
export function clearAllTraces() {
  traceStore.clear();
}

/**
 * Get trace statistics
 */
export function getTraceStats() {
  const stats = {
    totalSessions: traceStore.size,
    totalSteps: 0,
    byStepType: {},
    bySession: {},
  };

  for (const [sessionId, traces] of traceStore.entries()) {
    stats.totalSteps += traces.length;
    stats.bySession[sessionId] = traces.length;

    for (const trace of traces) {
      stats.byStepType[trace.stepType] = (stats.byStepType[trace.stepType] || 0) + 1;
    }
  }

  return stats;
}
