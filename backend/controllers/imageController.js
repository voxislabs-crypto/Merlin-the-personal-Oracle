import { generateImage } from "../services/imageService.js";
import { getPersonalityById, updatePersonality } from "../models/personalityModel.js";

/**
 * Handles the request to generate an avatar for a personality.
 */
export async function generateAvatarHandler(req, res, next) {
  try {
    const personalityId = Number(req.params.id);
    const ownerId = req.voxisUser?.id ?? null;

    if (!Number.isInteger(personalityId)) {
      return res.status(400).json({ error: "A valid personality id is required." });
    }

    const personality = getPersonalityById(personalityId, ownerId);
    if (!personality) {
      return res.status(404).json({ error: "Personality not found." });
    }

    // Default prompt based on character description
    const defaultPrompt = `A high-quality digital portrait of ${personality.name}. ${personality.description}. Detailed character art, professional lighting.`;
    const prompt = req.body.prompt || defaultPrompt;

    console.log(`[ImageController] Generating avatar for personality ${personalityId} (${personality.name})`);
    
    const imageUrl = await generateImage(prompt);

    // Update the personality with the new avatar URL
    const updated = updatePersonality(personalityId, {
      ...personality,
      avatarImageUrl: imageUrl,
    });

    return res.json({ 
      imageUrl, 
      personality: updated,
      message: "Avatar generated and updated successfully."
    });
  } catch (error) {
    console.error(`[ImageController] Error generating avatar:`, error);
    return res.status(500).json({ 
      error: "Failed to generate image. Check your API key and model configuration.",
      details: error.message 
    });
  }
}
