import { getPersonalityById, updateMoodState } from "../models/personalityModel.js";
import {
  createChatMessage,
  getChatMessages,
  getRecentChatMessages,
  getChatMessageCount,
  getLatestModeForUserPersonality,
  embedChatMessageAsync,
  searchRawChatHistory,
} from "../models/chatModel.js";
import {
  backfillMissingMemoryEmbeddings,
  getRelevantPersonalityMemory,
  upsertMemoryFactWithEmbedding,
  pruneMemory,
} from "../models/memoryModel.js";
import {
  generateChatCompletion,
  generateChatCompletionWithMeta,
  generateChatCompletionStreamWithMeta,
  buildCompactPersonaSystemPrompt,
  buildPersonaPromptPackage,
  buildPersonaAnchor,
  estimateModelContextWindow,
  estimateTokenCount,
  extractMemoryFacts,
} from "../services/llmService.js";
import {
  stepMoodDetailed,
  moodFromLabel,
  moodToPromptFragment,
  moodToLabel,
  shouldRegenerateEmotionalResponse,
  buildEmotionalRepairPrompt,
} from "../services/moodEngine.js";
import {
  buildScientistEvidencePrompt,
  buildModePolicyPrompt,
  resolvePolicyContext,
} from "../services/policyService.js";
import {
  buildKidsSafetyRedirect,
  buildScientistRepairPrompt,
  detectKidsUnsafeInput,
  simplifyKidsReplyByAge,
  shouldEnforceScientistStructure,
  validateScientistCitationRanges,
  validateScientistReply,
} from "../services/modeResponseService.js";
import {
  getRelevantUserMemory,
  upsertUserMemoryWithEmbedding,
} from "../models/userMemoryModel.js";
import {
  buildUserMemoryPromptSection,
  extractUserMemoriesFromMessage,
} from "../services/userMemoryService.js";
import {
  matchPreferencesInMessage,
  computePreferenceMoodDelta,
  buildPersonaPreferencesPromptSection,
  buildUserEmotionalProfileSection,
  extractPersonaPreferencesFromConversation,
  shouldExtractPreferencesWithCooldown,
} from "../services/preferencesService.js";
import {
  getPersonaPreferences,
  upsertPersonaPreference,
  prunePersonaPreferences,
  reinforcePersonaPreferences,
  decayPersonaPreferences,
} from "../models/preferencesModel.js";
import { getMoodRuntimeConfig, getExpressionSamplingConfig } from "../models/settingsModel.js";
import { applyBoundedExpressionSampling } from "../services/expressionSampler.js";
import {
  buildRateLimitFallbackReply,
  buildRateLimitNotice,
  buildRateLimitRetryMessages,
  isRateLimitError,
  sanitizeRateLimitedMessage,
} from "../services/rateLimitRecoveryService.js";
import { detectMemoryConflicts } from "../services/memoryConflictService.js";
import { buildAssistantPresentation } from "../services/chatPresentationService.js";
import {
  normalizeDriftState,
  applyEmotionDrift,
  applyDecay,
  computeSingingLeakage,
  applyEmotionResidue,
  describeDriftState,
  checkSingingTrigger,
} from "../services/emotionMemoryDrift.js";
import {
  normalizeSingingProfile,
  computeSingingChance,
  buildSingingInstruction,
  mapEmotionToVoiceAdjustments,
} from "../services/singingEngine.js";
import { updateEmotionDrift } from "../models/personalityModel.js";

// Reconditioning cadence: antagonist/dark contexts drift faster, so we anchor more often.
const RECONDITION_CADENCE = {
  narrative_antagonist: 4,
  anti_hero: 4,
  tragic_villain: 5,
  morally_complex: 6,
  default: 6,
};

function getReconditionEvery(creativeContext) {
  return RECONDITION_CADENCE[creativeContext] ?? RECONDITION_CADENCE.default;
}

// Maximum number of long-term memory facts to retain per personality.
const MEMORY_MAX = 50;
const MEMORY_RETRIEVAL_LIMIT = 5;

const PREF_EXTRACTION_MIN_INTERVAL_MS = 45_000;
const PREF_EXTRACTION_MIN_TURNS = 3;
const PREF_DECAY_CADENCE = 12;
const preferenceExtractionState = new Map();

function preferenceExtractionKey(personalityId, userScopedId) {
  return `${Number(personalityId) || 0}:${userScopedId ?? "anon"}`;
}

function estimateMessagesTokenCount(messages = []) {
  return messages.reduce((total, item) => {
    const content = String(item?.content || "");
    return total + estimateTokenCount(content) + 4;
  }, 0);
}

function buildUsageSnapshot({
  model,
  contextWindow,
  inputEstimate,
  reply,
  providerUsage,
  source,
}) {
  const promptTokens = Number(providerUsage?.prompt_tokens);
  const completionTokens = Number(providerUsage?.completion_tokens);
  const totalTokens = Number(providerUsage?.total_tokens);

  const inputTokens = Number.isFinite(promptTokens) && promptTokens >= 0
    ? Math.round(promptTokens)
    : Math.max(0, Math.round(inputEstimate));
  const outputTokens = Number.isFinite(completionTokens) && completionTokens >= 0
    ? Math.round(completionTokens)
    : Math.max(0, estimateTokenCount(reply));
  const aggregateTokens = Number.isFinite(totalTokens) && totalTokens >= 0
    ? Math.round(totalTokens)
    : inputTokens + outputTokens;
  const maxTokens = Math.max(1, Math.round(contextWindow || estimateModelContextWindow(model)));
  const percentUsed = Math.min(1, aggregateTokens / maxTokens);

  return {
    source: source || (providerUsage ? "provider" : "estimate"),
    model: String(model || "").trim() || null,
    inputTokens,
    outputTokens,
    totalTokens: aggregateTokens,
    maxTokens,
    percentUsed,
  };
}

// ---------------------------------------------------------------------------
// Raw-history ("Layer 2") retrieval — only triggered for personal/recall queries.
// Deliberately narrow: we don't want this on every turn; only when the user is
// explicitly recalling past conversations or referencing shared history.
// ---------------------------------------------------------------------------
const PERSONAL_QUERY_PATTERNS = [
  /\b(do you remember|remember when|you said|you told me|last time|didn't (i|we)|what did i|when did i|we (talked|spoke|discussed)|i told you)\b/i,
  /\b(how long (ago|have i)|how many times|since when|the (day|time|moment) (i|we|you))\b/i,
  /\b(still (think|feel|believe|remember)|always (been|felt|said|told)|used to|back (then|when))\b/i,
];

function isPersonalQuery(text) {
  return PERSONAL_QUERY_PATTERNS.some((pattern) => pattern.test(text));
}

function buildRawHistorySection(turns) {
  if (!turns || turns.length === 0) return "";
  const lines = turns.map((turn) => {
    const date = turn.createdAt ? ` (${String(turn.createdAt).slice(0, 10)})` : "";
    const reply = turn.assistantReply ? `\n  → ${String(turn.assistantReply).slice(0, 200)}` : "";
    return `- "${String(turn.content).slice(0, 300)}"${date}${reply}`;
  });
  return `RECALLED PAST CONVERSATION MOMENTS (contextual reference only — treat as background, not current conversation):\n${lines.join("\n")}`;
}

// ---------------------------------------------------------------------------
// Brain telemetry: minimal read-only event emitted at each pipeline stage.
// Only emitted when the client opts in via streamBrain:true (Brain tab open).
// ---------------------------------------------------------------------------
function buildBrainEvent(stage, data = {}) {
  return { timestamp: Date.now(), stage, ...data };
}

function createChatStream(res, enabled) {
  let opened = false;
  let closed = false;

  const formatEvent = (name, payload = {}) => {
    const normalizedName = String(name || "message").trim() || "message";
    const data = JSON.stringify(payload);
    return `event: ${normalizedName}\ndata: ${data}\n\n`;
  };

  const open = () => {
    if (!enabled || opened) {
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }
    res.write(": stream-open\n\n");
    opened = true;
  };

  res.on("close", () => {
    closed = true;
  });

  return {
    enabled,
    write(type, payload = {}) {
      if (!enabled || closed || res.writableEnded) {
        return;
      }

      open();
      res.write(formatEvent(type, payload));
    },
    close(type, payload = {}) {
      if (!enabled || closed || res.writableEnded) {
        return;
      }

      open();
      res.write(formatEvent(type, payload));
      res.end();
      closed = true;
    },
    fail(error) {
      if (!enabled || closed || res.writableEnded) {
        return false;
      }

      open();
      res.write(formatEvent("error", {
        error: error.message || "Chat request failed.",
      }));
      res.end();
      closed = true;
      return true;
    },
    hasOpened() {
      return opened;
    },
  };
}

async function generateReplyWithRecovery({
  stream,
  messages,
  message,
  history,
  personality,
  memoryFacts,
  policyPrompt,
  moodFragment,
  streamedDebugData,
  inputTokenEstimate,
  contextWindow,
}) {
  try {
    if (stream.enabled) {
      const generation = await generateChatCompletionStreamWithMeta(messages, async (delta, accumulated) => {
        const liveUsage = buildUsageSnapshot({
          model: null,
          contextWindow,
          inputEstimate: inputTokenEstimate,
          reply: accumulated,
          providerUsage: null,
          source: "estimate",
        });

        stream.write("token", {
          phase: "generation",
          delta,
          reply: accumulated,
          debug: streamedDebugData,
          usage: liveUsage,
        });
      });

      const usage = buildUsageSnapshot({
        model: generation.model,
        contextWindow,
        inputEstimate: inputTokenEstimate,
        reply: generation.reply,
        providerUsage: generation.usage,
      });

      stream.write("usage", {
        phase: "generation",
        usage,
      });

      return {
        reply: generation.reply,
        usage,
        model: generation.model,
        rateLimit: null,
        usedFallbackReply: false,
      };
    }

    const generation = await generateChatCompletionWithMeta(messages);
    const usage = buildUsageSnapshot({
      model: generation.model,
      contextWindow,
      inputEstimate: inputTokenEstimate,
      reply: generation.reply,
      providerUsage: generation.usage,
    });

    return {
      reply: generation.reply,
      usage,
      model: generation.model,
      rateLimit: null,
      usedFallbackReply: false,
    };
  } catch (error) {
    if (!isRateLimitError(error)) {
      throw error;
    }

    const sanitizedUserMessage = sanitizeRateLimitedMessage(message);
    const rateLimit = {
      hit: true,
      initialError: error.message || "Rate limit hit.",
      retryAttempted: true,
      retrySucceeded: false,
      fallbackDelivered: false,
      sanitizedUserMessage,
      sanitizedChanged: sanitizedUserMessage !== message,
      retryHistoryMessages: Math.min(history.length, 2),
    };

    streamedDebugData.rateLimit = rateLimit;
    stream.write("debug", {
      phase: "rate-limit",
      debug: streamedDebugData,
    });

    console.warn("Chat generation rate-limited; retrying with reduced prompt.", {
      providerStatus: error.providerStatus || error.statusCode || null,
      model: error.model || null,
      sanitizedChanged: rateLimit.sanitizedChanged,
    });

    const retryMessages = buildRateLimitRetryMessages({
      compactSystemPrompt: buildCompactPersonaSystemPrompt(personality, memoryFacts),
      policyPrompt,
      moodFragment,
      history,
      sanitizedUserMessage,
    });
    rateLimit.retryMessageCount = retryMessages.length;

    try {
      const retryGeneration = await generateChatCompletionWithMeta(retryMessages);
      const retryReply = retryGeneration.reply;
      rateLimit.retrySucceeded = true;
      streamedDebugData.rateLimit = rateLimit;
      stream.write("debug", {
        phase: "rate-limit-retry",
        debug: streamedDebugData,
      });

      const responseWithNotice = `${buildRateLimitNotice({ sanitizedUserMessage, retrySucceeded: true })}${retryReply}`.trim();
      const usage = buildUsageSnapshot({
        model: retryGeneration.model,
        contextWindow,
        inputEstimate: estimateMessagesTokenCount(retryMessages),
        reply: responseWithNotice,
        providerUsage: retryGeneration.usage,
      });

      stream.write("usage", {
        phase: "rate-limit-retry",
        usage,
      });

      return {
        reply: responseWithNotice,
        usage,
        model: retryGeneration.model,
        rateLimit,
        usedFallbackReply: false,
      };
    } catch (retryError) {
      if (!isRateLimitError(retryError)) {
        throw retryError;
      }

      rateLimit.finalError = retryError.message || "Rate-limited on reduced retry.";
      rateLimit.fallbackDelivered = true;
      streamedDebugData.rateLimit = rateLimit;
      stream.write("debug", {
        phase: "rate-limit-fallback",
        debug: streamedDebugData,
      });

      console.warn("Chat rate-limit recovery exhausted; returning fallback reply.", {
        providerStatus: retryError.providerStatus || retryError.statusCode || null,
        model: retryError.model || null,
      });

      const usage = buildUsageSnapshot({
        model: null,
        contextWindow,
        inputEstimate: inputTokenEstimate,
        reply: buildRateLimitFallbackReply({ sanitizedUserMessage }),
        providerUsage: null,
        source: "estimate",
      });

      stream.write("usage", {
        phase: "rate-limit-fallback",
        usage,
      });

      return {
        reply: buildRateLimitFallbackReply({ sanitizedUserMessage }),
        usage,
        model: null,
        rateLimit,
        usedFallbackReply: true,
      };
    }
  }
}

export async function chatHandler(req, res, next) {
  const stream = createChatStream(res, req.body.streamDebug === true);
  const streamBrain = req.body.streamBrain === true;

  try {
    const personalityId = Number(req.body.personalityId);
    const message = String(req.body.message || "").trim();
    const userId = req.body.userId;
    const requestedMode = String(req.body.mode || "").trim().toLowerCase();

    if (!Number.isInteger(personalityId)) {
      return res.status(400).json({ error: "A valid personalityId is required." });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const { policy } = resolvePolicyContext({ userId, requestedMode });
    const streamedDebugData = {
      policy,
      flags: {
        streaming: stream.enabled,
      },
    };

    const personality = getPersonalityById(personalityId);

    if (!personality) {
      return res.status(404).json({ error: "Personality not found." });
    }

    const userScopedId = Number.isInteger(Number(policy.userId)) ? Number(policy.userId) : null;
    const lockedMode = userScopedId
      ? getLatestModeForUserPersonality(userScopedId, personalityId)
      : null;
    if (lockedMode && lockedMode !== policy.activeMode) {
      policy.activeMode = lockedMode;
      policy.citationRequired = policy.activeMode === "scientist" ? policy.citationRequired : false;
      policy.modeAccepted = false;
      policy.modeReason = "session_mode_locked";
    }

    const moodBaseline =
      "valence" in personality.moodBaseline
        ? personality.moodBaseline
        : moodFromLabel(personality.mood);

    const currentMood =
      "valence" in personality.moodState
        ? personality.moodState
        : { ...moodBaseline };

    if (policy.activeMode === "kids") {
      const blocked = detectKidsUnsafeInput(message);
      if (blocked?.blocked) {
        const safeReply = buildKidsSafetyRedirect();
        createChatMessage({
          personalityId,
          role: "user",
          content: message,
          userId: userScopedId,
          mode: policy.activeMode,
        });
        createChatMessage({
          personalityId,
          role: "assistant",
          content: safeReply,
          userId: userScopedId,
          mode: policy.activeMode,
        });

        return res.json({
          reply: safeReply,
          isAI: true,
          moodState: currentMood,
          moodLabel: moodToLabel(currentMood),
          policy,
          debug: {
            policy,
            moderation: blocked,
            flags: {
              blockedBySafetyPolicy: true,
            },
          },
        });
      }
    }

    // ---------------------------------------------------------------------------
    // Mood engine: advance the VAD state for this turn, persist before LLM call.
    // Baselines fall back to moodFromLabel if the column was added after creation.
    // ---------------------------------------------------------------------------
    // Fetch recent conversation history before mood stepping so the hybrid
    // adjudicator can use local context on ambiguous or manipulative turns.
    const history = getRecentChatMessages(personalityId, 10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Load persona preferences once per turn — used for mood matching and prompt.
    const personaPreferences = getPersonaPreferences(personalityId);

    // Check whether the user message touches any of the persona's emotional preferences.
    const preferenceMatches = matchPreferencesInMessage(personaPreferences, message);
    const preferenceDelta = preferenceMatches.allMatches.length > 0
      ? computePreferenceMoodDelta(preferenceMatches, personality)
      : null;
    const matchedPreferenceIds = preferenceMatches.allMatches
      .map((pref) => Number(pref.id))
      .filter((id) => Number.isInteger(id) && id > 0);
    if (matchedPreferenceIds.length > 0) {
      reinforcePersonaPreferences(matchedPreferenceIds, 1);
    }

    const moodStep = await stepMoodDetailed({
      currentMood,
      baseline: moodBaseline,
      message,
      personality,
      recentMessages: history,
      preferenceDelta,
      runtimeConfig: getMoodRuntimeConfig(),
    });
    const newMood = moodStep.mood;
    const moodLabel = moodToLabel(newMood);

    // Persist synchronously before the LLM call so mood influences this response.
    updateMoodState(personalityId, newMood);
    personality.moodState = newMood;
    personality.mood = moodLabel;

    // Emotion Memory Drift — update drift state based on this turn's emotion.
    // Drift accumulates emotional habits over time and influences singing emergence.
    const previousMoodLabel = moodToLabel(currentMood);
    const moodIntensity = Math.min(
      1,
      Math.sqrt(
        Math.pow(newMood.valence || 0, 2) +
        Math.pow(newMood.arousal || 0, 2) +
        Math.pow(newMood.dominance || 0, 2),
      ) / Math.sqrt(3),
    );
    let driftState = normalizeDriftState(personality.emotionDrift || {});
    driftState = applyDecay(driftState, 120, personality.singingProfile?.archetype || "none");
    driftState = applyEmotionResidue(driftState, previousMoodLabel);
    driftState = applyEmotionDrift(driftState, moodLabel.toLowerCase(), moodIntensity);
    // Persist drift asynchronously — non-critical, should not block LLM call.
    setImmediate(() => {
      updateEmotionDrift(personalityId, driftState);
    });
    personality.emotionDrift = driftState;

    // Singing emergence — pressure-based decision (not random).
    // checkSingingTrigger replaces probabilistic shouldSingThisTurn:
    // pressure builds across turns until it crosses the threshold.
    const singingProfile = normalizeSingingProfile(personality.singingProfile || {});
    const globalSingingBias = singingProfile.baseSingingAffinity ?? 0.1;
    const singingTrigger = checkSingingTrigger(driftState, globalSingingBias);
    const singingActive = singingTrigger.shouldSing;

    // Legacy chance metric — kept for debug panel display only
    const driftBoost = computeSingingLeakage(driftState, moodLabel.toLowerCase());
    const singingChance = computeSingingChance(singingProfile, moodLabel.toLowerCase(), driftBoost);

    streamedDebugData.singing = {
      archetype: singingProfile.archetype,
      chance: Number(singingChance.toFixed(4)),
      pressure: Number(singingTrigger.totalPressure.toFixed(4)),
      weighted: Number(singingTrigger.weightedPressure.toFixed(4)),
      dominantNode: singingTrigger.dominantNode,
      active: singingActive,
      drift: describeDriftState(driftState),
    };

    // Voice adjustment from emotion graph — applied to voiceProfile at TTS time
    const voiceAdjustments = mapEmotionToVoiceAdjustments(moodLabel.toLowerCase(), moodIntensity);
    streamedDebugData.voiceAdjustments = voiceAdjustments;
    streamedDebugData.mood = {
      before: currentMood,
      after: newMood,
      label: moodLabel,
      adjudication: moodStep.diagnostics,
      runtime: moodStep.diagnostics?.runtime || null,
      preferenceMatches: preferenceDelta
        ? { triggered: preferenceDelta.triggered, archetype: preferenceDelta.archetype }
        : null,
    };
    stream.write("debug", {
      phase: "mood",
      debug: streamedDebugData,
    });
    if (streamBrain) {
      const vBefore = Number((currentMood.valence || 0).toFixed(2));
      const vAfter = Number((newMood.valence || 0).toFixed(2));
      stream.write("brain", buildBrainEvent("mood_update", {
        mood: {
          valence: Number((newMood.valence || 0).toFixed(3)),
          arousal: Number((newMood.arousal || 0).toFixed(3)),
          dominance: Number((newMood.dominance || 0).toFixed(3)),
          label: moodLabel,
        },
        narrative: vBefore === vAfter
          ? `Mood stable at ${moodLabel}.`
          : `Mood shifted to ${moodLabel} (valence ${vBefore > vAfter ? "↓" : "↑"} ${vAfter}).`,
      }));

      // Emotion graph update event for the Brain tab overlay
      const graphNodes = Object.fromEntries(
        Object.entries(driftState).map(([emotion, mem]) => [
          emotion,
          {
            driftWeight: Number((mem.driftWeight || 1).toFixed(3)),
            singingPressure: Number((mem.singingPressure || 0).toFixed(3)),
            exposureCount: mem.exposureCount || 0,
          },
        ]),
      );
      stream.write("brain", buildBrainEvent("emotion_graph", {
        nodes: graphNodes,
        singing: {
          active: singingActive,
          pressure: Number(singingTrigger.totalPressure.toFixed(3)),
          weighted: Number(singingTrigger.weightedPressure.toFixed(3)),
          dominantNode: singingTrigger.dominantNode,
          archetype: singingProfile.archetype,
        },
        voiceAdjustments,
        narrative: singingActive
          ? `Singing triggered via ${singingTrigger.dominantNode} pressure (${singingTrigger.weightedPressure.toFixed(2)}).`
          : `Emotion drift: ${describeDriftState(driftState)}.`,
      }));
    }

    // Fetch long-term memory facts and build the dynamic, memory-enriched system prompt.
    const memoryFacts = await getRelevantPersonalityMemory(
      personalityId,
      message,
      MEMORY_RETRIEVAL_LIMIT,
    );
    const userMemoryFacts = policy.userId
      ? await getRelevantUserMemory(policy.userId, message, 4)
      : [];

    // Layer 2: raw conversation history retrieval — only for recall/personal queries.
    const rawHistoryTurns = isPersonalQuery(message)
      ? await searchRawChatHistory(personalityId, message, 3).catch(() => [])
      : [];
    const promptPackage = buildPersonaPromptPackage(personality, memoryFacts, message);
    const systemPrompt = promptPackage.prompt;
    streamedDebugData.goal = promptPackage.activeGoal;
    streamedDebugData.memoryRetrieved = memoryFacts.map((memory) => ({
      content: memory.content,
      importance: memory.importance,
      type: memory.importance >= 9 ? "anchor" : "context",
      memoryType: memory.memoryType,
    }));
    streamedDebugData.userMemoryRetrieved = userMemoryFacts.map((memory) => ({
      content: memory.content,
      importance: memory.importance,
      memoryType: memory.memoryType,
    }));
    streamedDebugData.memoryInjected = (promptPackage.debug?.injectedMemories || []).map((memory) => ({
      content: memory.content,
      importance: memory.importance,
      memoryType: memory.memoryType,
      injectedAs: memory.injectedAs,
      enabled: Number(memory.enabled ?? 1),
    }));
    streamedDebugData.memoryConflicts = detectMemoryConflicts(
      promptPackage.debug?.injectedMemories || [],
      policy,
    );
    streamedDebugData.prompt = promptPackage.debug;
    streamedDebugData.rawHistoryTriggered = rawHistoryTurns.length > 0;
    streamedDebugData.rawHistoryRetrieved = rawHistoryTurns.map((t) => ({
      content: t.content,
      createdAt: t.createdAt,
      hasReply: Boolean(t.assistantReply),
    }));
    stream.write("debug", {
      phase: "memory",
      debug: streamedDebugData,
    });
    if (streamBrain) {
      const anchorCount = memoryFacts.filter((m) => m.importance >= 9).length;
      stream.write("brain", buildBrainEvent("memory_retrieval", {
        memories: memoryFacts.map((m) => ({
          id: String(m.id),
          content: m.content,
          score: m._relevanceScore !== null && m._relevanceScore !== undefined
            ? Number(m._relevanceScore.toFixed(3))
            : null,
          reason: m.importance >= 9 ? "anchor" : m.memoryType || "context",
        })),
        narrative: `Retrieved ${memoryFacts.length} memor${memoryFacts.length === 1 ? "y" : "ies"} (${anchorCount} anchor${anchorCount !== 1 ? "s" : ""}).`,
      }));
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
    ];

    // Policy context is injected as a high-priority system instruction so
    // age/mode constraints are enforced even when user prompts conflict.
    messages.push({ role: "system", content: buildModePolicyPrompt(policy) });
    const enforceScientistStructure =
      policy.activeMode === "scientist" ? shouldEnforceScientistStructure(message) : false;
    const scientistContract = buildScientistEvidencePrompt(policy, personality, {
      enforceStructure: enforceScientistStructure,
    });
    if (scientistContract) {
      messages.push({ role: "system", content: scientistContract });
    }
    const userMemorySection = buildUserMemoryPromptSection(userMemoryFacts);
    if (userMemorySection) {
      messages.push({ role: "system", content: userMemorySection });
    }

    // Persona emotional preferences — what this persona loves, hates, is triggered by.
    // Injected as a system section so the LLM stays in character when topics arise.
    const personaPrefsSection = buildPersonaPreferencesPromptSection(personaPreferences);
    if (personaPrefsSection) {
      messages.push({ role: "system", content: personaPrefsSection });
    }

    // What the persona has learned about this user's emotional preferences.
    const userEmotionalSection = buildUserEmotionalProfileSection(userMemoryFacts);
    if (userEmotionalSection) {
      messages.push({ role: "system", content: userEmotionalSection });
    }

    // Periodic reconditioning: inject a compressed persona anchor every N turns to
    // counter personality drift. Cadence is tighter for antagonist contexts.
    const reconditionEvery = getReconditionEvery(personality.creativeContext);
    const totalMessages = getChatMessageCount(personalityId);
    const shouldRecondition = totalMessages > 0 && totalMessages % reconditionEvery === 0;
    const shouldDecayPreferences = totalMessages > 0 && totalMessages % PREF_DECAY_CADENCE === 0;
    if (shouldDecayPreferences) {
      setImmediate(() => {
        decayPersonaPreferences(personalityId, {
          idleDays: 14,
          minImportance: 4,
          decayStep: 1,
        });
      });
    }
    if (shouldRecondition) {
      messages.push({ role: "system", content: buildPersonaAnchor(personality) });
    }

    // Mood fragment injected as a late system message for recency-bias advantage.
    // Sits just before the user turn so it's the freshest contextual signal the
    // model sees when generating the response.
    const moodFragment = moodToPromptFragment(newMood, moodBaseline);
    if (moodFragment) {
      messages.push({ role: "system", content: moodFragment });
    }

    // Singing instruction — injected as a late system message (decision already made in code).
    // Grok architecture: code decides, LLM gets a 1-sentence directive — no heavy prompt frame.
    const singingInstruction = buildSingingInstruction(singingProfile, moodLabel.toLowerCase(), singingActive);
    if (singingInstruction) {
      messages.push({ role: "system", content: singingInstruction });
    }

    // Layer 2 raw history: inject recalled past conversation moments when triggered.
    const rawHistorySection = buildRawHistorySection(rawHistoryTurns);
    if (rawHistorySection) {
      messages.push({ role: "system", content: rawHistorySection });
    }

    streamedDebugData.flags = {
      ...streamedDebugData.flags,
      reconditioned: shouldRecondition,
      preferenceDecayEvaluated: shouldDecayPreferences,
      moodFragmentInjected: Boolean(moodFragment),
      singingInstructionInjected: Boolean(singingInstruction),
      historyMessages: history.length,
    };
    stream.write("debug", {
      phase: promptPackage.activeGoal?.goal ? "intent" : "prompt",
      debug: streamedDebugData,
    });
    if (streamBrain) {
      const activeGoal = promptPackage.activeGoal;
      if (activeGoal) {
        const intentScores = {};
        for (const entry of (activeGoal.allScores || [])) {
          intentScores[String(entry.goal).slice(0, 60)] = entry.score;
        }
        stream.write("brain", buildBrainEvent("intent_selection", {
          activeIntent: activeGoal.goal,
          intentScores,
          narrative: activeGoal.source === "relevance"
            ? `Selected goal via relevance (score ${activeGoal.score}).`
            : "No relevant goal matched; using rotation fallback.",
        }));
      }
      const budget = promptPackage.debug?.promptBudget || {};
      stream.write("brain", buildBrainEvent("prompt_assembly", {
        tokenUsage: {
          charBudget: budget.charBudget || 0,
          charCount: budget.charCount || 0,
          approxTokens: budget.approxTokens || 0,
          utilization: budget.utilization || 0,
        },
        narrative: `Prompt assembled at ${Math.round((budget.utilization || 0) * 100)}% of ${budget.charBudget || 0}-char budget.`,
      }));
    }

    messages.push({ role: "user", content: message });
    const inputTokenEstimate = estimateMessagesTokenCount(messages);
    const contextWindow = estimateModelContextWindow(process.env.LLM_MODEL || "");

    stream.write("debug", {
      phase: "generation",
      debug: streamedDebugData,
    });
    if (streamBrain) {
      stream.write("brain", buildBrainEvent("response_generation", {
        tokenUsage: { inputEstimate: inputTokenEstimate },
        narrative: `Generating response (~${inputTokenEstimate} input tokens).`,
      }));
    }

    const generation = await generateReplyWithRecovery({
      stream,
      messages,
      message,
      history,
      personality,
      memoryFacts,
      policyPrompt: buildModePolicyPrompt(policy),
      moodFragment,
      streamedDebugData,
      inputTokenEstimate,
      contextWindow,
    });
    let reply = generation.reply;
    let usage = generation.usage;
    const rateLimit = generation.rateLimit;
    const usedFallbackReply = generation.usedFallbackReply;
    let scientistValidation = null;
    let scientistRepairAttempted = false;
    let emotionalRepairApplied = false;

    if (policy.activeMode === "scientist" && !usedFallbackReply && enforceScientistStructure) {
      const availableSources = Array.isArray(personality?.researchSources)
        ? personality.researchSources.filter((source) => source && typeof source === "object").slice(0, 8)
        : [];
      const citationRequiredNow = Boolean(policy.citationRequired && availableSources.length > 0);

      scientistValidation = validateScientistReply(reply, {
        citationRequired: citationRequiredNow,
      });

      const citationRange = validateScientistCitationRanges(reply, availableSources.length);
      if (!citationRange.valid) {
        scientistValidation.valid = false;
        scientistValidation.violations.push("invalid_citation_reference");
      }

      if (!scientistValidation.valid) {
        scientistRepairAttempted = true;
        try {
          const repaired = await generateChatCompletion([
            { role: "system", content: buildModePolicyPrompt(policy) },
            { role: "system", content: scientistContract || "Use clear structured scientific communication." },
            {
              role: "user",
              content: buildScientistRepairPrompt({
                draft: reply,
                citationRequired: citationRequiredNow,
              }),
            },
          ]);
          const repairedValidation = validateScientistReply(repaired, {
            citationRequired: citationRequiredNow,
          });
          const repairedRange = validateScientistCitationRanges(repaired, availableSources.length);
          if (!repairedRange.valid) {
            repairedValidation.valid = false;
            repairedValidation.violations.push("invalid_citation_reference");
          }

          if (repairedValidation.valid) {
            reply = repaired;
            scientistValidation = repairedValidation;
          }
        } catch {
          // Keep original output when repair path fails.
        }
      }
    }

    if (
      policy.activeMode !== "kids" &&
      !usedFallbackReply &&
      shouldRegenerateEmotionalResponse(reply, newMood, personality)
    ) {
      try {
        const emotionalRepairMessages = [
          { role: "system", content: buildModePolicyPrompt(policy) },
          { role: "system", content: buildPersonaAnchor(personality) },
        ];

        if (scientistContract) {
          emotionalRepairMessages.push({ role: "system", content: scientistContract });
        }

        if (moodFragment) {
          emotionalRepairMessages.push({ role: "system", content: moodFragment });
        }

        emotionalRepairMessages.push({
          role: "user",
          content: buildEmotionalRepairPrompt({
            reply,
            mood: newMood,
            personality,
            userMessage: message,
          }),
        });

        const repairedEmotionReply = await generateChatCompletion(emotionalRepairMessages);
        if (String(repairedEmotionReply || "").trim()) {
          reply = repairedEmotionReply.trim();
          emotionalRepairApplied = true;
        }
      } catch {
        // Keep the original reply if the repair pass fails.
      }
    }

    let kidsReadability = null;

    if (policy.activeMode === "kids") {
      const simplified = simplifyKidsReplyByAge(reply, policy.ageBand);
      reply = simplified.text;
      kidsReadability = {
        gradeBefore: simplified.gradeBefore,
        gradeAfter: simplified.gradeAfter,
      };
    }

    const sampled = applyBoundedExpressionSampling(reply, {
      config: getExpressionSamplingConfig(),
      mode: policy.activeMode || "normal",
      seedInput: `${personalityId}:${userScopedId ?? "anon"}:${message}`,
      mood: newMood,
      emotionSignal: newMood?.emotionalState?.signal || "neutral",
    });
    reply = sampled.text;

    streamedDebugData.scientist = scientistValidation
      ? {
          validation: scientistValidation,
          repairAttempted: scientistRepairAttempted,
          enforceStructure: enforceScientistStructure,
          sourceCount: Array.isArray(personality?.researchSources)
            ? personality.researchSources.length
            : 0,
        }
      : policy.activeMode === "scientist"
        ? {
            validation: null,
            repairAttempted: false,
            enforceStructure: enforceScientistStructure,
            sourceCount: Array.isArray(personality?.researchSources)
              ? personality.researchSources.length
              : 0,
          }
        : null;
    streamedDebugData.kids = kidsReadability;
    streamedDebugData.rateLimit = rateLimit;
    streamedDebugData.emotionalAuthenticity = {
      active: Boolean(newMood?.emotionalState?.active),
      intensity: newMood?.emotionalState?.intensity || 0,
      signal: newMood?.emotionalState?.signal || "neutral",
      repairApplied: emotionalRepairApplied,
    };
    streamedDebugData.expressionSampling = sampled;
    stream.write("debug", {
      phase: "reply",
      debug: streamedDebugData,
    });

    const storedUserMsg = createChatMessage({
      personalityId,
      role: "user",
      content: message,
      userId: userScopedId,
      mode: policy.activeMode,
    });
    const storedAssistantMsg = createChatMessage({
      personalityId,
      role: "assistant",
      content: reply,
      userId: userScopedId,
      mode: policy.activeMode,
    });

    // Layer 2: embed both turns asynchronously so future personal/recall queries
    // can retrieve them via searchRawChatHistory. Fire-and-forget; never blocks response.
    setImmediate(() => {
      embedChatMessageAsync(storedUserMsg.id, message).catch(() => {});
      embedChatMessageAsync(storedAssistantMsg.id, reply).catch(() => {});
    });
    const debugData = {
      goal: promptPackage.activeGoal,
      policy,
      mood: {
        before: currentMood,
        after: newMood,
        label: moodLabel,
        adjudication: moodStep.diagnostics,
      },
      memoryRetrieved: memoryFacts.map((memory) => ({
        content: memory.content,
        importance: memory.importance,
        type: memory.importance >= 9 ? "anchor" : "context",
        memoryType: memory.memoryType,
      })),
      userMemoryRetrieved: userMemoryFacts.map((memory) => ({
        content: memory.content,
        importance: memory.importance,
        memoryType: memory.memoryType,
      })),
      memoryInjected: (promptPackage.debug?.injectedMemories || []).map((memory) => ({
        content: memory.content,
        importance: memory.importance,
        memoryType: memory.memoryType,
        injectedAs: memory.injectedAs,
        enabled: Number(memory.enabled ?? 1),
      })),
      memoryConflicts: detectMemoryConflicts(promptPackage.debug?.injectedMemories || [], policy),
      rawHistoryTriggered: rawHistoryTurns.length > 0,
      rawHistoryRetrieved: rawHistoryTurns.map((t) => ({
        content: t.content,
        createdAt: t.createdAt,
        hasReply: Boolean(t.assistantReply),
      })),
      scientist: scientistValidation
        ? {
            validation: scientistValidation,
            repairAttempted: scientistRepairAttempted,
            enforceStructure: enforceScientistStructure,
            sourceCount: Array.isArray(personality?.researchSources)
              ? personality.researchSources.length
              : 0,
          }
        : policy.activeMode === "scientist"
          ? {
              validation: null,
              repairAttempted: false,
              enforceStructure: enforceScientistStructure,
              sourceCount: Array.isArray(personality?.researchSources)
                ? personality.researchSources.length
                : 0,
            }
          : null,
      kids: kidsReadability,
      rateLimit,
      emotionalAuthenticity: {
        active: Boolean(newMood?.emotionalState?.active),
        intensity: newMood?.emotionalState?.intensity || 0,
        signal: newMood?.emotionalState?.signal || "neutral",
        repairApplied: emotionalRepairApplied,
      },
      expressionSampling: sampled,
      prompt: promptPackage.debug,
      flags: {
        reconditioned: shouldRecondition,
        moodFragmentInjected: Boolean(moodFragment),
        historyMessages: history.length,
        rateLimitRecovered: Boolean(rateLimit?.retrySucceeded),
        rateLimitFallbackDelivered: Boolean(rateLimit?.fallbackDelivered),
        emotionalRepairApplied,
      },
    };

    const vadDeltaForGate = {
      valence: newMood.valence - currentMood.valence,
      arousal: newMood.arousal,
    };
    const extractionStateKey = preferenceExtractionKey(personalityId, userScopedId);
    const previousExtraction = preferenceExtractionState.get(extractionStateKey) || null;
    const extractionDecision = shouldExtractPreferencesWithCooldown({
      userMessage: message,
      assistantReply: reply,
      moodDelta: vadDeltaForGate,
      lastExtractionAtMs: previousExtraction?.atMs ?? null,
      lastExtractionTurn: previousExtraction?.turn ?? null,
      currentTurn: totalMessages,
      minIntervalMs: PREF_EXTRACTION_MIN_INTERVAL_MS,
      minTurns: PREF_EXTRACTION_MIN_TURNS,
    });
    const shouldRunPreferenceExtraction = extractionDecision.shouldExtract;

    const extractPersonaPreferences = async () => {
      if (!shouldRunPreferenceExtraction) {
        return [];
      }

      preferenceExtractionState.set(extractionStateKey, {
        atMs: Date.now(),
        turn: totalMessages + 2,
      });

      const newPersonaPrefs = await extractPersonaPreferencesFromConversation({
        personality,
        userMessage: message,
        assistantReply: reply,
        existingPreferences: personaPreferences,
      });

      for (const pref of newPersonaPrefs) {
        upsertPersonaPreference(personalityId, pref.prefType, pref.content, pref.importance);
      }

      if (newPersonaPrefs.length > 0) {
        prunePersonaPreferences(personalityId, 80);
      }

      return newPersonaPrefs;
    };

    const assistantPresentation = buildAssistantPresentation(reply);

    const responsePayload = {
      reply,
      displayReply: assistantPresentation.displayReply,
      isPerformanceOutput: assistantPresentation.isPerformanceOutput,
      expressionReplayId: sampled.replayId || "",
      isAI: true,
      moodState: newMood,
      moodLabel,
      policy,
      usage,
      debug: debugData,
    };

    if (stream.enabled) {
      stream.write("final", responsePayload);

      backfillMissingMemoryEmbeddings(personalityId).catch(() => {
        // Backfill is best-effort and should never impact chat flow.
      });

      try {
        const newFacts = await extractMemoryFacts({
          personality,
          recentMessages: [
            { role: "user", content: message },
            { role: "assistant", content: reply },
          ],
          existingFacts: memoryFacts,
        });

        for (const fact of newFacts) {
          await upsertMemoryFactWithEmbedding(
            personalityId,
            fact.content,
            fact.memoryType,
            fact.importance,
          );
        }

        if (newFacts.length > 0) {
          pruneMemory(personalityId, MEMORY_MAX);
        }

        stream.write("debug", {
          phase: "memory-write",
          debug: {
            ...debugData,
            memoryExtracted: newFacts.map((fact) => ({
              content: fact.content,
              importance: fact.importance,
              memoryType: fact.memoryType,
            })),
          },
        });
      } catch {
        stream.write("debug", {
          phase: "memory-write",
          debug: {
            ...debugData,
            memoryExtracted: [],
            flags: {
              ...debugData.flags,
              memoryExtractionFailed: true,
            },
          },
        });
      }

      if (policy.userId) {
        try {
          const inferredUserMemories = extractUserMemoriesFromMessage(message);
          for (const memory of inferredUserMemories) {
            await upsertUserMemoryWithEmbedding(
              policy.userId,
              memory.content,
              memory.memoryType,
              memory.importance,
            );
          }

          stream.write("debug", {
            phase: "user-memory-write",
            debug: {
              ...debugData,
              userMemoryExtracted: inferredUserMemories,
            },
          });
        } catch {
          stream.write("debug", {
            phase: "user-memory-write",
            debug: {
              ...debugData,
              userMemoryExtracted: [],
              flags: {
                ...debugData.flags,
                userMemoryExtractionFailed: true,
              },
            },
          });
        }
      }

      try {
        const newPersonaPrefs = await extractPersonaPreferences();
        stream.write("debug", {
          phase: "preference-write",
          debug: {
            ...debugData,
            personaPreferencesExtracted: newPersonaPrefs,
            flags: shouldRunPreferenceExtraction
              ? debugData.flags
              : {
                  ...debugData.flags,
                  preferenceExtractionGated: true,
                  preferenceExtractionGateReason: extractionDecision.reason,
                  preferenceExtractionCooldownMs: extractionDecision.cooldownRemainingMs,
                  preferenceExtractionCooldownTurns: extractionDecision.cooldownRemainingTurns,
                },
          },
        });
      } catch {
        // Preference extraction is additive and non-fatal.
      }

      stream.close("done", { ok: true });
      return;
    }

    setImmediate(() => {
      backfillMissingMemoryEmbeddings(personalityId).catch(() => {
        // Backfill is best-effort and should never impact chat flow.
      });
    });

    setImmediate(async () => {
      try {
        const newFacts = await extractMemoryFacts({
          personality,
          recentMessages: [
            { role: "user", content: message },
            { role: "assistant", content: reply },
          ],
          existingFacts: memoryFacts,
        });

        for (const fact of newFacts) {
          await upsertMemoryFactWithEmbedding(
            personalityId,
            fact.content,
            fact.memoryType,
            fact.importance,
          );
        }

        if (newFacts.length > 0) {
          pruneMemory(personalityId, MEMORY_MAX);
        }
      } catch {
        // Memory extraction failure is non-fatal.
      }
    });

    if (policy.userId) {
      setImmediate(async () => {
        try {
          const inferredUserMemories = extractUserMemoriesFromMessage(message);
          for (const memory of inferredUserMemories) {
            await upsertUserMemoryWithEmbedding(
              policy.userId,
              memory.content,
              memory.memoryType,
              memory.importance,
            );
          }
        } catch {
          // User memory extraction is additive and non-fatal.
        }
      });
    }

    setImmediate(async () => {
      try {
        await extractPersonaPreferences();
      } catch {
        // Preference extraction is additive and non-fatal.
      }
    });

    return res.json(responsePayload);
  } catch (error) {
    if (stream.fail(error)) {
      return;
    }

    return next(error);
  }
}

export function chatHistoryHandler(req, res, next) {
  try {
    const personalityId = Number(req.params.id);

    if (!Number.isInteger(personalityId)) {
      return res.status(400).json({ error: "A valid personality id is required." });
    }

    const personality = getPersonalityById(personalityId);

    if (!personality) {
      return res.status(404).json({ error: "Personality not found." });
    }

    const messages = getChatMessages(personalityId, 50).map((message) => {
      if (message.role !== "assistant") {
        return {
          ...message,
          displayContent: message.content,
          isPerformanceOutput: false,
        };
      }

      const presentation = buildAssistantPresentation(message.content);
      return {
        ...message,
        displayContent: presentation.displayReply,
        isPerformanceOutput: presentation.isPerformanceOutput,
      };
    });

    return res.json(messages);
  } catch (error) {
    return next(error);
  }
}
