import { describe, expect, it } from "vitest";
import db from "../db/db.js";
import {
  getPersonaPreferences,
  upsertPersonaPreference,
  reinforcePersonaPreferences,
  decayPersonaPreferences,
} from "../models/preferencesModel.js";

function ensurePersonality(id) {
  db.prepare(
    `INSERT OR IGNORE INTO personalities (id, name, description, traits, quirks, mood, systemPrompt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    `Test Persona ${id}`,
    "test persona",
    "[]",
    "[]",
    "neutral",
    "test prompt",
  );
}

describe("preferencesModel lifecycle", () => {
  it("resolves conflicting similar preferences by weighted dominance", () => {
    const personalityId = 910001;
    ensurePersonality(personalityId);
    db.prepare("DELETE FROM persona_preferences WHERE personalityId = ?").run(personalityId);

    const firstId = Number(upsertPersonaPreference(personalityId, "likes", "loud synth bass in the lab", 6, "learned"));
    const mergedId = Number(upsertPersonaPreference(personalityId, "hates", "loud synth bass at the lab", 9, "learned"));

    const prefs = getPersonaPreferences(personalityId);
    expect(mergedId).toBe(firstId);
    expect(prefs).toHaveLength(1);
    expect(prefs[0].prefType).toBe("hates");
    expect(prefs[0].importance).toBe(9);

    db.prepare("DELETE FROM persona_preferences WHERE personalityId = ?").run(personalityId);
  });

  it("reinforces matched preferences and updates trigger metadata", () => {
    const personalityId = 910002;
    ensurePersonality(personalityId);
    db.prepare("DELETE FROM persona_preferences WHERE personalityId = ?").run(personalityId);

    const prefId = Number(upsertPersonaPreference(personalityId, "annoys", "forced small talk", 6, "learned"));
    const changes = reinforcePersonaPreferences([prefId], 1);

    const pref = getPersonaPreferences(personalityId)[0];
    expect(changes).toBe(1);
    expect(pref.importance).toBe(7);
    expect(pref.triggerCount).toBeGreaterThanOrEqual(1);
    expect(String(pref.lastTriggeredAt || "").length).toBeGreaterThan(0);

    db.prepare("DELETE FROM persona_preferences WHERE personalityId = ?").run(personalityId);
  });

  it("decays inactive preferences without dropping below floor", () => {
    const personalityId = 910003;
    ensurePersonality(personalityId);
    db.prepare("DELETE FROM persona_preferences WHERE personalityId = ?").run(personalityId);

    const prefId = Number(upsertPersonaPreference(personalityId, "likes", "slow analytical walkthroughs", 8, "learned"));
    db.prepare(
      `UPDATE persona_preferences
       SET lastTriggeredAt = datetime('now', '-30 days'), updatedAt = datetime('now', '-30 days')
       WHERE id = ?`,
    ).run(prefId);

    const changed = decayPersonaPreferences(personalityId, {
      idleDays: 14,
      minImportance: 4,
      decayStep: 2,
    });

    const pref = getPersonaPreferences(personalityId)[0];
    expect(changed).toBe(1);
    expect(pref.importance).toBe(6);

    decayPersonaPreferences(personalityId, {
      idleDays: 14,
      minImportance: 4,
      decayStep: 10,
    });

    const floored = getPersonaPreferences(personalityId)[0];
    expect(floored.importance).toBe(4);

    db.prepare("DELETE FROM persona_preferences WHERE personalityId = ?").run(personalityId);
  });
});
