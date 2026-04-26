/**
 * openVoiceAdapter.js
 *
 * Integrates OpenVoice v2 (MyShell-AI/OpenVoice) for zero-shot voice cloning.
 * OpenVoice v2 uses MeloTTS as the base synthesizer + a lightweight tone-color
 * converter to transfer prosody / timbre from a reference clip.
 *
 * Python dependencies (install once on the server):
 *   pip install git+https://github.com/myshell-ai/MeloTTS.git
 *   pip install git+https://github.com/myshell-ai/OpenVoice.git
 *
 * The adapter calls a Python script for inference so Node.js never needs to
 * load the Python runtime directly.
 *
 * Expected environment variables (optional):
 *   OPENVOICE_PYTHON  — python3 binary to use (default: "python3")
 *   OPENVOICE_SCRIPTS_DIR — override scripts directory path
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import os from "node:os";
import { spawn } from "node:child_process";
import { ensureVoiceClonesDir, getVoiceCloneDir } from "./voiceCloneService.js";

const SCRIPTS_DIR =
  process.env.OPENVOICE_SCRIPTS_DIR ||
  path.join(path.dirname(new URL(import.meta.url).pathname), "..", "voice-clone-scripts");

const PYTHON_BIN = process.env.OPENVOICE_PYTHON || "python3";

const OPENVOICE_TIMEOUT_MS = 120_000; // 2 min max on CPU

/**
 * Run the OpenVoice Python synthesis script as a subprocess.
 */
function runOpenVoiceScript(args, timeoutMs = OPENVOICE_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const script = path.join(SCRIPTS_DIR, "openvoice_synthesize.py");
    const proc = spawn(PYTHON_BIN, [script, ...args], { stdio: ["pipe", "pipe", "pipe"] });

    const stdout = [];
    const stderr = [];
    proc.stdout.on("data", (d) => stdout.push(d));
    proc.stderr.on("data", (d) => stderr.push(d));

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      const err = new Error(`OpenVoice synthesis timed out after ${timeoutMs}ms.`);
      err.statusCode = 503;
      reject(err);
    }, timeoutMs);

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        const errText = Buffer.concat(stderr).toString("utf8").slice(0, 800);
        const err = new Error(`OpenVoice script exited with code ${code}: ${errText}`);
        err.statusCode = 502;
        reject(err);
      } else {
        resolve(Buffer.concat(stdout));
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Check if the OpenVoice Python environment is available.
 */
export async function isOpenVoiceInstalled() {
  return new Promise((resolve) => {
    const proc = spawn(PYTHON_BIN, ["-c", "import openvoice; import melo"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}

/**
 * Register a cleaned reference WAV for a persona.
 * Copies the normalized WAV into the persona's clone directory.
 *
 * @returns {Promise<string>} The stored reference path (absolute, on disk).
 */
export async function registerReference(personalityId, cleanedWavPath) {
  const dir = await ensureVoiceClonesDir(personalityId);
  const destPath = path.join(dir, "openvoice-reference.wav");
  await fs.copyFile(cleanedWavPath, destPath);
  return destPath;
}

/**
 * Check if a reference clip is registered for this persona.
 */
export async function hasReference(personalityId) {
  const refPath = path.join(getVoiceCloneDir(personalityId), "openvoice-reference.wav");
  try {
    await fs.access(refPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Synthesize speech using OpenVoice v2.
 * Calls the Python script with the registered reference clip.
 *
 * @param {object} opts
 * @param {string} opts.text
 * @param {number|string} opts.personalityId
 * @param {number} [opts.rate]   Speech rate multiplier (0.7–1.3)
 * @returns {Promise<{ buffer: Buffer, contentType: string, engine: string }>}
 */
export async function synthesizeOpenVoice({ text, personalityId, rate = 1 }) {
  const refPath = path.join(getVoiceCloneDir(personalityId), "openvoice-reference.wav");

  try {
    await fs.access(refPath);
  } catch {
    const err = new Error(
      "No OpenVoice reference clip found for this persona. Run voice cloning first.",
    );
    err.statusCode = 400;
    throw err;
  }

  const tmpOut = path.join(os.tmpdir(), `voxis-ov-${randomUUID()}.wav`);

  try {
    await runOpenVoiceScript([
      "--reference", refPath,
      "--text", text,
      "--output", tmpOut,
      "--rate", String(Math.min(1.3, Math.max(0.7, Number(rate) || 1))),
    ]);

    const buffer = await fs.readFile(tmpOut);
    return { buffer, contentType: "audio/wav", engine: "openvoice" };
  } finally {
    await fs.unlink(tmpOut).catch(() => {});
  }
}

/**
 * Remove stored reference clips for a persona.
 */
export async function removeOpenVoiceReference(personalityId) {
  const refPath = path.join(getVoiceCloneDir(personalityId), "openvoice-reference.wav");
  await fs.unlink(refPath).catch(() => {});
}
