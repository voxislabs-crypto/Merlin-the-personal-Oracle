/**
 * voiceBufferService
 *
 * Server-side in-memory store for parallel voice buffer entries collected
 * while the AI was speaking. These arrive pre-classified from the frontend
 * and are injected into the next chat turn as system context.
 *
 * The buffer is keyed by conversationKey (personalityId:userId) and
 * auto-evicts after TTL_MS of inactivity.
 *
 * This module is intentionally stateless w.r.t. persistence — the buffer
 * supplements the LLM prompt but is not stored in the DB (it's ephemeral
 * conversational signal, not long-term memory).
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes

/** @type {Map<string, { items: Array<{text:string, classification:string, ts:number}>, lastAccessMs: number }>} */
const store = new Map();

// ─── Eviction ─────────────────────────────────────────────────────────────

const evictionInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastAccessMs > TTL_MS) {
      store.delete(key);
    }
  }
}, 60_000);

// Prevent the interval from keeping Node alive during tests
if (evictionInterval.unref) evictionInterval.unref();

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Adds a classified utterance to the buffer for a given conversation.
 * Normally called indirectly — the frontend includes the buffer in the
 * POST body and `drainFromRequestBody` handles it. This function is
 * available for any direct-push use (e.g. future WebSocket path).
 *
 * @param {string} key            Conversation key (e.g. `${personalityId}:${userId}`)
 * @param {string} text           Raw utterance text
 * @param {string} classification 'hard_interrupt' | 'filler' | 'substantive'
 */
export function pushToBuffer(key, text, classification = "substantive") {
  if (!key || !text) return;

  if (!store.has(key)) {
    store.set(key, { items: [], lastAccessMs: Date.now() });
  }
  const entry = store.get(key);
  entry.items.push({ text, classification, ts: Date.now() });
  entry.lastAccessMs = Date.now();
}

/**
 * Returns all buffered items for the given key and removes them from the store.
 *
 * @param {string} key
 * @returns {Array<{text:string, classification:string, ts:number}>}
 */
export function drainBuffer(key) {
  if (!key || !store.has(key)) return [];
  const { items } = store.get(key);
  store.delete(key);
  return items;
}

/**
 * Extracts the voice buffer from an Express request body, optionally merges it
 * with any server-side buffer for the same key, and returns the combined array.
 *
 * Items arrive from the frontend as:
 *   req.body.voiceBuffer = [{ text, classification, ts }, ...]
 *
 * @param {import("express").Request} req
 * @param {string} conversationKey
 * @returns {Array<{text:string, classification:string, ts:number}>}
 */
export function drainFromRequestBody(req, conversationKey) {
  const fromBody = Array.isArray(req.body?.voiceBuffer) ? req.body.voiceBuffer : [];

  // Validate each item to prevent injection via untrusted body data
  const sanitized = fromBody
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      text: String(item.text ?? "").slice(0, 500).trim(),
      classification: ["hard_interrupt", "filler", "substantive"].includes(item.classification)
        ? item.classification
        : "substantive",
      ts: Number.isFinite(item.ts) ? item.ts : Date.now(),
    }))
    .filter((item) => item.text.length > 0);

  // Merge with anything that was pushed server-side (future WebSocket path)
  const serverSide = drainBuffer(conversationKey);

  return [...serverSide, ...sanitized].sort((a, b) => a.ts - b.ts);
}

/**
 * Builds a concise system-prompt injection for the voice buffer items.
 * Only included when there are non-trivial (non-filler) utterances.
 *
 * @param {Array<{text:string, classification:string}>} items
 * @returns {string|null}  System prompt fragment, or null if nothing useful
 */
export function buildVoiceBufferPromptSection(items) {
  if (!items || items.length === 0) return null;

  const substantive = items.filter((i) => i.classification === "substantive");
  const interrupts   = items.filter((i) => i.classification === "hard_interrupt");
  const fillers      = items.filter((i) => i.classification === "filler");

  if (substantive.length === 0 && interrupts.length === 0) return null;

  const lines = ["== PARALLEL VOICE CONTEXT =="];
  lines.push(
    "While you were speaking the user was also heard saying the following (captured in parallel, before their main reply).",
    "Use this to inform tone, correct course, or acknowledge — but DO NOT repeat or quote it verbatim.",
  );

  if (interrupts.length > 0) {
    lines.push(
      "",
      `INTERRUPTION SIGNALS (${interrupts.length}): The user tried to stop or redirect you.`,
      interrupts.map((i) => `  · "${i.text}"`).join("\n"),
      "→ Acknowledge the interruption briefly, then respond to their actual message.",
    );
  }

  if (substantive.length > 0) {
    lines.push(
      "",
      "BACKGROUND COMMENTARY (captured while you were speaking):",
      substantive.map((i) => `  · "${i.text}"`).join("\n"),
    );
  }

  if (fillers.length > 0) {
    lines.push(`\nFILLER SOUNDS: ${fillers.length} filler utterance(s) captured — no action needed.`);
  }

  lines.push("== END PARALLEL VOICE CONTEXT ==");
  return lines.join("\n");
}
