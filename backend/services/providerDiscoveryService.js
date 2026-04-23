const PROVIDERS = [
  {
    id: "ollama",
    name: "Ollama (Offline)",
    baseUrl: "http://127.0.0.1:11434/v1",
    auth: "none",
    modelsPath: "/models",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    auth: "bearer",
    modelsPath: "/models",
  },
  {
    id: "grok",
    name: "Grok (xAI)",
    baseUrl: "https://api.x.ai/v1",
    auth: "bearer",
    modelsPath: "/models",
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    auth: "bearer",
    modelsPath: "/models",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    auth: "bearer",
    modelsPath: "/models",
    extraHeaders: {
      "HTTP-Referer": "https://localhost",
      "X-Title": "Voxis",
    },
  },
  {
    id: "together",
    name: "Together",
    baseUrl: "https://api.together.xyz/v1",
    auth: "bearer",
    modelsPath: "/models",
  },
  {
    id: "mistral",
    name: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    auth: "bearer",
    modelsPath: "/models",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    auth: "anthropic",
    modelsPath: "/models",
  },
];

const PROVIDER_MAP = new Map(PROVIDERS.map((provider) => [provider.id, provider]));

export function getSuggestedProviderIdFromApiKey(apiKey) {
  const trimmedKey = String(apiKey || "").trim();
  if (!trimmedKey) {
    return "";
  }

  if (trimmedKey.startsWith("sk-ant-")) return "anthropic";
  if (trimmedKey.startsWith("sk-or-v1-")) return "openrouter";
  if (trimmedKey.startsWith("xai-") || trimmedKey.startsWith("xai_")) return "grok";
  if (trimmedKey.startsWith("gsk_")) return "groq";
  return "";
}

function validateApiKeyMatchesProvider(providerId, apiKey) {
  if (!String(apiKey || "").trim()) {
    return;
  }

  const suggestedProviderId = getSuggestedProviderIdFromApiKey(apiKey);
  if (!suggestedProviderId || !providerId || providerId === "custom" || suggestedProviderId === providerId) {
    return;
  }

  const suggestedProvider = PROVIDER_MAP.get(suggestedProviderId);
  const selectedProvider = PROVIDER_MAP.get(providerId);
  const error = new Error(
    `This API key looks like a ${suggestedProvider?.name || suggestedProviderId} key, but ${selectedProvider?.name || providerId} is selected. Choose ${suggestedProvider?.name || suggestedProviderId} or use Detect Provider first.`,
  );
  error.statusCode = 400;
  throw error;
}

function buildHeaders(provider, apiKey) {
  const headers = {
    "Content-Type": "application/json",
    ...(provider.extraHeaders || {}),
  };

  if (provider.auth === "none") {
    return headers;
  }

  if (provider.auth === "anthropic") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

function normalizeModelList(payload) {
  const list = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.models)
      ? payload.models
      : Array.isArray(payload)
        ? payload
        : [];

  function hasZeroPricing(pricing) {
    if (!pricing || typeof pricing !== "object") {
      return false;
    }

    const values = [
      pricing.prompt,
      pricing.completion,
      pricing.request,
      pricing.input,
      pricing.output,
      pricing.image,
    ]
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    return values.length > 0 && values.every((value) => value <= 0);
  }

  function isLikelyFreeModel(item, id, name) {
    if (item?.isFree === true || item?.is_free === true || item?.free === true) {
      return true;
    }

    if (hasZeroPricing(item?.pricing)) {
      return true;
    }

    return /(^|[:/\s_-])free($|[:/\s_-])/i.test(`${id} ${name}`);
  }

  return list
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const id = String(item.id || item.name || "").trim();
      if (!id) {
        return null;
      }

      const name = String(item.name || item.display_name || id).trim();
      return {
        id,
        name,
        isFree: isLikelyFreeModel(item, id, name),
      };
    })
    .filter(Boolean)
    .slice(0, 250);
}

function chooseDefaultModel(providerId, models) {
  if (!models.length) {
    return "";
  }

  const priority = [
    "gpt-4o-mini",
    "gpt-4.1-mini",
    "gpt-4o",
    "llama-3.3-70b-versatile",
    "claude-3-5-sonnet",
    "mistral-large-latest",
  ];

  for (const preferred of priority) {
    const found = models.find((model) => model.id.toLowerCase().includes(preferred.toLowerCase()));
    if (found) {
      return found.id;
    }
  }

  if (providerId === "openrouter") {
    const openRouterChat = models.find((model) => /\/chat|\bgpt|\bclaude|\bllama/i.test(model.id));
    if (openRouterChat) {
      return openRouterChat.id;
    }
  }

  return models[0].id;
}

async function probeProvider(provider, apiKey, timeoutMs = 15000) {
  // OpenRouter returns 300+ models — give it more time on slow servers.
  const effectiveTimeout = provider.id === "openrouter" ? 30000 : timeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), effectiveTimeout);

  let response;
  try {
    response = await fetch(`${provider.baseUrl}${provider.modelsPath}`, {
      method: "GET",
      headers: buildHeaders(provider, apiKey),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      const error = new Error(`${provider.name} took too long to respond (>${effectiveTimeout / 1000}s). Try again or check your connection.`);
      error.statusCode = 504;
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    if (provider.id === "ollama" && response.status === 404) {
      const ollamaBase = String(provider.baseUrl || "").replace(/\/v1\/?$/, "");
      const tagsResponse = await fetch(`${ollamaBase}/api/tags`, {
        method: "GET",
        headers: buildHeaders(provider, apiKey),
      });

      if (!tagsResponse.ok) {
        return null;
      }

      const tagsPayload = await tagsResponse.json();
      const tagsModels = normalizeModelList(tagsPayload);
      if (!tagsModels.length) {
        return null;
      }

      return {
        provider: provider.id,
        providerName: provider.name,
        baseUrl: provider.baseUrl,
        models: tagsModels,
        model: chooseDefaultModel(provider.id, tagsModels),
      };
    }

    // 429 means the key is valid but the models endpoint is rate-limited.
    // Return a minimal result so the user can still connect; the model list
    // will just be empty and they can type the model ID manually.
    if (response.status === 429) {
      return {
        provider: provider.id,
        providerName: provider.name,
        baseUrl: provider.baseUrl,
        models: [],
        model: "",
        rateLimited: true,
      };
    }
    return null;
  }

  const payload = await response.json();
  const models = normalizeModelList(payload);
  if (!models.length) {
    return null;
  }

  return {
    provider: provider.id,
    providerName: provider.name,
    baseUrl: provider.baseUrl,
    models,
    model: chooseDefaultModel(provider.id, models),
  };
}

export function listSupportedProviders() {
  return PROVIDERS.map((provider) => ({
    id: provider.id,
    name: provider.name,
    baseUrl: provider.baseUrl,
  }));
}

export function resolveProviderConfig(providerId, baseUrl = "") {
  const normalizedProvider = String(providerId || "").trim().toLowerCase();
  const normalizedBaseUrl = String(baseUrl || "").trim().replace(/\/$/, "");

  if (normalizedProvider === "custom") {
    if (!normalizedBaseUrl) {
      const error = new Error("baseUrl is required for custom provider.");
      error.statusCode = 400;
      throw error;
    }

    return {
      id: "custom",
      name: "Custom OpenAI-Compatible",
      baseUrl: normalizedBaseUrl,
      auth: "bearer",
      modelsPath: "/models",
    };
  }

  const provider = PROVIDER_MAP.get(normalizedProvider);
  if (!provider) {
    const error = new Error("Unsupported provider.");
    error.statusCode = 400;
    throw error;
  }

  return {
    ...provider,
    baseUrl: normalizedBaseUrl || provider.baseUrl,
  };
}

export async function fetchProviderModels({ providerId, apiKey, baseUrl }) {
  const provider = resolveProviderConfig(providerId, baseUrl);
  const trimmedKey = String(apiKey || "").trim();
  const providerRequiresApiKey = provider.auth !== "none";

  if (providerRequiresApiKey && !trimmedKey) {
    const error = new Error("apiKey is required.");
    error.statusCode = 400;
    throw error;
  }

  validateApiKeyMatchesProvider(String(providerId || "").trim().toLowerCase(), trimmedKey);

  const detection = await probeProvider(provider, trimmedKey);
  if (!detection) {
    const error = new Error(`Unable to connect to ${providerId}. The API key may be invalid, or the provider may be temporarily unreachable.`);
    error.statusCode = 400;
    throw error;
  }

  return {
    provider: detection.provider,
    providerName: provider.name,
    baseUrl: provider.baseUrl,
    models: detection.models,
    model: detection.model,
  };
}

export async function detectProviderByApiKey(apiKey) {
  const trimmedKey = String(apiKey || "").trim();
  if (!trimmedKey) {
    const error = new Error("API key is required.");
    error.statusCode = 400;
    throw error;
  }

  const priorityProviders = [...PROVIDERS];

  if (trimmedKey.startsWith("sk-ant-")) {
    priorityProviders.sort((a, b) => (a.id === "anthropic" ? -1 : b.id === "anthropic" ? 1 : 0));
  } else if (trimmedKey.startsWith("sk-or-v1-")) {
    priorityProviders.sort((a, b) => (a.id === "openrouter" ? -1 : b.id === "openrouter" ? 1 : 0));
  } else if (trimmedKey.startsWith("xai-") || trimmedKey.startsWith("xai_")) {
    priorityProviders.sort((a, b) => (a.id === "grok" ? -1 : b.id === "grok" ? 1 : 0));
  } else if (trimmedKey.startsWith("gsk_")) {
    priorityProviders.sort((a, b) => (a.id === "groq" ? -1 : b.id === "groq" ? 1 : 0));
  }

  for (const provider of priorityProviders) {
    try {
      const detection = await probeProvider(provider, trimmedKey);
      if (detection) {
        return detection;
      }
    } catch {
      // Ignore and continue probing next provider.
    }
  }

  const error = new Error(
    "Unable to identify a supported provider for this API key. Try a key from OpenAI, Grok (xAI), Groq, OpenRouter, Together, Mistral, or Anthropic.",
  );
  error.statusCode = 400;
  throw error;
}

export async function getOllamaStatus({ baseUrl = "" } = {}) {
  const provider = resolveProviderConfig("ollama", baseUrl);
  const ollamaBase = String(provider.baseUrl || "").replace(/\/v1\/?$/, "");

  const status = {
    provider: "ollama",
    providerName: provider.name,
    baseUrl: provider.baseUrl,
    reachable: false,
    version: "",
    models: [],
    model: "",
    checkedAt: new Date().toISOString(),
  };

  try {
    const [versionResponse, modelsResponse] = await Promise.all([
      fetch(`${ollamaBase}/api/version`, {
        method: "GET",
        headers: buildHeaders(provider, ""),
      }),
      fetchProviderModels({
        providerId: "ollama",
        apiKey: "",
        baseUrl: provider.baseUrl,
      }),
    ]);

    if (versionResponse.ok) {
      const versionPayload = await versionResponse.json();
      status.version = String(versionPayload?.version || "").trim();
    }

    status.reachable = true;
    status.models = Array.isArray(modelsResponse.models) ? modelsResponse.models : [];
    status.model = String(modelsResponse.model || "").trim();
    return status;
  } catch (error) {
    status.reachable = false;
    status.error = error?.message || "Unable to reach local Ollama runtime.";
    return status;
  }
}
