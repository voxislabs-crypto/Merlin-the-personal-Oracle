// backend/services/voxisService.js
import Groq from 'groq-sdk';
import voxisSystemPrompt from '../prompts/voxisSystemPrompt.js';
import { createPersonaFromConversation } from './personaFromVoxis.js';

let groq = null;

function getGroqClient() {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

export const chatWithVoxis = async (messages, isFinalStep = false) => {
  try {
    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: voxisSystemPrompt },
        ...messages
      ],
      temperature: 0.78,
      max_tokens: 950,
      top_p: 0.9,
    });

    const reply = completion.choices[0]?.message?.content?.trim();

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
    console.error("Groq error in Voxis service:", error);

    return {
      success: false,
      reply: "I'm having trouble thinking clearly right now. Can you try that again?",
    };
  }
};
