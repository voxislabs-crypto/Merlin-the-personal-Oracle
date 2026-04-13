import {
  clearLlmRuntimeConfig,
  getLlmRuntimeConfig,
  getSavedLlmCredential,
  getSavedLlmCredentials,
  setLlmRuntimeConfig,
  upsertSavedLlmCredential,
  removeSavedLlmCredential,
  getAllTtsCredentials,
  getTtsCredential,
  setTtsCredential,
  clearTtsCredential,
  getVoiceDefaults,
  setVoiceDefaults,
  getKokoroHfToken,
  setKokoroHfToken,
  clearKokoroHfToken,
  getMoodRuntimeConfig,
  setMoodRuntimeConfig,
  getExpressionSamplingConfig,
  setExpressionSamplingConfig,
} from "../models/settingsModel.js";
import {
  detectProviderByApiKey,
  fetchProviderModels,
  getSuggestedProviderIdFromApiKey,
  listSupportedProviders,
} from "../services/providerDiscoveryService.js";

function maskApiKey(apiKey) {
  const key = String(apiKey || "");
  if (key.length <= 8) {
    return "****";
  }

  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function toPublicConfig(config) {
  const envApiKey = String(process.env.LLM_API_KEY || "").trim();
  const envBaseUrl = String(process.env.LLM_BASE_URL || "").trim();
  const envModel = String(process.env.LLM_MODEL || "").trim();
  const envLocked = String(process.env.LLM_LOCK_ENV || "").trim().toLowerCase() === "true";
  const savedProviders = getSavedLlmCredentials().map((credential) => ({
    provider: credential.provider,
    baseUrl: credential.baseUrl,
    keyHint: maskApiKey(credential.apiKey),
    updatedAt: credential.updatedAt || "",
  }));

  if (!config) {
    return {
      connected: false,
      provider: "",
      baseUrl: "",
      model: "",
      models: [],
      keyHint: "",
      connectedAt: "",
      savedProviders,
      envConfigured: Boolean(envApiKey),
      envBaseUrl,
      envModel,
      envLocked,
    };
  }

  return {
    connected: Boolean(config.apiKey && config.baseUrl),
    provider: config.provider,
    baseUrl: config.baseUrl,
    model: config.model,
    models: config.models || [],
    keyHint: maskApiKey(config.apiKey),
    connectedAt: config.connectedAt || "",
    savedProviders,
    envConfigured: Boolean(envApiKey),
    envBaseUrl,
    envModel,
    envLocked,
  };
}

export function getLlmSettingsHandler(_req, res) {
  const config = getLlmRuntimeConfig();
  return res.json(toPublicConfig(config));
}

export function listLlmProvidersHandler(_req, res) {
  return res.json({
    providers: [
      ...listSupportedProviders(),
      {
        id: "custom",
        name: "Custom OpenAI-Compatible",
        baseUrl: "",
      },
    ],
  });
}

export async function connectLlmSettingsHandler(req, res, next) {
  try {
    const requestedProvider = String(req.body?.provider || "").trim();
    const baseUrl = String(req.body?.baseUrl || "").trim();
    const requestedModel = String(req.body?.model || "").trim();
    const suppliedApiKey = String(req.body?.apiKey || "").trim();

    if (!requestedProvider) {
      return res.status(400).json({ error: "provider is required." });
    }

    const savedCredential = getSavedLlmCredential({ provider: requestedProvider, baseUrl });
    const envApiKey = String(process.env.LLM_API_KEY || "").trim();
    const envBaseUrl = String(process.env.LLM_BASE_URL || "").trim();

    // Only use the env key as a fallback if it actually belongs to the requested
    // provider — prevents silently connecting to OpenRouter when the user explicitly
    // selected Groq/OpenAI/etc.
    const envKeyProvider = getSuggestedProviderIdFromApiKey(envApiKey);
    const envKeyMatchesRequest =
      !envKeyProvider || // key has no detectable prefix (e.g. OpenAI sk-proj-)
      envKeyProvider === requestedProvider ||
      requestedProvider === "custom";

    const apiKey = suppliedApiKey || savedCredential?.apiKey || (envKeyMatchesRequest ? envApiKey : "");

    if (!apiKey) {
      const envKeyProviderHint = envKeyProvider
        ? ` Your only configured key is for ${envKeyProvider}; select ${envKeyProvider} to connect without typing a key.`
        : "";
      return res.status(400).json({
        error: `No API key found for ${requestedProvider}.${envKeyProviderHint}`,
      });
    }

    // When no explicit baseUrl was provided and the provider is custom, fall
    // back to the env base URL so the env-configured endpoint is used.
    const resolvedBaseUrl = baseUrl || (requestedProvider === "custom" ? envBaseUrl : "");

    // Auto-correct provider when the key prefix clearly identifies a different
    // known provider, unless the user selected custom (custom is explicit).
    const suggestedProvider = getSuggestedProviderIdFromApiKey(apiKey);
    const provider =
      requestedProvider !== "custom" &&
      suggestedProvider &&
      suggestedProvider !== requestedProvider
        ? suggestedProvider
        : requestedProvider;

    const connected = await fetchProviderModels({
      providerId: provider,
      baseUrl: resolvedBaseUrl,
      apiKey,
    });

    // When the model list is empty (e.g. rate-limited), accept any typed model;
    // otherwise require the model to be in the fetched list.
    const selectedModel =
      requestedModel && (connected.models.length === 0 || connected.models.some((model) => model.id === requestedModel))
        ? requestedModel
        : connected.model;

    const saved = setLlmRuntimeConfig({
      provider: connected.provider,
      baseUrl: connected.baseUrl,
      apiKey,
      model: selectedModel,
      models: connected.models,
    });

    upsertSavedLlmCredential({
      provider: connected.provider,
      baseUrl: connected.baseUrl,
      apiKey,
    });

    return res.json({
      ...toPublicConfig(saved),
      providerName: connected.providerName,
      autoCorrectedProvider: provider !== requestedProvider,
      requestedProvider,
      rateLimited: Boolean(connected.rateLimited),
    });
  } catch (error) {
    return next(error);
  }
}

export async function detectLlmProviderHandler(req, res, next) {
  try {
    const suppliedKey = String(req.body?.apiKey || "").trim();
    // Fall back to env key for detect — the whole point of detect is to figure
    // out which provider a key belongs to, so the env key is always valid here.
    const apiKey = suppliedKey || String(process.env.LLM_API_KEY || "").trim();
    if (!apiKey) {
      return res.status(400).json({ error: "apiKey is required." });
    }

    const detected = await detectProviderByApiKey(apiKey);
    return res.json(detected);
  } catch (error) {
    return next(error);
  }
}

export function selectLlmModelHandler(req, res) {
  const selectedModel = String(req.body?.model || "").trim();
  if (!selectedModel) {
    return res.status(400).json({ error: "model is required." });
  }

  const current = getLlmRuntimeConfig();
  if (!current) {
    return res.status(404).json({ error: "No provider is connected." });
  }

  const exists = (current.models || []).some((model) => model.id === selectedModel);
  if (!exists) {
    return res.status(400).json({ error: "Selected model is not available for the connected provider." });
  }

  const updated = setLlmRuntimeConfig({
    ...current,
    model: selectedModel,
  });

  return res.json(toPublicConfig(updated));
}

export function disconnectLlmSettingsHandler(_req, res) {
  clearLlmRuntimeConfig();
  return res.json(toPublicConfig(null));
}

export function removeSavedLlmCredentialHandler(req, res) {
  const provider = String(req.body?.provider || "").trim();
  const baseUrl = String(req.body?.baseUrl || "").trim();
  if (!provider) {
    return res.status(400).json({ error: "provider is required." });
  }
  removeSavedLlmCredential({ provider, baseUrl });
  return res.json(toPublicConfig(getLlmRuntimeConfig()));
}

// ── TTS Settings (BYOK) ────────────────────────────────────────────────────

const TTS_PROVIDER_META = {
  elevenlabs: {
    name: "ElevenLabs",
    defaultVoiceId: "21m00Tcm4TlvDq8ikWAM",
    defaultModel: "eleven_multilingual_v2",
    pricingNote: "Free tier: 10k chars/month. Paid from ~$11/million.",
    docsUrl: "https://elevenlabs.io/voice-library",
  },
  cartesia: {
    name: "Cartesia",
    defaultVoiceId: "a0e99841-438c-4a64-b679-ae501e7d6091",
    defaultModel: "sonic-2",
    pricingNote: "Free tier available. Paid ~$0.65/million chars.",
    docsUrl: "https://play.cartesia.ai/voices",
  },
};

function toPublicTtsCredential(cred) {
  if (!cred) return null;
  return {
    provider: cred.provider,
    connected: Boolean(cred.apiKey),
    keyHint: maskApiKey(cred.apiKey),
    voiceId: cred.voiceId || "",
    model: cred.model || "",
    updatedAt: cred.updatedAt || "",
    ...TTS_PROVIDER_META[cred.provider],
  };
}

function toPublicKokoroSettings() {
  const saved = getKokoroHfToken();
  return {
    provider: "kokoro",
    connected: Boolean(saved?.token),
    keyHint: saved?.token ? maskApiKey(saved.token) : "",
    updatedAt: saved?.updatedAt || "",
  };
}

export function getTtsSettingsHandler(_req, res) {
  const saved = getAllTtsCredentials();
  const result = Object.entries(TTS_PROVIDER_META).map(([id, meta]) => {
    const cred = saved.find((c) => c.provider === id);
    return {
      provider: id,
      connected: Boolean(cred?.apiKey),
      keyHint: cred ? maskApiKey(cred.apiKey) : "",
      voiceId: cred?.voiceId || "",
      model: cred?.model || "",
      updatedAt: cred?.updatedAt || "",
      ...meta,
    };
  });
  return res.json({ providers: result, voiceDefaults: getVoiceDefaults() });
}

export function saveVoiceDefaultsHandler(req, res) {
  const source = String(req.body?.source || "").trim().toLowerCase();
  if (!["tts", "llm"].includes(source)) {
    return res.status(400).json({ error: "source must be 'tts' or 'llm'." });
  }

  const updated = setVoiceDefaults({ source });
  return res.json(updated);
}

export function saveTtsCredentialHandler(req, res, next) {
  try {
    const provider = String(req.params.provider || "").trim().toLowerCase();
    const apiKey = String(req.body?.apiKey || "").trim();
    const voiceId = String(req.body?.voiceId || "").trim();
    const model = String(req.body?.model || "").trim();

    if (!apiKey) {
      return res.status(400).json({ error: "apiKey is required." });
    }

    const saved = setTtsCredential({ provider, apiKey, voiceId, model });
    return res.json(toPublicTtsCredential(saved));
  } catch (error) {
    return next(error);
  }
}

export function clearTtsCredentialHandler(req, res, next) {
  try {
    const provider = String(req.params.provider || "").trim().toLowerCase();
    clearTtsCredential(provider);
    return res.json({ provider, connected: false });
  } catch (error) {
    return next(error);
  }
}

export function getKokoroSettingsHandler(_req, res) {
  return res.json(toPublicKokoroSettings());
}

export function saveKokoroHfTokenHandler(req, res, next) {
  try {
    const token = String(req.body?.token || "").trim();
    if (!token) {
      return res.status(400).json({ error: "token is required." });
    }

    setKokoroHfToken({ token });
    return res.json(toPublicKokoroSettings());
  } catch (error) {
    return next(error);
  }
}

export function clearKokoroHfTokenHandler(_req, res, next) {
  try {
    clearKokoroHfToken();
    return res.json(toPublicKokoroSettings());
  } catch (error) {
    return next(error);
  }
}

export function getMoodRuntimeSettingsHandler(_req, res) {
  return res.json(getMoodRuntimeConfig());
}

export function saveMoodRuntimeSettingsHandler(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const updated = setMoodRuntimeConfig(body);
  return res.json(updated);
}

export function getExpressionSamplingSettingsHandler(_req, res) {
  return res.json(getExpressionSamplingConfig());
}

export function saveExpressionSamplingSettingsHandler(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const updated = setExpressionSamplingConfig(body);
  return res.json(updated);
}
