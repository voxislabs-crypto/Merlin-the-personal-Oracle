import { generateChatCompletion } from './llmService.js';
import { buildVoxisPrompt } from '../prompts/voxisSystemPrompt.js';
import { createPersonaFromConversation } from './personaFromVoxis.js';

export const chatWithVoxis = async (messages, isFinalStep = false, currentPersona = null) => {
  try {
    const promptMessages = [
      { role: "system", content: buildVoxisPrompt(currentPersona) },
      ...messages
    ];

    const reply = await generateChatCompletion(promptMessages);

    let extractedPersona = null;

    // If this is the final confirmation step, try to extract a persona
    if (isFinalStep) {
      extractedPersona = createPersonaFromConversation(messages, reply);
    }

    return {
      success: true,
      reply: reply || "I went quiet for a moment... What were we talking about?",
      extractedPersona,        // null most of the time, only filled on final step
      isFinalStep
    };

  } catch (error) {
    console.error("LLM error in Voxis service:", error);

    return {
      success: false,
      reply: "I'm having trouble thinking clearly right now. Can you try that again?",
    };
  }
};
