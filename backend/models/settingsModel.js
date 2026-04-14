import db from "../db/db.js";

const LLM_CONFIG_KEY = "llm_config";
const LLM_SAVED_CREDENTIALS_KEY = "llm_saved_credentials";
const TTS_CREDENTIALS_KEY = "tts_credentials";
const VOICE_DEFAULTS_KEY = "voice_defaults";
const KOKORO_HF_TOKEN_KEY = "kokoro_hf_token";
const MOOD_RUNTIME_CONFIG_KEY = "mood_runtime_config";
const EXPRESSION_SAMPLING_CONFIG_KEY = "expression_sampling_config";
const TTS_DEBUG_PROVIDER_LOCK_ENABLED = String(process.env.TTS_DEBUG_PROVIDER_LOCK ?? "true").trim().toLowerCase() !== "false";

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function sanitizeModels(models) {
  if (!Array.isArray(models)) {
    return [];
  }

  return models
    .map((model) => {
      if (!model || typeof model !== "object") {
        return null;
      }

      return {
        id: String(model.id || "").trim(),
        name: String(model.name || model.id || "").trim(),
        isFree: Boolean(model.isFree),
      };
    })
    .filter((model) => model && model.id)
    .slice(0, 300);
}

function normalizeCredentialTarget(provider, baseUrl) {
  return {
    provider: String(provider || "").trim(),
    baseUrl: String(baseUrl || "").trim().replace(/\/$/, ""),
  };
}

function sanitizeSavedCredentials(credentials) {
  if (!Array.isArray(credentials)) {
    return [];
  }

  const seen = new Set();

  return credentials
    .map((credential) => {
      if (!credential || typeof credential !== "object") {
        return null;
      }

      const target = normalizeCredentialTarget(credential.provider, credential.baseUrl);
      const apiKey = String(credential.apiKey || "").trim();
      if (!target.provider || !apiKey) {
        return null;
      }

      const dedupeKey = `${target.provider}::${target.baseUrl}`;
      if (seen.has(dedupeKey)) {
        return null;
      }
      seen.add(dedupeKey);

      return {
        provider: target.provider,
        baseUrl: target.baseUrl,
        apiKey,
        updatedAt: String(credential.updatedAt || "").trim(),
      };
    })
    .filter(Boolean)
    .slice(0, 30);
}

function writeAppSetting(key, value) {
  db.prepare(
    `INSERT INTO app_settings (key, value, updatedAt)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = CURRENT_TIMESTAMP`,
  ).run(key, JSON.stringify(value));
}

function sanitizeVoiceSource(source) {
  return ["tts", "llm"].includes(String(source || "").trim().toLowerCase())
    ? String(source).trim().toLowerCase()
    : "tts";
}

export function getLlmRuntimeConfig() {
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(LLM_CONFIG_KEY);
  const config = parseJsonObject(row?.value || "");
  if (!config) {
    return null;
  }

  return {
    provider: String(config.provider || "").trim(),
    baseUrl: String(config.baseUrl || "").trim(),
    apiKey: String(config.apiKey || "").trim(),
    model: String(config.model || "").trim(),
    models: sanitizeModels(config.models),
    connectedAt: String(config.connectedAt || "").trim(),
  };
}

export function setLlmRuntimeConfig(config) {
  const normalized = {
    provider: String(config.provider || "").trim(),
    baseUrl: String(config.baseUrl || "").trim().replace(/\/$/, ""),
    apiKey: String(config.apiKey || "").trim(),
    model: String(config.model || "").trim(),
    models: sanitizeModels(config.models),
    connectedAt: new Date().toISOString(),
  };

  writeAppSetting(LLM_CONFIG_KEY, normalized);

  return getLlmRuntimeConfig();
}

export function clearLlmRuntimeConfig() {
  db.prepare(`DELETE FROM app_settings WHERE key = ?`).run(LLM_CONFIG_KEY);
}

export function getSavedLlmCredentials() {
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(LLM_SAVED_CREDENTIALS_KEY);
  const saved = parseJsonObject(row?.value || "");
  return sanitizeSavedCredentials(saved?.credentials || saved?.providers || []);
}

export function getSavedLlmCredential({ provider, baseUrl } = {}) {
  const target = normalizeCredentialTarget(provider, baseUrl);
  if (!target.provider) {
    return null;
  }

  const savedCredentials = getSavedLlmCredentials();
  const exactMatch = savedCredentials.find(
    (credential) => credential.provider === target.provider && credential.baseUrl === target.baseUrl,
  );
  if (exactMatch) {
    return exactMatch;
  }

  // When the caller omitted baseUrl (non-custom providers), also accept the
  // first credential that matches on provider alone so saved keys are reused.
  if (!target.baseUrl) {
    return savedCredentials.find(
      (credential) => credential.provider === target.provider,
    ) || null;
  }

  return savedCredentials.find(
    (credential) => credential.provider === target.provider && credential.baseUrl === "",
  ) || null;
}

export function removeSavedLlmCredential({ provider, baseUrl }) {
  const target = normalizeCredentialTarget(provider, baseUrl);
  if (!target.provider) {
    return getSavedLlmCredentials();
  }

  const savedCredentials = getSavedLlmCredentials().filter(
    (credential) => !(credential.provider === target.provider && credential.baseUrl === target.baseUrl),
  );

  writeAppSetting(LLM_SAVED_CREDENTIALS_KEY, {
    credentials: sanitizeSavedCredentials(savedCredentials),
  });

  return getSavedLlmCredentials();
}

export function upsertSavedLlmCredential({ provider, baseUrl, apiKey }) {
  const target = normalizeCredentialTarget(provider, baseUrl);
  const normalizedKey = String(apiKey || "").trim();
  if (!target.provider || !normalizedKey) {
    return getSavedLlmCredentials();
  }

  const now = new Date().toISOString();
  const savedCredentials = getSavedLlmCredentials().filter(
    (credential) => !(credential.provider === target.provider && credential.baseUrl === target.baseUrl),
  );

  savedCredentials.unshift({
    provider: target.provider,
    baseUrl: target.baseUrl,
    apiKey: normalizedKey,
    updatedAt: now,
  });

  writeAppSetting(LLM_SAVED_CREDENTIALS_KEY, {
    credentials: sanitizeSavedCredentials(savedCredentials),
  });

  return getSavedLlmCredentials();
}

// ── TTS Credentials (BYOK) ──────────────────────────────────────────────────
// Stores per-provider API keys for ElevenLabs and Cartesia in SQLite so users
// can configure them from the browser without touching .env files.

const TTS_PROVIDERS = ["elevenlabs", "cartesia"];

export function isTtsDebugProviderLockEnabled() {
  return TTS_DEBUG_PROVIDER_LOCK_ENABLED;
}

export function getAllowedTtsCredentialProviders() {
  return TTS_DEBUG_PROVIDER_LOCK_ENABLED ? ["cartesia"] : TTS_PROVIDERS;
}

function sanitizeTtsProvider(id) {
  return getAllowedTtsCredentialProviders().includes(String(id || "").trim().toLowerCase())
    ? String(id).trim().toLowerCase()
    : null;
}

function sanitizeTtsCredential(provider, data) {
  if (!data || typeof data !== "object") return null;
  return {
    provider,
    apiKey: String(data.apiKey || "").trim(),
    voiceId: String(data.voiceId || "").trim(),
    model: String(data.model || "").trim(),
    updatedAt: String(data.updatedAt || "").trim(),
  };
}

function readTtsStore() {
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(TTS_CREDENTIALS_KEY);
  return parseJsonObject(row?.value || "") || {};
}

export function getTtsCredential(provider) {
  const id = sanitizeTtsProvider(provider);
  if (!id) return null;
  const store = readTtsStore();
  return sanitizeTtsCredential(id, store[id]) || null;
}

export function getAllTtsCredentials() {
  const store = readTtsStore();
  return getAllowedTtsCredentialProviders().map((id) => sanitizeTtsCredential(id, store[id])).filter(Boolean);
}

export function setTtsCredential({ provider, apiKey, voiceId = "", model = "" }) {
  const id = sanitizeTtsProvider(provider);
  if (!id) throw Object.assign(new Error(`Unknown TTS provider: ${provider}`), { statusCode: 400 });
  const key = String(apiKey || "").trim();
  if (!key) throw Object.assign(new Error("apiKey is required."), { statusCode: 400 });

  const store = readTtsStore();
  store[id] = {
    apiKey: key,
    voiceId: String(voiceId || "").trim(),
    model: String(model || "").trim(),
    updatedAt: new Date().toISOString(),
  };
  writeAppSetting(TTS_CREDENTIALS_KEY, store);
  return getTtsCredential(id);
}

export function clearTtsCredential(provider) {
  const id = sanitizeTtsProvider(provider);
  if (!id) throw Object.assign(new Error(`Unknown TTS provider: ${provider}`), { statusCode: 400 });
  const store = readTtsStore();
  delete store[id];
  writeAppSetting(TTS_CREDENTIALS_KEY, store);
}

export function getVoiceDefaults() {
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(VOICE_DEFAULTS_KEY);
  const parsed = parseJsonObject(row?.value || "") || {};
  return {
    source: sanitizeVoiceSource(parsed.source),
    updatedAt: String(parsed.updatedAt || "").trim(),
  };
}

export function setVoiceDefaults({ source }) {
  const normalized = {
    source: sanitizeVoiceSource(source),
    updatedAt: new Date().toISOString(),
  };

  writeAppSetting(VOICE_DEFAULTS_KEY, normalized);
  return getVoiceDefaults();
}

export function getKokoroHfToken() {
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(KOKORO_HF_TOKEN_KEY);
  const parsed = parseJsonObject(row?.value || "");
  const token = String(parsed?.token || "").trim();
  if (!token) {
    return null;
  }

  return {
    token,
    updatedAt: String(parsed?.updatedAt || "").trim(),
  };
}

export function setKokoroHfToken({ token }) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    throw Object.assign(new Error("token is required."), { statusCode: 400 });
  }

  writeAppSetting(KOKORO_HF_TOKEN_KEY, {
    token: normalizedToken,
    updatedAt: new Date().toISOString(),
  });

  return getKokoroHfToken();
}

export function clearKokoroHfToken() {
  db.prepare(`DELETE FROM app_settings WHERE key = ?`).run(KOKORO_HF_TOKEN_KEY);
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function sanitizeRecoveryCurves(curves) {
  const input = curves && typeof curves === "object" ? curves : {};
  return {
    default: clampNumber(input.default, 0.01, 0.25, 0.08),
    stoic: clampNumber(input.stoic, 0.01, 0.25, 0.12),
    volatile: clampNumber(input.volatile, 0.01, 0.25, 0.04),
    bratty: clampNumber(input.bratty, 0.01, 0.25, 0.06),
    villainous: clampNumber(input.villainous, 0.01, 0.25, 0.03),
    kind: clampNumber(input.kind, 0.01, 0.25, 0.1),
  };
}

function sanitizeMoodRuntimeConfig(config) {
  const normalized = config && typeof config === "object" ? config : {};
  const inertia = clampNumber(normalized.inertia, 0.5, 0.95, 0.75);
  const responsiveness = clampNumber(
    normalized.responsiveness,
    0.05,
    0.5,
    Number((1 - inertia).toFixed(3)),
  );

  return {
    inertia,
    responsiveness,
    perTurnDeltaCap: clampNumber(normalized.perTurnDeltaCap, 0.2, 0.8, 0.45),
    recoveryCurves: sanitizeRecoveryCurves(normalized.recoveryCurves),
    updatedAt: String(normalized.updatedAt || "").trim(),
  };
}

export function getMoodRuntimeConfig() {
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(MOOD_RUNTIME_CONFIG_KEY);
  const parsed = parseJsonObject(row?.value || "") || {};
  return sanitizeMoodRuntimeConfig(parsed);
}

export function setMoodRuntimeConfig(config) {
  const sanitized = sanitizeMoodRuntimeConfig(config);
  const payload = {
    ...sanitized,
    updatedAt: new Date().toISOString(),
  };
  writeAppSetting(MOOD_RUNTIME_CONFIG_KEY, payload);
  return getMoodRuntimeConfig();
}

function sanitizeExpressionModeProfile(profile, defaults) {
  const input = profile && typeof profile === "object" ? profile : {};
  return {
    enabled: typeof input.enabled === "boolean" ? input.enabled : defaults.enabled,
    topK: Math.round(clampNumber(input.topK, 1, 6, defaults.topK)),
    temperature: clampNumber(input.temperature, 0.05, 1.2, defaults.temperature),
    maxReplacements: Math.round(clampNumber(input.maxReplacements, 0, 3, defaults.maxReplacements)),
  };
}

function sanitizeExpressionSamplingConfig(config) {
  const input = config && typeof config === "object" ? config : {};
  const defaults = {
    enabled: true,
    deterministicSeed: true,
    modeProfiles: {
      kids: { enabled: true, topK: 2, temperature: 0.3, maxReplacements: 1 },
      scientist: { enabled: false, topK: 1, temperature: 0.1, maxReplacements: 0 },
      normal: { enabled: true, topK: 3, temperature: 0.6, maxReplacements: 2 },
    },
  };

  return {
    enabled: typeof input.enabled === "boolean" ? input.enabled : defaults.enabled,
    deterministicSeed:
      typeof input.deterministicSeed === "boolean"
        ? input.deterministicSeed
        : defaults.deterministicSeed,
    modeProfiles: {
      kids: sanitizeExpressionModeProfile(input.modeProfiles?.kids, defaults.modeProfiles.kids),
      scientist: sanitizeExpressionModeProfile(input.modeProfiles?.scientist, defaults.modeProfiles.scientist),
      normal: sanitizeExpressionModeProfile(input.modeProfiles?.normal, defaults.modeProfiles.normal),
    },
    updatedAt: String(input.updatedAt || "").trim(),
  };
}

export function getExpressionSamplingConfig() {
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(EXPRESSION_SAMPLING_CONFIG_KEY);
  const parsed = parseJsonObject(row?.value || "") || {};
  return sanitizeExpressionSamplingConfig(parsed);
}

export function setExpressionSamplingConfig(config) {
  const sanitized = sanitizeExpressionSamplingConfig(config);
  const payload = {
    ...sanitized,
    updatedAt: new Date().toISOString(),
  };
  writeAppSetting(EXPRESSION_SAMPLING_CONFIG_KEY, payload);
  return getExpressionSamplingConfig();
}
