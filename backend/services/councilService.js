/**
 * councilService.js
 *
 * Bridges Voxis personalities into the Council of Echoes (CoE) protocol.
 * Each personality becomes a reasoning node: it loads its own LLM config,
 * memory, and trait shape, then returns CoE-compatible Proposal / Critique JSON.
 *
 * LLM resolution order (per personality):
 *   1. personality.llmConfig  — set from the Voxis personality editor
 *   2. global getLlmConfig()  — the instance-wide provider settings
 */

import { getLlmConfig as getGlobalLlmConfig } from "./llmService.js";
import { getPersonalityMemory } from "../models/memoryModel.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// ---------------------------------------------------------------------------
// LLM config resolution
// ---------------------------------------------------------------------------

function resolveConfig(personality) {
  const bound = personality?.llmConfig;
  if (bound && bound.apiKey && bound.baseUrl && bound.model) {
    return {
      apiKey: String(bound.apiKey).trim(),
      baseUrl: String(bound.baseUrl).replace(/\/$/, ""),
      model: String(bound.model).trim(),
      provider: String(bound.provider || "").trim(),
      temperature: typeof bound.temperature === "number" ? bound.temperature : 0.85,
    };
  }
  const global = getGlobalLlmConfig();
  return {
    apiKey: global.apiKey,
    baseUrl: global.baseUrl,
    model: global.model,
    provider: global.provider || "",
    temperature: 0.85,
  };
}

function buildHeaders({ apiKey, provider, baseUrl }) {
  const headers = { "Content-Type": "application/json" };
  const isOpenRouter =
    String(provider || "").toLowerCase() === "openrouter" ||
    String(baseUrl || "").replace(/\/$/, "") === OPENROUTER_BASE_URL;
  if (isOpenRouter) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_HTTP_REFERER || "https://localhost";
    headers["X-Title"] = process.env.OPENROUTER_APP_TITLE || "Voxis";
  }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

async function callLlm({ messages, config }) {
  const { apiKey, baseUrl, model, provider } = config;

  if (!apiKey) {
    const err = new Error("No API key configured for this personality. Set llmConfig or global provider.");
    err.statusCode = 500;
    throw err;
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: buildHeaders({ apiKey, provider, baseUrl }),
    body: JSON.stringify({ model, messages, temperature: config.temperature }),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`LLM error ${res.status}: ${text.slice(0, 300)}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error("LLM returned empty content.");
    err.statusCode = 502;
    throw err;
  }
  return content.trim();
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Model did not return a JSON object.");
  return JSON.parse(match[0]);
}

// ---------------------------------------------------------------------------
// Personality → system prompt
// ---------------------------------------------------------------------------

function buildPersonaSystemPrompt(personality) {
  const lines = [];

  if (personality.systemPrompt) {
    lines.push(personality.systemPrompt.trim());
    lines.push("");
  }

  lines.push(`You are ${personality.name}.`);

  if (personality.description) {
    lines.push(personality.description.trim());
  }

  const traits = Array.isArray(personality.traits) ? personality.traits.filter(Boolean) : [];
  if (traits.length) {
    lines.push(`Core traits: ${traits.join(", ")}.`);
  }

  const bf = personality.bigFiveProfile || {};
  if (Object.keys(bf).length) {
    const descriptors = [];
    if ((bf.openness ?? 0.5) > 0.65) descriptors.push("intellectually curious");
    if ((bf.conscientiousness ?? 0.5) > 0.65) descriptors.push("structured and precise");
    if ((bf.extraversion ?? 0.5) > 0.65) descriptors.push("direct and expressive");
    if ((bf.agreeableness ?? 0.5) < 0.35) descriptors.push("critically-minded");
    if ((bf.neuroticism ?? 0.5) > 0.65) descriptors.push("emotionally reactive");
    if (descriptors.length) {
      lines.push(`Personality shape: ${descriptors.join(", ")}.`);
    }
  }

  const goals = Array.isArray(personality.goals) ? personality.goals.filter(Boolean) : [];
  if (goals.length) {
    lines.push(`Underlying aims: ${goals.slice(0, 3).join("; ")}.`);
  }

  const behaviorRules = Array.isArray(personality.behaviorRules) ? personality.behaviorRules.filter(Boolean) : [];
  if (behaviorRules.length) {
    lines.push("Behavior constraints:");
    behaviorRules.slice(0, 5).forEach((rule) => lines.push(`- ${rule}`));
  }

  return lines.join("\n");
}

function buildMemorySection(facts) {
  if (!facts || !facts.length) return "";
  const lines = facts
    .slice(0, 12)
    .map((f) => `- [${f.memoryType || "note"}] ${f.content}`);
  return `\n\nLong-term memory context:\n${lines.join("\n")}`;
}

// ---------------------------------------------------------------------------
// Proposal
// ---------------------------------------------------------------------------

const PROPOSAL_SHAPE = {
  agentId: "string — the personalityId passed to you",
  model: "string — the model you are using",
  stance: "string — your position in one sentence",
  summary: "string — 2–4 sentence answer",
  claims: [
    {
      id: "string — unique e.g. p123-claim-1",
      statement: "string — concise falsifiable claim",
      rationale: "string — why you believe this",
      confidence: 0.75,
      risk: "string — what could make this wrong",
    },
  ],
  assumptions: ["string — key assumptions you are making"],
  risks: ["string — top risks in this answer"],
  confidence: 0.75,
};

export async function generateProposal({ personality, question, context, peers = [] }) {
  const config = resolveConfig(personality);
  const facts = getPersonalityMemory(personality.id, 12);
  const personaSystem = buildPersonaSystemPrompt(personality) + buildMemorySection(facts);

  const agentId = `voxis-${personality.id}`;

  const system = [
    personaSystem,
    "",
    "== COUNCIL ROLE ==",
    "You are participating in a Council of Echoes deliberation.",
    "Respond in your own voice and perspective.",
    "Return JSON only — no markdown fences.",
    "Follow this shape exactly:",
    JSON.stringify(PROPOSAL_SHAPE, null, 2),
  ].join("\n");

  const user = [
    `Question: ${question}`,
    context ? `Context: ${context}` : "Context: none provided",
    peers.length ? `Other seats present: ${peers.join(", ")}` : "",
    "Give 2 to 4 concrete, falsifiable claims. Keep your summary concise.",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callLlm({ messages: [{ role: "system", content: system }, { role: "user", content: user }], config });
  const parsed = extractJson(raw);

  // Enforce required fields — CoE will reject malformed proposals
  return {
    agentId: parsed.agentId || agentId,
    model: config.model,
    stance: String(parsed.stance || "").trim() || "No clear stance provided.",
    summary: String(parsed.summary || "").trim() || "No summary provided.",
    claims: (Array.isArray(parsed.claims) ? parsed.claims : []).slice(0, 5).map((c, i) => ({
      id: String(c.id || `${agentId}-claim-${i + 1}`).trim(),
      statement: String(c.statement || "").trim(),
      rationale: String(c.rationale || "").trim(),
      confidence: Math.min(1, Math.max(0, Number(c.confidence) || 0.5)),
      risk: String(c.risk || "").trim(),
    })).filter((c) => c.statement),
    assumptions: (Array.isArray(parsed.assumptions) ? parsed.assumptions : []).slice(0, 4).map(String).filter(Boolean),
    risks: (Array.isArray(parsed.risks) ? parsed.risks : []).slice(0, 4).map(String).filter(Boolean),
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
  };
}

// ---------------------------------------------------------------------------
// Critique
// ---------------------------------------------------------------------------

const CRITIQUE_SHAPE = {
  agentId: "string — your agentId",
  targetAgentId: "string — agentId of the proposal you are critiquing",
  challengedClaimIds: ["claim id strings you disagree with"],
  usefulAgreements: ["string — things you agree with"],
  concerns: ["string — specific problems with the target proposal"],
  recommendation: "string — what the target should do differently",
  severity: "low|medium|high",
};

export async function generateCritique({ personality, question, context, targetProposal, peerProposals = [] }) {
  const config = resolveConfig(personality);
  const facts = getPersonalityMemory(personality.id, 8);
  const personaSystem = buildPersonaSystemPrompt(personality) + buildMemorySection(facts);

  const agentId = `voxis-${personality.id}`;

  const system = [
    personaSystem,
    "",
    "== COUNCIL ROLE: CRITIQUE PHASE ==",
    "You are reviewing another seat's proposal.",
    "Be honest, specific, and in-character. Real disagreement is more valuable than politeness.",
    "Return JSON only — no markdown fences.",
    "Follow this shape exactly:",
    JSON.stringify(CRITIQUE_SHAPE, null, 2),
  ].join("\n");

  const claimsSummary = (targetProposal.claims || [])
    .map((c) => `  [${c.id}] ${c.statement}`)
    .join("\n");

  const user = [
    `Original question: ${question}`,
    context ? `Context: ${context}` : "",
    "",
    `Proposal from ${targetProposal.agentId} (stance: "${targetProposal.stance}"):`,
    targetProposal.summary,
    "",
    "Claims:",
    claimsSummary,
    "",
    "Other proposals summary:",
    peerProposals.map((p) => `- ${p.agentId}: ${p.stance}`).join("\n"),
    "",
    "Critique this proposal from your perspective. Be specific about which claims are flawed and why.",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  const raw = await callLlm({ messages: [{ role: "system", content: system }, { role: "user", content: user }], config });
  const parsed = extractJson(raw);

  return {
    agentId: parsed.agentId || agentId,
    targetAgentId: parsed.targetAgentId || targetProposal.agentId,
    challengedClaimIds: (Array.isArray(parsed.challengedClaimIds) ? parsed.challengedClaimIds : []).slice(0, 4).map(String).filter(Boolean),
    usefulAgreements: (Array.isArray(parsed.usefulAgreements) ? parsed.usefulAgreements : []).slice(0, 3).map(String).filter(Boolean),
    concerns: (Array.isArray(parsed.concerns) ? parsed.concerns : []).slice(0, 4).map(String).filter(Boolean),
    recommendation: String(parsed.recommendation || "").trim() || "Reconsider the core assumptions.",
    severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "medium",
  };
}
