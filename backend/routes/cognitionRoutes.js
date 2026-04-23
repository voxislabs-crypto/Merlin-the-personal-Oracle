import { Router } from "express";

import {
  getCognitionLoopConfigHandler,
  getCognitionLoopStatusHandler,
  runCognitionLoopNowHandler,
  saveCognitionLoopConfigHandler,
} from "../controllers/cognitionController.js";
import { requireAdmin, requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/api/cognition-loop/config", requireAuth, getCognitionLoopConfigHandler);
router.put("/api/cognition-loop/config", requireAuth, requireAdmin, saveCognitionLoopConfigHandler);
router.get("/api/cognition-loop/status", requireAuth, getCognitionLoopStatusHandler);
router.post("/api/cognition-loop/run", requireAuth, requireAdmin, runCognitionLoopNowHandler);

export default router;
