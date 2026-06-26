import { Router } from "express";

import { chatHandler } from "../controllers/chatController.js";
import { transcribeAudioHandler } from "../controllers/sttController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/chat", requireAuth, chatHandler);
router.post("/stt/transcribe", requireAuth, transcribeAudioHandler);

export default router;
