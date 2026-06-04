import { Router } from "express";

import {
  connectLlmSettingsHandler,
  detectLlmProviderHandler,
  disconnectLlmSettingsHandler,
  getOllamaStatusHandler,
  removeSavedLlmCredentialHandler,
  getLlmSettingsHandler,
  listLlmProvidersHandler,
  selectLlmModelHandler,
  getTtsSettingsHandler,
  saveTtsCredentialHandler,
  clearTtsCredentialHandler,
  saveVoiceDefaultsHandler,
  getKokoroSettingsHandler,
  saveKokoroHfTokenHandler,
  clearKokoroHfTokenHandler,
  saveKokoroLocalPathHandler,
  clearKokoroLocalPathHandler,
  getMoodRuntimeSettingsHandler,
  saveMoodRuntimeSettingsHandler,
  getExpressionSamplingSettingsHandler,
  saveExpressionSamplingSettingsHandler,
  getSttRuntimeSettingsHandler,
  saveSttRuntimeSettingsHandler,
  getSearchRuntimeSettingsHandler,
  saveSearchRuntimeSettingsHandler,
  getStateRuntimeSettingsHandler,
  saveStateRuntimeSettingsHandler,
  getCognitionLoopSettingsHandler,
  saveCognitionLoopSettingsHandler,
  getProfaneFilterSettingsHandler,
  saveProfaneFilterSettingsHandler,
  getCompanionAliasSettingsHandler,
  saveCompanionAliasSettingsHandler,
  getVoiceMapsHandler,
  saveVoiceMapHandler,
  deleteVoiceMapHandler,
  getVoiceFavoritesHandler,
  saveVoiceFavoritesHandler,
} from "../controllers/settingsController.js";
import { requireAuth, requireAdmin } from "../middleware/requireAuth.js";

const router = Router();

router.get("/settings/llm", requireAuth, getLlmSettingsHandler);
router.get("/settings/llm/providers", requireAuth, listLlmProvidersHandler);
router.post("/settings/llm/connect", requireAuth, requireAdmin, connectLlmSettingsHandler);
router.post("/settings/llm/detect", requireAuth, requireAdmin, detectLlmProviderHandler);
router.get("/settings/llm/ollama/status", requireAuth, requireAdmin, getOllamaStatusHandler);
router.post("/settings/llm/model", requireAuth, requireAdmin, selectLlmModelHandler);
router.delete("/settings/llm", requireAuth, requireAdmin, disconnectLlmSettingsHandler);
router.delete("/settings/llm/saved", requireAuth, requireAdmin, removeSavedLlmCredentialHandler);

// TTS BYOK — users save API keys from the browser, no .env needed
router.get("/settings/tts", requireAuth, getTtsSettingsHandler);
router.put("/settings/voice-defaults", requireAuth, requireAdmin, saveVoiceDefaultsHandler);
router.put("/settings/tts/:provider", requireAuth, requireAdmin, saveTtsCredentialHandler);
router.delete("/settings/tts/:provider", requireAuth, requireAdmin, clearTtsCredentialHandler);
router.get("/settings/kokoro", requireAuth, getKokoroSettingsHandler);
router.put("/settings/kokoro", requireAuth, requireAdmin, saveKokoroHfTokenHandler);
router.delete("/settings/kokoro", requireAuth, requireAdmin, clearKokoroHfTokenHandler);
router.put("/settings/kokoro/local-path", requireAuth, requireAdmin, saveKokoroLocalPathHandler);
router.delete("/settings/kokoro/local-path", requireAuth, requireAdmin, clearKokoroLocalPathHandler);
router.get("/settings/mood-runtime", requireAuth, getMoodRuntimeSettingsHandler);
router.put("/settings/mood-runtime", requireAuth, requireAdmin, saveMoodRuntimeSettingsHandler);
router.get("/settings/expression-sampling", requireAuth, getExpressionSamplingSettingsHandler);
router.put("/settings/expression-sampling", requireAuth, requireAdmin, saveExpressionSamplingSettingsHandler);
router.get("/settings/stt-runtime", requireAuth, getSttRuntimeSettingsHandler);
router.put("/settings/stt-runtime", requireAuth, requireAdmin, saveSttRuntimeSettingsHandler);
router.get("/settings/search-runtime", requireAuth, getSearchRuntimeSettingsHandler);
router.put("/settings/search-runtime", requireAuth, requireAdmin, saveSearchRuntimeSettingsHandler);
router.get("/settings/state-runtime", requireAuth, getStateRuntimeSettingsHandler);
router.put("/settings/state-runtime", requireAuth, requireAdmin, saveStateRuntimeSettingsHandler);
router.get("/settings/cognition-loop", requireAuth, getCognitionLoopSettingsHandler);
router.put("/settings/cognition-loop", requireAuth, requireAdmin, saveCognitionLoopSettingsHandler);
router.get("/settings/profane-filter", requireAuth, getProfaneFilterSettingsHandler);
router.put("/settings/profane-filter", requireAuth, requireAdmin, saveProfaneFilterSettingsHandler);
router.get("/settings/companion-aliases", requireAuth, getCompanionAliasSettingsHandler);
router.put("/settings/companion-aliases", requireAuth, requireAdmin, saveCompanionAliasSettingsHandler);
router.get("/settings/voice-maps", requireAuth, getVoiceMapsHandler);
router.put("/settings/voice-maps", requireAuth, saveVoiceMapHandler);
router.delete("/settings/voice-maps/:id", requireAuth, deleteVoiceMapHandler);
router.get("/settings/voice-favorites", requireAuth, getVoiceFavoritesHandler);
router.put("/settings/voice-favorites", requireAuth, saveVoiceFavoritesHandler);

export default router;
