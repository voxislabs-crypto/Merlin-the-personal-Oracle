/**
 * councilController.js
 *
 * Express handlers for the Voxis Council API.
 * These endpoints are the bridge between CoE (or any external orchestrator)
 * and a Voxis personality.
 *
 * POST /api/council/:id/propose
 * POST /api/council/:id/critique
 * GET  /api/council/:id/info
 * PUT  /api/council/:id/llm-config  (save per-personality LLM binding)
 */

import { getPersonalityById, updatePersonality } from "../models/personalityModel.js";
import { generateProposal, generateCritique } from "../services/councilService.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPersonalityOrFail(res, id) {
  const personality = getPersonalityById(Number(id));
  if (!personality) {
    res.status(404).json({ error: "Personality not found." });
    return null;
  }
  return personality;
}

// ---------------------------------------------------------------------------
// GET /api/council/:id/info
// Returns public metadata about this personality as a council seat.
// CoE uses this to display the seat label, model, and capabilities.
// ---------------------------------------------------------------------------

export async function councilInfoHandler(req, res, next) {
  try {
    const personality = getPersonalityOrFail(res, req.params.id);
    if (!personality) return;

    const llmConfig = personality.llmConfig || {};
    res.json({
      personalityId: personality.id,
      name: personality.name,
      description: personality.description,
      traits: personality.traits,
      boundModel: llmConfig.model || null,
      boundProvider: llmConfig.provider || null,
      hasBoundLlm: Boolean(llmConfig.apiKey && llmConfig.model),
      bigFiveProfile: personality.bigFiveProfile,
      alignmentProfile: personality.alignmentProfile,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/council/:id/propose
// Body: { question, context?, peers? }
// Returns a CoE-compatible Proposal object.
// ---------------------------------------------------------------------------

export async function councilProposeHandler(req, res, next) {
  try {
    const personality = getPersonalityOrFail(res, req.params.id);
    if (!personality) return;

    const { question, context = "", peers = [] } = req.body;

    if (!question || typeof question !== "string" || question.trim().length < 5) {
      return res.status(400).json({ error: "question is required (min 5 characters)." });
    }

    if (question.length > 4000) {
      return res.status(400).json({ error: "question must be 4000 characters or fewer." });
    }

    if (context && typeof context !== "string") {
      return res.status(400).json({ error: "context must be a string." });
    }

    const proposal = await generateProposal({
      personality,
      question: question.trim(),
      context: typeof context === "string" ? context.slice(0, 12000) : "",
      peers: Array.isArray(peers) ? peers.map(String).filter(Boolean) : [],
    });

    res.json(proposal);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/council/:id/critique
// Body: { question, context?, targetProposal, peerProposals? }
// Returns a CoE-compatible Critique object.
// ---------------------------------------------------------------------------

export async function councilCritiqueHandler(req, res, next) {
  try {
    const personality = getPersonalityOrFail(res, req.params.id);
    if (!personality) return;

    const { question, context = "", targetProposal, peerProposals = [] } = req.body;

    if (!question || typeof question !== "string" || question.trim().length < 5) {
      return res.status(400).json({ error: "question is required (min 5 characters)." });
    }

    if (!targetProposal || typeof targetProposal !== "object") {
      return res.status(400).json({ error: "targetProposal is required." });
    }

    if (!targetProposal.agentId || !targetProposal.summary) {
      return res.status(400).json({ error: "targetProposal must include agentId and summary." });
    }

    const critique = await generateCritique({
      personality,
      question: question.trim(),
      context: typeof context === "string" ? context.slice(0, 12000) : "",
      targetProposal,
      peerProposals: Array.isArray(peerProposals) ? peerProposals : [],
    });

    res.json(critique);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/council/:id/llm-config
// Body: { provider, baseUrl, model, apiKey, temperature? }
// Saves LLM binding to the personality. apiKey is stored — treat as sensitive.
// ---------------------------------------------------------------------------

export async function councilSaveLlmConfigHandler(req, res, next) {
  try {
    const personality = getPersonalityOrFail(res, req.params.id);
    if (!personality) return;

    const { provider, baseUrl, model, apiKey, temperature } = req.body;

    if (!model || typeof model !== "string") {
      return res.status(400).json({ error: "model is required." });
    }

    if (!baseUrl || typeof baseUrl !== "string") {
      return res.status(400).json({ error: "baseUrl is required." });
    }

    // We accept an empty apiKey string to allow clearing the config
    const llmConfig = {
      provider: String(provider || "").trim(),
      baseUrl: String(baseUrl).trim().replace(/\/$/, ""),
      model: String(model).trim(),
      apiKey: typeof apiKey === "string" ? apiKey.trim() : "",
      temperature: typeof temperature === "number" ? Math.min(2, Math.max(0, temperature)) : 0.85,
    };

    const updated = updatePersonality(personality.id, { ...personality, llmConfig });

    // Never echo the apiKey back in the response
    const { llmConfig: saved } = updated;
    res.json({
      personalityId: updated.id,
      llmConfig: {
        provider: saved.provider,
        baseUrl: saved.baseUrl,
        model: saved.model,
        temperature: saved.temperature,
        hasApiKey: Boolean(saved.apiKey),
      },
    });
  } catch (err) {
    next(err);
  }
}
