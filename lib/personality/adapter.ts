import { type MBTIType, type TypeConfig, typeConfigs } from "@shared/schema";

function infuseMotivators(text: string, motivators: string[]): string {
  const insertIndex = Math.floor(text.length / 2);
  const motivator = motivators[Math.floor(Math.random() * motivators.length)];
  return (
    text.slice(0, insertIndex) +
    `, infused with ${motivator},` +
    text.slice(insertIndex)
  );
}

function adjustTone(text: string, tone: TypeConfig["tone"]): string {
  // eslint-disable-next-line no-unused-vars
  const toneAdjustments: Record<TypeConfig["tone"], (_: string) => string> = {
    epic: (t) =>
      t
        .replace(/today/gi, "in this momentous era")
        .replace(/celebrate/gi, "honor the eternal"),
    action: (t) => t.toUpperCase() + "!",
    logical: (t) => `Logically, ${t}.`,
    empathetic: (t) => `I understand how ${t} feels.`,
    adventurous: (t) => `Imagine ${t} as an epic quest!`,
    structured: (t) => `Step 1: ${t}.`,
    introspective: (t) => `Reflect on ${t}.`,
    social: (t) => `Share ${t} with friends.`,
  };
  return toneAdjustments[tone](text);
}

function adjustStructure(
  text: string,
  structure: TypeConfig["structure"],
): string {
  // eslint-disable-next-line no-unused-vars
  const structures: Record<TypeConfig["structure"], (_: string) => string> = {
    bullets: (t) => `- ${t.split(". ").join("\n- ")}`,
    paragraph: (t) => t,
    questions: (t) => `What if ${t}? Have you considered?`,
    commands: (t) => `Do this: ${t}. Now.`,
  };
  return structures[structure](text);
}

export function adaptMessage(mbtiType: MBTIType, rawMessage: string): string {
  const config = typeConfigs[mbtiType];
  if (!config) {
    throw new Error(`Unknown MBTI type: ${mbtiType}`);
  }
  let adapted = rawMessage;
  adapted = infuseMotivators(adapted, config.motivators);
  adapted = adjustTone(adapted, config.tone);
  const targetLength = Math.floor(adapted.length * config.lengthMultiplier);
  if (targetLength > adapted.length) {
    adapted += " " + adapted.slice(0, targetLength - adapted.length);
  } else {
    adapted = adapted.slice(0, targetLength);
  }
  adapted = adjustStructure(adapted, config.structure);
  adapted = `You know, deep down, ${adapted}`;
  return adapted;
}

export function getTypeConfig(mbtiType: MBTIType): TypeConfig {
  return typeConfigs[mbtiType];
}