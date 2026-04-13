#!/usr/bin/env node
import path from "node:path";
import { existsSync } from "node:fs";
import "dotenv/config";
import { getKokoroHfToken } from "../models/settingsModel.js";
import {
  preloadKokoro,
  listKokoroVoices,
  generateSpeechAudio,
} from "../services/ttsService.js";

const hfHome = process.env.HF_HOME || path.join(process.env.HOME || "~", ".cache", "huggingface");
const modelDir = path.join(hfHome, "hub", "models--onnx-community--Kokoro-82M-v1.0");

const PERSONALITY_RECOMMENDATIONS = Object.freeze({
  neutral_assistant: { primary: "af_heart", alternates: ["am_michael", "af_sarah"] },
  scientist_explainer: { primary: "am_onyx", alternates: ["bf_emma", "am_orion"] },
  energetic_hype: { primary: "am_puck", alternates: ["af_nova", "af_bella"] },
  storyteller_kids: { primary: "bf_alice", alternates: ["af_bella", "bm_fable"] },
  wise_mentor: { primary: "bm_george", alternates: ["am_onyx", "bf_isabella"] },
  dramatic_character: { primary: "bm_fable", alternates: ["am_fenrir", "af_river"] },
});

const VOICE_PROFILES = Object.freeze({
  recommended_core: [
    "af_heart",
    "am_michael",
    "bf_alice",
    "bm_george",
    "am_onyx",
    "af_bella",
  ],
  kids_mode: [
    "bf_alice",
    "af_bella",
    "af_sky",
    "am_puck",
  ],
  cinematic: [
    "bm_fable",
    "am_fenrir",
    "af_river",
    "am_orion",
  ],
  full: [],
});

function parseArgValue(name, fallback = "") {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) {
    return String(exact.split("=").slice(1).join("=") || "").trim();
  }
  return fallback;
}

function parseVoiceList(raw) {
  return String(raw || "")
    .split(",")
    .map((voice) => voice.trim())
    .filter(Boolean);
}

function flattenVoiceIds(catalog) {
  const all = [];
  for (const group of Object.values(catalog || {})) {
    for (const entry of Array.isArray(group) ? group : []) {
      if (entry?.id) {
        all.push(String(entry.id));
      }
    }
  }
  return Array.from(new Set(all));
}

function printProfiles(availableVoices) {
  const ids = flattenVoiceIds(availableVoices);
  const profileNames = Object.keys(VOICE_PROFILES);
  console.log("[Kokoro preload] Available voice profiles:");
  for (const name of profileNames) {
    const values = name === "full" ? ids : VOICE_PROFILES[name];
    console.log(`  - ${name}: ${values.join(", ")}`);
  }
  console.log("[Kokoro preload] Personality recommendations:");
  for (const [name, config] of Object.entries(PERSONALITY_RECOMMENDATIONS)) {
    console.log(`  - ${name}: primary=${config.primary}; alternates=${config.alternates.join(", ")}`);
  }
}

async function prewarmVoices(voices) {
  if (!voices.length) {
    console.log("[Kokoro preload] No voices selected for prewarm.");
    return;
  }

  const originalEngine = process.env.TTS_ENGINE;
  process.env.TTS_ENGINE = "kokoro";

  try {
    for (const voice of voices) {
      console.log(`[Kokoro preload] Prewarming voice ${voice}...`);
      const result = await generateSpeechAudio({
        personality: {
          id: 0,
          name: "Kokoro Warmup",
          instructions: "Keep the line concise.",
        },
        text: "Voice warmup check.",
        voiceProfile: {
          engine: "kokoro",
          kokoroVoice: voice,
          providerVoice: voice,
        },
        speechHint: "neutral",
      });

      if (!result?.buffer?.length) {
        throw new Error(`Voice ${voice} returned an empty buffer.`);
      }

      console.log(`[Kokoro preload] Voice ${voice} ready (${result.buffer.length} bytes).`);
    }
  } finally {
    if (typeof originalEngine === "string") {
      process.env.TTS_ENGINE = originalEngine;
    } else {
      delete process.env.TTS_ENGINE;
    }
  }
}

async function main() {
  const availableVoices = listKokoroVoices().voices;
  const availableVoiceIds = flattenVoiceIds(availableVoices);
  const listOnly = process.argv.includes("--list-voice-profiles");
  const doPrewarm = process.argv.includes("--prewarm-voices");
  const profile = parseArgValue("--voice-profile", process.env.KOKORO_VOICE_PROFILE || "recommended_core");
  const customVoiceList = parseVoiceList(parseArgValue("--voice-list", process.env.KOKORO_VOICE_LIST || ""));

  let dbToken = null;
  try {
    dbToken = getKokoroHfToken();
  } catch {
    dbToken = null;
  }

  const envToken = String(process.env.KOKORO_HF_TOKEN || process.env.HF_TOKEN || "").trim();
  const tokenConfigured = Boolean(dbToken?.token || envToken);
  const tokenSource = dbToken?.token ? "app_settings" : envToken ? "env" : "none";

  console.log(`[Kokoro preload] HF_HOME: ${hfHome}`);
  console.log(`[Kokoro preload] Token configured: ${tokenConfigured ? "yes" : "no"} (source: ${tokenSource})`);

  if (listOnly) {
    printProfiles(availableVoices);
    return;
  }

  const modelCached = existsSync(modelDir);
  if (modelCached) {
    console.log(`[Kokoro preload] Model already cached at ${modelDir}`);
  } else {
    console.log("[Kokoro preload] Model not found in local cache. Starting preload...");
    await preloadKokoro();

    if (!existsSync(modelDir)) {
      throw new Error(
        "Kokoro preload finished but model cache directory was not found. " +
        "Check HF token access and filesystem permissions."
      );
    }

    console.log(`[Kokoro preload] Completed. Cached at ${modelDir}`);
  }

  if (!doPrewarm) {
    return;
  }

  let selectedVoices = [];
  if (customVoiceList.length > 0) {
    selectedVoices = customVoiceList;
  } else if (profile === "full") {
    selectedVoices = availableVoiceIds;
  } else if (VOICE_PROFILES[profile]) {
    selectedVoices = VOICE_PROFILES[profile];
  } else {
    throw new Error(
      `Unknown voice profile \"${profile}\". ` +
      "Run with --list-voice-profiles to inspect valid profiles."
    );
  }

  const filtered = selectedVoices.filter((voice) => availableVoiceIds.includes(voice));
  const missing = selectedVoices.filter((voice) => !availableVoiceIds.includes(voice));

  if (missing.length > 0) {
    console.warn(`[Kokoro preload] Skipping unknown voices: ${missing.join(", ")}`);
  }

  await prewarmVoices(filtered);
}

main().catch((error) => {
  console.error(`[Kokoro preload] Failed: ${error?.message || error}`);
  process.exitCode = 1;
});
