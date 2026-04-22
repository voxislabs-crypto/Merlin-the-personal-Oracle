import { Router } from "express";
import {
  councilInfoHandler,
  councilProposeHandler,
  councilCritiqueHandler,
  councilSaveLlmConfigHandler,
} from "../controllers/councilController.js";

const router = Router();

// Public info — no auth required so CoE can discover seats
router.get("/:id/info", councilInfoHandler);

// Council protocol endpoints
router.post("/:id/propose", councilProposeHandler);
router.post("/:id/critique", councilCritiqueHandler);

// LLM binding management — auth-gated in production via requireAuth
router.put("/:id/llm-config", councilSaveLlmConfigHandler);

export default router;
