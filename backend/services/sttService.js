import { getSttRuntimeConfig } from "../models/settingsModel.js";

function normalizeAudioBase64(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    return "";
  }

  const match = raw.match(/^data:.*?;base64,(.+)$/i);
  return (match ? match[1] : raw).replace(/\s+/g, "");
}

function redactSecrets(text) {
  const raw = String(text || "");
  if (!raw) {
    return raw;
  }

  // Redact likely OpenAI-style keys (and similar long token-like secrets).
  return raw
    .replace(/\b(sk-[a-z0-9_-]{10,})\b/gi, "[redacted-key]")
    .replace(/\b([a-z0-9]{20,})\b/gi, "[redacted-token]");
}

function redactUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) {
    return raw;
  }
  try {
    const parsed = new URL(raw);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return raw.replace(/\?.*$/, "");
  }
}

function guessExtensionFromMime(mimeType) {
  const mime = String(mimeType || "").toLowerCase();
  if (mime.includes("webm")) return "webm";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("flac")) return "flac";
  return "webm";
}

function looksLikeOpenAiKey(key) {
  const value = String(key || "").trim();
  return /^sk-[a-z0-9_-]{10,}$/i.test(value);
}

// Resolve the effective STT endpoint. DB config wins; env vars are the fallback so the
// feature works out of the box when the same LLM provider supports Whisper-compatible STT.
function resolveEffectiveSttConfig(config) {
  const OPENAI_COMPATIBLE_BASE = "https://api.openai.com/v1";
  const LOCAL_DEFAULT = "http://127.0.0.1:8000/v1";

  const hasDbKey = Boolean(config.apiKey);
  const isLocalDefault = config.baseUrl === LOCAL_DEFAULT;

  const baseUrl = String(config.baseUrl || "").trim();
  const isOpenAiEndpoint = baseUrl.includes("openai.com") || baseUrl.includes("api.openai");
  const envKey = String(
    process.env.STT_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.LLM_API_KEY ||
    "",
  ).trim();

  // If the configured key doesn't look like an OpenAI key while targeting OpenAI STT,
  // treat it as invalid config and prefer env fallback.
  const hasInvalidOpenAiKey = isOpenAiEndpoint && hasDbKey && !looksLikeOpenAiKey(config.apiKey);

  // If local default is selected and an env key exists, always prefer env fallback
  // (avoids hard dependency on a local Whisper server at :8000).
  // Also fallback when key is invalid for an OpenAI endpoint.
  if ((isLocalDefault && envKey) || ((!hasDbKey && isLocalDefault) || hasInvalidOpenAiKey)) {

    // LLM_BASE_URL might point at OpenRouter or another provider — only use it if it's
    // actually reachable for audio/transcriptions (OpenAI-compatible). OpenRouter does not
    // support STT, so fall back to OpenAI's endpoint when the LLM URL looks non-OpenAI.
    const llmBase = String(process.env.LLM_BASE_URL || "").trim().replace(/\/$/, "");
    const isOpenAiLike = llmBase.includes("openai.com") || llmBase.includes("api.openai");
    const envBase = isOpenAiLike ? llmBase : OPENAI_COMPATIBLE_BASE;

    return {
      ...config,
      apiKey: envKey || config.apiKey,
      baseUrl: envKey ? envBase : config.baseUrl,
    };
  }

  return config;
}

function resolveEnvFallbackConfig(baseConfig) {
  const OPENAI_COMPATIBLE_BASE = "https://api.openai.com/v1";

  const envKey = String(
    process.env.STT_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.LLM_API_KEY ||
    "",
  ).trim();

  if (!envKey) {
    return null;
  }

  const llmBase = String(process.env.LLM_BASE_URL || "").trim().replace(/\/$/, "");
  const isOpenAiLike = llmBase.includes("openai.com") || llmBase.includes("api.openai");
  const envBase = isOpenAiLike ? llmBase : OPENAI_COMPATIBLE_BASE;

  return {
    ...baseConfig,
    apiKey: envKey,
    baseUrl: envBase,
  };
}

async function requestSttTranscription({ config, formData, timeoutMs = 20000 }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/audio/transcriptions`, {
      method: "POST",
      headers: config.apiKey
        ? {
            Authorization: `Bearer ${config.apiKey}`,
          }
        : {},
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    const detail = String(error?.cause?.code || error?.message || "").trim();
    const target = redactUrl(config.baseUrl);
    const wrapped = new Error(
      error?.name === "AbortError"
        ? `STT provider timed out (${target}).`
        : `Failed to reach STT provider (${target})${detail ? `: ${redactSecrets(detail)}` : ""}.`,
    );
    wrapped.statusCode = 502;
    throw wrapped;
  } finally {
    clearTimeout(timeout);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { response, payload };
}

export async function transcribeAudioBase64({ audioBase64, mimeType = "audio/webm", language = "auto" }) {
  const rawConfig = getSttRuntimeConfig();
  const config = resolveEffectiveSttConfig(rawConfig);
  if (!config.enabled) {
    const error = new Error("STT runtime is disabled.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedBase64 = normalizeAudioBase64(audioBase64);
  if (!normalizedBase64) {
    const error = new Error("audioBase64 is required.");
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.from(normalizedBase64, "base64");
  if (!buffer.length) {
    const error = new Error("audioBase64 did not decode into audio bytes.");
    error.statusCode = 400;
    throw error;
  }

  if (buffer.length > config.maxAudioBytes) {
    const error = new Error(`Audio file exceeds max size of ${config.maxAudioBytes} bytes.`);
    error.statusCode = 413;
    throw error;
  }

  const fileExt = guessExtensionFromMime(mimeType);
  const blob = new Blob([buffer], { type: mimeType || "audio/webm" });
  const formData = new FormData();
  formData.append("file", blob, `recording.${fileExt}`);
  formData.append("model", config.model || "whisper-1");
  if (String(language || "").trim() && String(language || "").trim().toLowerCase() !== "auto") {
    formData.append("language", String(language).trim());
  } else if (String(config.language || "").trim() && String(config.language || "").trim().toLowerCase() !== "auto") {
    formData.append("language", String(config.language).trim());
  }

  let activeConfig = config;
  const authSource = !activeConfig.apiKey
    ? "none"
    : (rawConfig.apiKey && String(rawConfig.apiKey).trim() === String(activeConfig.apiKey).trim() ? "db" : "env");
  console.info(
    `[STT] authSource=${authSource} provider=${String(activeConfig.provider || "openai")} model=${String(activeConfig.model || "whisper-1")} baseUrl=${redactUrl(activeConfig.baseUrl)}`,
  );

  let { response, payload } = await requestSttTranscription({ config: activeConfig, formData });

  // If an explicit DB key is invalid, recover by retrying once with env fallback key.
  if ((response.status === 401 || response.status === 403) && activeConfig.apiKey) {
    const envFallback = resolveEnvFallbackConfig(activeConfig);
    if (envFallback && envFallback.apiKey !== activeConfig.apiKey) {
      activeConfig = envFallback;
      console.warn(
        `[STT] auth fallback engaged: retrying with env key using ${redactUrl(activeConfig.baseUrl)}`,
      );
      ({ response, payload } = await requestSttTranscription({ config: activeConfig, formData }));
    }
  }

  if (!response.ok) {
    const providerMessage = payload?.error?.message || payload?.error || `STT provider returned ${response.status}.`;
    const error = new Error(redactSecrets(String(providerMessage)));
    error.statusCode = response.status === 401 || response.status === 403 ? response.status : 502;
    throw error;
  }

  const text = String(payload?.text || payload?.transcript || "").trim();
  if (!text) {
    // No detected speech is a normal live-call outcome, not a provider failure.
    return {
      text: "",
      noSpeech: true,
      provider: activeConfig.provider,
      model: activeConfig.model,
      language: String(language || activeConfig.language || "auto").trim() || "auto",
      bytes: buffer.length,
    };
  }

  return {
    text,
    provider: activeConfig.provider,
    model: activeConfig.model,
    language: String(language || activeConfig.language || "auto").trim() || "auto",
    bytes: buffer.length,
  };
}
