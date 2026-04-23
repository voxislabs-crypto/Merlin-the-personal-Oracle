import { getSttRuntimeConfig } from "../models/settingsModel.js";

function normalizeAudioBase64(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    return "";
  }

  const match = raw.match(/^data:.*?;base64,(.+)$/i);
  return (match ? match[1] : raw).replace(/\s+/g, "");
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

export async function transcribeAudioBase64({ audioBase64, mimeType = "audio/webm", language = "auto" }) {
  const config = getSttRuntimeConfig();
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
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
    const wrapped = new Error(error?.name === "AbortError" ? "STT provider timed out." : "Failed to reach STT provider.");
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

  if (!response.ok) {
    const providerMessage = payload?.error?.message || payload?.error || `STT provider returned ${response.status}.`;
    const error = new Error(String(providerMessage));
    error.statusCode = response.status === 401 || response.status === 403 ? response.status : 502;
    throw error;
  }

  const text = String(payload?.text || payload?.transcript || "").trim();
  if (!text) {
    const error = new Error("STT provider returned an empty transcript.");
    error.statusCode = 502;
    throw error;
  }

  return {
    text,
    provider: config.provider,
    model: config.model,
    language: String(language || config.language || "auto").trim() || "auto",
    bytes: buffer.length,
  };
}
