import { generateChatCompletion } from "./llmService.js";
import { upsertMemoryFact } from "../models/memoryModel.js";

const PREFERENCE_EXTRACTION_PROMPT = `You are a user preference learning system.

Your job: Extract user preference signals from this interaction about personality creation/modification.

Analyze the user's requests and identify patterns like:
- Prefers high-energy or low-energy personalities
- Likes chaotic or calm personalities
- Prefers dark humor or light humor
- Tends to increase/decrease specific parameters
- Frequently requests specific traits

Return JSON only:
{
  "preferences": [
    {
      "key": "preference_key",
      "value": true/false/string,
      "confidence": 0.0-1.0,
      "reasoning": "why this preference was inferred"
    }
  ]
}

Example preferences:
- "likes_high_energy": true
- "prefers_chaotic_personas": true
- "prefers_dark_humor": true
- "tends_to_increase_energy": true
- "likes_quirky_personalities": true

Only include preferences with confidence > 0.6.`;

export async function extractUserPreferences(conversation, appliedPatch = null) {
  try {
    const context = [];
    
    // Add conversation summary
    if (Array.isArray(conversation)) {
      const userMessages = conversation
        .filter(m => m.role === "user")
        .map(m => m.content)
        .join("\n");
      context.push(`User requests:\n${userMessages}`);
    }

    // Add applied patch context if available
    if (appliedPatch && appliedPatch.changes) {
      context.push(`Applied changes:\n${JSON.stringify(appliedPatch.changes, null, 2)}`);
    }

    const messages = [
      { role: "system", content: PREFERENCE_EXTRACTION_PROMPT },
      {
        role: "user",
        content: `Interaction context:\n${context.join("\n\n")}\n\nExtract user preferences.`
      }
    ];

    const response = await generateChatCompletion(messages);
    
    let parsed;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("[PreferenceLearning] JSON parse error:", parseError);
      return {
        success: false,
        error: "Failed to parse preferences",
      };
    }

    if (!Array.isArray(parsed.preferences)) {
      return {
        success: false,
        error: "Invalid preferences format",
      };
    }

    // Filter by confidence
    const highConfidencePreferences = parsed.preferences.filter(p => p.confidence > 0.6);

    console.log("[PreferenceLearning] Extracted preferences:", highConfidencePreferences);

    return {
      success: true,
      preferences: highConfidencePreferences,
    };
  } catch (error) {
    console.error("[PreferenceLearning] Error extracting preferences:", error);
    return {
      success: false,
      error: error.message || "Failed to extract preferences",
    };
  }
}

export async function storeUserPreferences(userId, preferences) {
  if (!Array.isArray(preferences) || preferences.length === 0) {
    return { success: true, stored: 0 };
  }

  try {
    let storedCount = 0;

    for (const pref of preferences) {
      const memoryContent = `User preference: ${pref.key} = ${pref.value}. ${pref.reasoning || ""} (confidence: ${pref.confidence})`;
      
      // Store as a memory item with high importance for preferences
      // Note: Using personalityId 0 for system-wide preferences (not tied to specific persona)
      upsertMemoryFact(
        0, 
        memoryContent, 
        "preference", 
        7
      );

      storedCount++;
    }

    console.log(`[PreferenceLearning] Stored ${storedCount} preferences for user ${userId}`);

    return {
      success: true,
      stored: storedCount,
    };
  } catch (error) {
    console.error("[PreferenceLearning] Error storing preferences:", error);
    return {
      success: false,
      error: error.message || "Failed to store preferences",
    };
  }
}

export async function getUserPreferences(userId) {
  // This would query the memory system for preference-type memories
  // For now, return empty - implementation would depend on memoryModel structure
  return {
    success: true,
    preferences: [],
  };
}
