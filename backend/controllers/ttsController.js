import { getPersonalityById } from "../models/personalityModel.js";
import {
  generateSpeechAudio,
  isTtsConfigured,
  listPiperVoiceOptions,
  listKokoroVoices,
  listProviderStatus,
  listProviderOptions,
} from "../services/ttsService.js";
import { sanitizeVoiceProfile } from "../services/voiceProfileSanitizer.js";

function setEncodedHeader(res, name, value, { maxBytes = 1800 } = {}) {
  const normalized = String(value || "");
  if (!normalized) {
    return;
  }

  if (Buffer.byteLength(normalized, "utf8") > maxBytes) {
    return;
  }

  res.setHeader(name, normalized);
}

function setEncodedJsonHeader(res, name, payload, options) {
  try {
    setEncodedHeader(res, name, encodeURIComponent(JSON.stringify(payload ?? {})), options);
  } catch {
    // Optional debug headers should never fail the audio response.
  }
}

const TTS_DEBUG_PROVIDER_LOCK_ENABLED = String(process.env.TTS_DEBUG_PROVIDER_LOCK ?? "true").trim().toLowerCase() !== "false";

export async function listPiperVoicesHandler(req, res, next) {
  try {
    const payload = await listPiperVoiceOptions();
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
}

export function listKokoroVoicesHandler(req, res) {
  return res.json(listKokoroVoices());
}

export function listProviderStatusHandler(req, res) {
  return res.json(listProviderStatus());
}

export async function listProviderOptionsHandler(req, res, next) {
  try {
    const provider = String(req.query.provider || "").trim().toLowerCase();
    if (!provider) {
      return res.status(400).json({ error: "provider query param is required." });
    }

    const payload = await listProviderOptions(provider);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
}

export async function generateSpeechHandler(req, res, next) {
  try {
    const personalityId = Number(req.params.id);
    const text = String(req.body.text || "").trim();
    const speechHint = String(req.body?.speechHint || "").trim();

    if (!Number.isInteger(personalityId)) {
      return res.status(400).json({ error: "A valid personality id is required." });
    }

    if (!text) {
      return res.status(400).json({ error: "Text is required for speech generation." });
    }

    const personality = getPersonalityById(personalityId);

    if (!personality) {
      return res.status(404).json({ error: "Personality not found." });
    }

    const voiceProfile = sanitizeVoiceProfile(req.body.voiceProfile, personality.voiceProfile);

    if (!isTtsConfigured(voiceProfile)) {
      return res.status(500).json({
        error:
          TTS_DEBUG_PROVIDER_LOCK_ENABLED
            ? "TTS debug lock is active and no allowed engine is configured. Configure Cartesia credentials (Settings -> Voice Provider Credentials) or use Kokoro."
            : "TTS is not configured. Configure cloud TTS (TTS_API_KEY/TTS_BASE_URL) or Piper (PIPER_MODEL_PATH) in backend/.env.",
      });
    }
    const audio = await generateSpeechAudio({
      personality,
      text,
      voiceProfile,
      speechHint,
    });

    res.setHeader("Content-Type", audio.contentType);
    res.setHeader("Cache-Control", "no-store");
    setEncodedHeader(res, "X-Voxis-Directed-Text", encodeURIComponent(audio.directedText || text), { maxBytes: 1200 });
    setEncodedHeader(res, "X-Voxis-Synthesis-Text", encodeURIComponent(audio.synthesisText || audio.directedText || text), { maxBytes: 1200 });
    res.setHeader("X-Voxis-Tts-Engine", audio.engine || "unknown");
    setEncodedJsonHeader(res, "X-Voxis-Adjusted-Voice", audio.adjustedVoiceProfile || voiceProfile, { maxBytes: 1400 });
    setEncodedJsonHeader(res, "X-Voxis-Prosody", audio.prosodyEnvelope || {}, { maxBytes: 1400 });
    setEncodedJsonHeader(res, "X-Voxis-Tts-Telemetry", audio.telemetry || {}, { maxBytes: 1400 });
    setEncodedHeader(res, "X-Voxis-Tts-Realism-Chain", encodeURIComponent(String(audio?.realism?.chain || "disabled")), { maxBytes: 1200 });
    setEncodedJsonHeader(res, "X-Voxis-Tts-Realism", audio.realism || {}, { maxBytes: 1400 });
    setEncodedJsonHeader(res, "X-Voxis-Tts-Sfx", Array.isArray(audio.sfx) ? audio.sfx : [], { maxBytes: 800 });
    return res.send(audio.buffer);
  } catch (error) {
    if (error?.ttsProvider) {
      const provider = String(error.ttsProvider || "unknown").trim().toLowerCase();
      const providerCode = String(error.ttsProviderCode || "").trim().toLowerCase();
      const providerStatus = Number(error.providerStatus || 0);

      return res.status(Number(error.statusCode || 502)).json({
        error: String(error.message || "Speech generation failed."),
        details: {
          provider,
          providerCode,
          providerStatus,
        },
      });
    }

    return next(error);
  }
}