// backend/services/personaFromVoxis.js

/**
 * Improved extraction logic that analyzes the full conversation
 * and Voxis's final reply to build a coherent persona
 */
export const createPersonaFromConversation = (messages, voxisFinalReply) => {
  const fullContext = messages.map(m => `${m.role}: ${m.content}`).join("\n") + 
                     `\nVoxis: ${voxisFinalReply}`;

  // Basic keyword/intent detection
  const text = (fullContext + voxisFinalReply).toLowerCase();

  const traits = [];
  const quirks = [];
  let name = "Unnamed Persona";
  let description = voxisFinalReply.substring(0, 160) + "...";
  let creativeContext = "default";
  let darkHumor = false;
  let energyLevel = 0.6;

  // Name detection
  const nameMatch = voxisFinalReply.match(/(?:name|call(?:ed|s)?|known as)\s+(?:him|her|them|it)?\s*["']?([A-Za-z\s-]{2,30})/i);
  if (nameMatch) name = nameMatch[1].trim();

  // Trait detection
  if (text.includes("evil") || text.includes("villain") || text.includes("dark")) traits.push("evil");
  if (text.includes("calm") || text.includes("polite")) traits.push("calm", "polite");
  if (text.includes("funny") || text.includes("humor") || text.includes("joke")) {
    traits.push("witty");
    darkHumor = true;
  }
  if (text.includes("bunny") || text.includes("rabbit")) quirks.push("has a soft spot for bunnies");

  // Energy level
  if (text.includes("high energy") || text.includes("energetic") || text.includes("loud")) energyLevel = 0.85;
  if (text.includes("low energy") || text.includes("calm")) energyLevel = 0.35;

  // Creative context
  if (traits.includes("evil") || text.includes("villain")) creativeContext = "narrative_antagonist";
  if (text.includes("anti-hero") || text.includes("morally gray")) creativeContext = "anti_hero";

  // Build description if it's too generic
  if (description.length < 50) {
    description = `A ${traits.join(" and ")} character with ${quirks.length ? quirks.join(", ") : "distinctive quirks"}.`;
  }

  return {
    name,
    description,
    traits: [...new Set(traits)],           // remove duplicates
    quirks: [...new Set(quirks)],
    speechStyle: "Calm and polite on the surface, with sharp dark humor underneath",
    creativeContext,
    moodBaseline: { 
      valence: darkHumor ? -0.3 : -0.5, 
      arousal: energyLevel - 0.2, 
      dominance: 0.65 
    },
    energyLevel,
    darkHumor,
    notes: `Created through natural conversation with Voxis on ${new Date().toISOString().split('T')[0]}` 
  };
};
