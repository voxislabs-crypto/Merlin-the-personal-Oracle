#!/usr/bin/env node
import path from "node:path";
import { existsSync } from "node:fs";
import "dotenv/config";
import { preloadKokoro } from "../services/ttsService.js";

const hfHome = process.env.HF_HOME || path.join(process.env.HOME || "~", ".cache", "huggingface");
const modelDir = path.join(hfHome, "hub", "models--onnx-community--Kokoro-82M-v1.0");

async function main() {
  const tokenConfigured = Boolean(String(process.env.KOKORO_HF_TOKEN || process.env.HF_TOKEN || "").trim());
  console.log(`[Kokoro preload] HF_HOME: ${hfHome}`);
  console.log(`[Kokoro preload] Token configured: ${tokenConfigured ? "yes" : "no"}`);

  if (existsSync(modelDir)) {
    console.log(`[Kokoro preload] Model already cached at ${modelDir}`);
    return;
  }

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

main().catch((error) => {
  console.error(`[Kokoro preload] Failed: ${error?.message || error}`);
  process.exitCode = 1;
});
