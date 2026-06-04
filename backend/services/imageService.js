import { getLlmConfig } from "./llmService.js";

/**
 * Generates an image using the configured image model via AIML API (OpenAI-compatible).
 * 
 * @param {string} prompt - The prompt to generate the image from.
 * @returns {Promise<string>} - The URL of the generated image.
 */
export async function generateImage(prompt) {
  const { baseUrl, apiKey } = getLlmConfig();
  const model = process.env.IMAGE_MODEL || "black-forest-labs/flux-1.1-pro";

  if (!apiKey) {
    throw new Error("LLM_API_KEY is not configured. Image generation requires an API key.");
  }

  console.log(`[ImageService] Generating image with model: ${model}`);

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[ImageService] Image generation failed: ${response.status}`, errorBody);
    throw new Error(`Image generation failed: ${response.status} ${errorBody}`);
  }

  const result = await response.json();
  
  if (!result.data || !result.data[0] || !result.data[0].url) {
    console.error(`[ImageService] Invalid response format:`, result);
    throw new Error("Image generation returned an invalid response format.");
  }

  return result.data[0].url;
}
