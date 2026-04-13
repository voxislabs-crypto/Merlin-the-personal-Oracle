// ---------------------------------------------------------------------------
// Persona Preference Memory Model
//
// Each persona maintains a persistent table of emotional preferences:
//   - What they love / like / find exciting
//   - What they hate / dislike / find annoying / offending / boring
//
// These preferences are matched against user messages each turn and feed a
// dedicated VAD delta into the mood engine, ensuring that villains stay angry
// when their triggers are hit and warm characters genuinely light up over their
// favorite topics.
// ---------------------------------------------------------------------------

import db from "../db/db.js";

// Valid preference type values.
export const PREF_TYPES = new Set([
  "loves",
  "likes",
  "excites",
  "hates",
  "dislikes",
  "annoys",
  "offends",
  "bores",
]);

// Positive vs negative classification maps.
export const POSITIVE_PREF_TYPES = new Set(["loves", "likes", "excites"]);
export const NEGATIVE_PREF_TYPES = new Set(["hates", "dislikes", "annoys", "offends", "bores"]);

// Maximum number of preference entries to retain per persona.
const PREFS_MAX = 80;

function normalizeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    personalityId: row.personalityId,
    prefType: row.prefType,
    content: row.content,
    importance: row.importance,
    source: row.source,
    createdAt: row.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export function getPersonaPreferences(personalityId) {
  return db
    .prepare(
      `SELECT id, personalityId, prefType, content, importance, source, createdAt
       FROM persona_preferences
       WHERE personalityId = ?
       ORDER BY importance DESC, id DESC`,
    )
    .all(personalityId)
    .map(normalizeRow);
}

export function getPersonaPreferencesByType(personalityId, prefType) {
  return db
    .prepare(
      `SELECT id, personalityId, prefType, content, importance, source, createdAt
       FROM persona_preferences
       WHERE personalityId = ? AND prefType = ?
       ORDER BY importance DESC, id DESC`,
    )
    .all(personalityId, prefType)
    .map(normalizeRow);
}

// ---------------------------------------------------------------------------
// Write — upsert by (personalityId + content) to avoid duplicates.
// If the same content already exists, raise importance if the new value is higher.
// ---------------------------------------------------------------------------

export function upsertPersonaPreference(
  personalityId,
  prefType,
  content,
  importance = 7,
  source = "learned",
) {
  const normalizedContent = String(content || "").trim().slice(0, 300);
  if (!normalizedContent) return null;

  const safePrefType = PREF_TYPES.has(prefType) ? prefType : "likes";
  const safeImportance = Math.min(10, Math.max(1, Number(importance) || 7));

  const existing = db
    .prepare(
      `SELECT id, importance, prefType
       FROM persona_preferences
       WHERE personalityId = ? AND content = ?`,
    )
    .get(personalityId, normalizedContent);

  if (existing) {
    // Update prefType + importance if either changed to something higher-priority.
    const shouldUpdate =
      safeImportance > existing.importance || existing.prefType !== safePrefType;
    if (shouldUpdate) {
      db.prepare(
        `UPDATE persona_preferences
         SET prefType = ?, importance = ?
         WHERE id = ?`,
      ).run(safePrefType, Math.max(safeImportance, existing.importance), existing.id);
    }
    return existing.id;
  }

  const result = db
    .prepare(
      `INSERT INTO persona_preferences (personalityId, prefType, content, importance, source)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(personalityId, safePrefType, normalizedContent, safeImportance, source || "learned");

  return result.lastInsertRowid;
}

// ---------------------------------------------------------------------------
// Prune — keep only the top-N most important preferences per persona.
// ---------------------------------------------------------------------------

export function prunePersonaPreferences(personalityId, max = PREFS_MAX) {
  const ids = db
    .prepare(
      `SELECT id FROM persona_preferences
       WHERE personalityId = ?
       ORDER BY importance DESC, id DESC
       LIMIT -1 OFFSET ?`,
    )
    .all(personalityId, max)
    .map((row) => row.id);

  if (ids.length === 0) return;

  const placeholders = ids.map(() => "?").join(",");
  db.prepare(
    `DELETE FROM persona_preferences WHERE id IN (${placeholders})`,
  ).run(...ids);
}

// ---------------------------------------------------------------------------
// Delete / Update — for manual management via API
// ---------------------------------------------------------------------------

export function updatePersonaPreference(id, { prefType, content, importance }) {
  const safePrefType = PREF_TYPES.has(prefType) ? prefType : undefined;
  const row = db
    .prepare(`SELECT id FROM persona_preferences WHERE id = ?`)
    .get(id);
  if (!row) return null;

  const updates = [];
  const params = [];

  if (safePrefType) {
    updates.push("prefType = ?");
    params.push(safePrefType);
  }
  if (content && typeof content === "string" && content.trim()) {
    updates.push("content = ?");
    params.push(content.trim().slice(0, 300));
  }
  if (importance !== undefined) {
    updates.push("importance = ?");
    params.push(Math.min(10, Math.max(1, Number(importance) || 7)));
  }

  if (updates.length === 0) return null;

  params.push(id);
  db.prepare(
    `UPDATE persona_preferences SET ${updates.join(", ")} WHERE id = ?`,
  ).run(...params);

  return db
    .prepare(`SELECT id, personalityId, prefType, content, importance, source, createdAt FROM persona_preferences WHERE id = ?`)
    .get(id);
}

export function deletePersonaPreference(id) {
  db.prepare(`DELETE FROM persona_preferences WHERE id = ?`).run(id);
}
