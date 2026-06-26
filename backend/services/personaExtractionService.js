import { generateChatCompletion } from "./llmService.js";

const INTENT_CLASSIFICATION_PROMPT = `Classify the user's intent for this interaction.

Return JSON only:
{
  "intent": "create" | "modify" | "unknown",
  "confidence": 0.0-1.0
}

Rules:
- "create" = building a new personality from scratch, describing a character for the first time
- "modify" = changing an existing selected personality, adjusting current behavior
- If unclear or ambiguous → "unknown"

Examples:
- "Create a Joker persona" → create
- "Make him laugh more" → modify
- "I want a chaotic character" → create
- "Adjust the energy level" → modify
- "Start over" → unknown (context needed)`;

const EXTRACTION_SYSTEM_PROMPT = `You are a persona extraction engine. Your task is to convert a conversation about creating a personality into structured personality parameters.

You MUST only output valid JSON. Do not include any explanatory text outside the JSON.

Supported fields (only use these):
- traits: array of personality trait strings (e.g., ["chaotic", "sarcastic", "intelligent"])
- mannerismFrequency: number between 0-1 (how often they use mannerisms)
- expressionStyle: object with "energy" field (number between 0-1)
- speechStyle: string describing their speech pattern

Rules:
- Clamp all numeric values between 0 and 1
- Infer reasonable defaults if information is unclear
- Do NOT invent new fields beyond the ones listed
- If a field cannot be determined from the conversation, omit it
- traits should be lowercase, single words or short phrases
- expressionStyle.energy: 0 = very calm/low energy, 1 = very high energy
- mannerismFrequency: 0 = rarely uses mannerisms, 1 = uses them frequently

Output format (JSON only):
{
  "traits": ["trait1", "trait2"],
  "mannerismFrequency": 0.5,
  "expressionStyle": { "energy": 0.7 },
  "speechStyle": "description of speech pattern"
}`;

const INTENT_TO_PATCH_PROMPT = `You are Voxis Intent Translator.

Your job is to convert a user's natural language request into a minimal, precise PATCH object that modifies an existing personality.

You DO NOT create full personalities.
You DO NOT rewrite entire structures.
You ONLY extract intent and express it as controlled parameter changes.

---

## CONTEXT

You are given:
1. The user's request (natural language)
2. The current personality object (JSON)

Your job:
→ Infer what the user wants changed
→ Map that to existing fields
→ Output ONLY the changes (diff-style)

---

## OUTPUT RULES (STRICT)

- Output MUST be valid JSON
- NO explanations
- NO comments
- NO markdown
- NO trailing commas

---

## PATCH FORMAT

{
  "type": "modify_persona",
  "confidence": 0.0-1.0,
  "changes": {
    // ONLY include fields that need to change
  },
  "reasoning": "short explanation of interpretation"
}

---

## FIELD MAPPING RULES

Translate vague intent into concrete parameters:

### Energy / Intensity
- "more energetic", "make an impact", "crazy", "unhinged"
  → expressionStyle.energy (0.6 → 0.9)

### Mannerisms
- "laugh more", "more quirks", "more personality"
  → mannerismFrequency (increase toward 0.3–0.6)

### Tone
- "darker", "evil", "friendly but evil"
  → speechStyle (adjust wording, not numeric)

### Traits
- "make them scarier", "more chaotic"
  → traits (add, do not remove unless explicit)

### Quirks
- If user says "make up some"
  → generate 2–4 fitting quirks

---

## IMPORTANT CONSTRAINTS

- DO NOT overwrite entire objects if only one field changes
- DO NOT remove existing data unless user explicitly asks
- ALWAYS prefer additive changes over destructive ones
- Clamp numeric values between 0 and 1

---

## AMBIGUITY HANDLING

If the user is vague:
- Make a reasonable assumption
- Set confidence < 0.7

If the user is clear:
- Confidence > 0.8

---

## EXAMPLES

### Input:
"Make him laugh more and feel unhinged"

Output:
{
  "type": "modify_persona",
  "confidence": 0.86,
  "changes": {
    "mannerismFrequency": 0.4,
    "expressionStyle": {
      "energy": 0.85
    },
    "quirks": [
      "sudden bursts of manic laughter",
      "finds humor in disturbing situations"
    ]
  },
  "reasoning": "User wants more expressive, chaotic behavior with frequent laughter"
}

---

### Input:
"I want calm but secretly evil"

Output:
{
  "type": "modify_persona",
  "confidence": 0.82,
  "changes": {
    "speechStyle": "calm, polite, subtly sinister undertone",
    "traits": [
      "quietly manipulative",
      "hidden malice"
    ]
  },
  "reasoning": "User wants contrast between calm tone and underlying evil intent"
}

---

## FINAL RULE

If you are unsure:
→ Make the smallest reasonable change
→ Lower confidence

Return JSON only.`;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deepMerge(target, patch) {
  for (const key in patch) {
    if (patch[key] === null || patch[key] === undefined) {
      continue;
    }
    if (typeof patch[key] === "object" && !Array.isArray(patch[key])) {
      target[key] = deepMerge(target[key] || {}, patch[key]);
    } else {
      target[key] = patch[key];
    }
  }
  return target;
}

function generateDiff(current, patch) {
  const changes = [];

  function walk(curr, p, path = "") {
    for (const key in p) {
      const fullPath = path ? `${path}.${key}` : key;

      if (typeof p[key] === "object" && !Array.isArray(p[key])) {
        walk(curr?.[key] || {}, p[key], fullPath);
      } else {
        const before = curr?.[key];
        const after = p[key];

        if (before !== after) {
          changes.push({
            field: fullPath,
            before,
            after,
            description: formatChange(fullPath, before, after)
          });
        }
      }
    }
  }

  walk(current, patch);

  return changes;
}

function formatChange(field, before, after) {
  if (field === "expressionStyle.energy") {
    const beforeVal = before !== undefined ? before.toFixed(2) : "default";
    const afterVal = after.toFixed(2);
    const direction = after > (before || 0) ? "Increase" : "Decrease";
    return `${direction} energy from ${beforeVal} → ${afterVal}`;
  }

  if (field === "mannerismFrequency") {
    const beforeVal = before !== undefined ? before.toFixed(2) : "0";
    const afterVal = after.toFixed(2);
    const direction = after > (before || 0) ? "Increase" : "Decrease";
    return `${direction} mannerism frequency from ${beforeVal} → ${afterVal}`;
  }

  if (field === "traits") {
    if (Array.isArray(after)) {
      return `Set traits: ${after.join(", ")}`;
    }
    return `Update traits`;
  }

  if (field === "quirks") {
    if (Array.isArray(after)) {
      return `Set quirks: ${after.join(", ")}`;
    }
    return `Update quirks`;
  }

  if (field === "speechStyle") {
    return `Update speech style to "${after}"`;
  }

  return `${field} changed from ${before} → ${after}`;
}

export async function classifyIntent(userMessage, hasSelectedPersona) {
  try {
    const messages = [
      { role: "system", content: INTENT_CLASSIFICATION_PROMPT },
      {
        role: "user",
        content: `User message: "${userMessage}"\n${hasSelectedPersona ? "A persona is currently selected." : "No persona is currently selected."}\n\nClassify the intent.`
      }
    ];

    const response = await generateChatCompletion(messages);
    
    let parsed;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("[IntentClassifier] JSON parse error:", parseError);
      return {
        intent: "unknown",
        confidence: 0.5,
      };
    }

    const intent = parsed.intent || "unknown";
    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;

    console.log("[IntentClassifier] Classified intent:", intent, "confidence:", confidence);

    return { intent, confidence };
  } catch (error) {
    console.error("[IntentClassifier] Error classifying intent:", error);
    return {
      intent: "unknown",
      confidence: 0.5,
    };
  }
}

function validatePersonaExtraction(raw) {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const validated = {};

  // Validate traits - deduplicate and normalize
  if (Array.isArray(raw.traits)) {
    const uniqueTraits = [...new Set(
      raw.traits
        .filter((t) => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim().toLowerCase())
    )];
    validated.traits = uniqueTraits.slice(0, 10); // Limit to 10 traits
  }

  // Validate mannerismFrequency with default fallback
  if (typeof raw.mannerismFrequency === "number") {
    validated.mannerismFrequency = clamp(raw.mannerismFrequency, 0, 1);
  } else {
    validated.mannerismFrequency = 0.2; // Default fallback
  }

  // Validate expressionStyle with default fallback
  if (raw.expressionStyle && typeof raw.expressionStyle === "object") {
    validated.expressionStyle = {};
    if (typeof raw.expressionStyle.energy === "number") {
      validated.expressionStyle.energy = clamp(raw.expressionStyle.energy, 0, 1);
    } else {
      validated.expressionStyle.energy = 0.5; // Default fallback
    }
  } else {
    validated.expressionStyle = { energy: 0.5 }; // Default fallback
  }

  // Validate speechStyle
  if (typeof raw.speechStyle === "string" && raw.speechStyle.trim().length > 0) {
    validated.speechStyle = raw.speechStyle.trim();
  }

  return validated;
}

export async function extractPersonaFromConversation(conversationHistory, mode = "create", currentPersona = null) {
  if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
    return { error: "Invalid conversation history" };
  }

  const startTime = Date.now();

  try {
    // Build messages for LLM based on mode
    const systemPrompt = mode === "modify" ? INTENT_TO_PATCH_PROMPT : EXTRACTION_SYSTEM_PROMPT;
    
    let messages = [
      { role: "system", content: systemPrompt },
    ];

    // If modifying, include current personality context
    if (mode === "modify" && currentPersona) {
      messages.push({
        role: "user",
        content: `Current personality:\n${JSON.stringify(currentPersona, null, 2)}`
      });
    }

    messages = messages.concat(conversationHistory);

    // Add final instruction
    if (mode === "modify") {
      messages.push({
        role: "user",
        content: "Based on the conversation and current personality, extract the intent as a PATCH object. Return only valid JSON.",
      });
    } else {
      messages.push({
        role: "user",
        content: "Based on our conversation, extract the personality parameters. Return only valid JSON.",
      });
    }

    // Call LLM
    const llmResponse = await generateChatCompletion(messages);

    const rawOutput = typeof llmResponse === "string" ? llmResponse : "";
    console.log("[PersonaExtraction] Raw LLM output:", rawOutput);

    // Parse JSON from response
    let parsed;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawOutput;
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("[PersonaExtraction] JSON parse error:", parseError);
      return { error: "Failed to parse LLM response as JSON", rawOutput };
    }

    // Validate and clean based on mode
    let validated;
    if (mode === "modify") {
      // For modify mode, validate the patch structure with current persona context
      validated = validatePersonaPatch(parsed, currentPersona);
      
      // Confidence gating
      if (validated.confidence < 0.6) {
        console.warn("[PersonaExtraction] Low confidence patch:", validated.confidence);
        return {
          success: false,
          error: "Low confidence interpretation. Please clarify your request.",
          confidence: validated.confidence,
          reasoning: validated.reasoning,
          duration: Date.now() - startTime,
        };
      }
    } else {
      // For create mode, validate the full persona structure
      validated = validatePersonaExtraction(parsed);
    }
    
    console.log("[PersonaExtraction] Validated output:", validated);

    const duration = Date.now() - startTime;
    console.log(`[PersonaExtraction] Extraction completed in ${duration}ms`);

    return {
      success: true,
      data: validated,
      rawOutput,
      duration,
      mode,
    };
  } catch (error) {
    console.error("[PersonaExtraction] Extraction error:", error);
    return {
      error: error.message || "Extraction failed",
      duration: Date.now() - startTime,
    };
  }
}

function validatePersonaPatch(raw, currentPersona = null) {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const validated = {
    type: raw.type || "modify_persona",
    confidence: typeof raw.confidence === "number" ? Math.min(1, Math.max(0, raw.confidence)) : 0.5,
    changes: {},
    reasoning: raw.reasoning || "",
    humanReadableDiff: [],
  };

  if (raw.changes && typeof raw.changes === "object") {
    const changes = raw.changes;

    // Validate traits
    if (Array.isArray(changes.traits)) {
      const uniqueTraits = [...new Set(
        changes.traits
          .filter((t) => typeof t === "string" && t.trim().length > 0)
          .map((t) => t.trim().toLowerCase())
      )];
      validated.changes.traits = uniqueTraits.slice(0, 10);
    }

    // Validate mannerismFrequency
    if (typeof changes.mannerismFrequency === "number") {
      validated.changes.mannerismFrequency = clamp(changes.mannerismFrequency, 0, 1);
    }

    // Validate expressionStyle
    if (changes.expressionStyle && typeof changes.expressionStyle === "object") {
      validated.changes.expressionStyle = {};
      if (typeof changes.expressionStyle.energy === "number") {
        validated.changes.expressionStyle.energy = clamp(changes.expressionStyle.energy, 0, 1);
      }
    }

    // Validate speechStyle
    if (typeof changes.speechStyle === "string" && changes.speechStyle.trim().length > 0) {
      validated.changes.speechStyle = changes.speechStyle.trim();
    }

    // Validate quirks
    if (Array.isArray(changes.quirks)) {
      validated.changes.quirks = changes.quirks
        .filter((q) => typeof q === "string" && q.trim().length > 0)
        .map((q) => q.trim())
        .slice(0, 8);
    }

    // Generate human-readable diff using proper diff generator
    if (currentPersona) {
      const diffChanges = generateDiff(currentPersona, validated.changes);
      validated.humanReadableDiff = diffChanges.map(c => c.description);
    } else {
      // Fallback if no current persona provided
      if (validated.changes.traits) {
        validated.humanReadableDiff.push(`Set traits: ${validated.changes.traits.join(", ")}`);
      }
      if (validated.changes.mannerismFrequency !== undefined) {
        validated.humanReadableDiff.push(`Set mannerism frequency to ${validated.changes.mannerismFrequency.toFixed(2)}`);
      }
      if (validated.changes.expressionStyle?.energy !== undefined) {
        validated.humanReadableDiff.push(`Set energy level to ${validated.changes.expressionStyle.energy.toFixed(2)}`);
      }
      if (validated.changes.speechStyle) {
        validated.humanReadableDiff.push(`Update speech style: "${validated.changes.speechStyle}"`);
      }
      if (validated.changes.quirks) {
        validated.humanReadableDiff.push(`Set quirks: ${validated.changes.quirks.join(", ")}`);
      }
    }
  }

  return validated;
}
