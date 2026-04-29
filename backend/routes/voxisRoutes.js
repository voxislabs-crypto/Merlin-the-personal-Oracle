import express from 'express';
import { chatWithVoxis } from '../services/voxisService.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages, isFinalStep } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        reply: "I need the conversation history to respond properly."
      });
    }

    const result = await chatWithVoxis(messages, isFinalStep);

    return res.json(result);

  } catch (error) {
    console.error("Voxis chat route error:", error);
    return res.status(500).json({
      success: false,
      reply: "Something broke on my end. Give me a second and try again."
    });
  }
});

export default router;
