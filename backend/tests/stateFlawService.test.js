import { describe, expect, it } from "vitest";

import {
  normalizeStateFlaws,
  stepStateFlaws,
  buildStateDriftDirectives,
  buildStateFlawPromptSection,
} from "../services/stateFlawService.js";

describe("stateFlawService PersonaStateEngine", () => {
  it("normalizes missing channels with safe defaults", () => {
    const normalized = normalizeStateFlaws({});
    expect(normalized).toHaveProperty("intoxication");
    expect(normalized).toHaveProperty("fatigue");
    expect(normalized).toHaveProperty("agitation");
    expect(normalized).toHaveProperty("focus");
    expect(normalized.focus.level).toBeGreaterThan(0);
  });

  it("applies trigger and decay updates across channels", () => {
    const stepped = stepStateFlaws({
      stateFlaws: {
        intoxication: { enabled: true, level: 0.5, decayPerTurn: 0.02, triggerGain: 0.2, triggerKeywords: ["drink"] },
        fatigue: { enabled: true, level: 0.2, decayPerTurn: 0.01, passiveGainPerTurn: 0.02, triggerGain: 0.1, triggerKeywords: ["tired"] },
        agitation: { enabled: true, level: 0.1, decayPerTurn: 0.02, triggerGain: 0.15, triggerKeywords: ["idiot"] },
        focus: { enabled: true, level: 0.8, decayPerTurn: 0.01, recoveryPerTurn: 0.03, triggerGain: 0.05, triggerKeywords: ["focus"] },
      },
      userMessage: "I need to focus after one drink, idiot, because I am tired",
    });

    expect(stepped.stateFlaws.intoxication.level).toBeGreaterThan(0.5);
    expect(stepped.stateFlaws.fatigue.level).toBeGreaterThan(0.2);
    expect(stepped.stateFlaws.agitation.level).toBeGreaterThan(0.1);
    expect(stepped.stateFlaws.focus.level).toBeGreaterThan(0.6);
    expect(stepped.stabilityIndex).toBeGreaterThanOrEqual(0);
    expect(stepped.stabilityIndex).toBeLessThanOrEqual(1);
  });

  it("derives drift directives and prompt section", () => {
    const stateFlaws = {
      intoxication: { enabled: true, level: 0.7 },
      fatigue: { enabled: true, level: 0.4 },
      agitation: { enabled: true, level: 0.3 },
      focus: { enabled: true, level: 0.5 },
    };

    const directives = buildStateDriftDirectives(stateFlaws);
    expect(directives.coherencePenalty).toBeGreaterThan(0);
    expect(directives.impulseBurpChance).toBeGreaterThan(0);

    const section = buildStateFlawPromptSection(stateFlaws);
    expect(section).toContain("STATE DRIFT");
    expect(section).toContain("Intoxication");
  });
});
