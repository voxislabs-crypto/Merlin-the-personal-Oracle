/**
 * rvcAdapter.js
 *
 * Integrates RVC (Retrieval-based Voice Conversion) as a post-processing
 * layer on top of Kokoro TTS output.
 *
 * Pipeline: text → Kokoro WAV → RVC conversion → output WAV
 *
 * Voice Packs are pre-trained RVC models registered in the rvc_voice_packs
 * SQLite table. Each pack has a .pth model file + optional index file.
 *
 * Python dependencies (install once on the server):
 *   pip install rvc-python
 *   # OR the full RVC project:
 *   # git clone https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI
 *
 * Expected environment variables (optional):
 *   RVC_PYTHON      — python3 binary (default: "python3")
 *   RVC_SCRIPTS_DIR — override scripts directory path
 *   RVC_F0_METHOD   — pitch extraction method: rmvpe (default, best on CPU)
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import os from "node:os";
import { spawn } from "node:child_process";
import { getRvcPackDir } from "./voiceCloneService.js";

const SCRIPTS_DIR =
  process.env.RVC_SCRIPTS_DIR ||
  path.join(path.dirname(new URL(import.meta.url).pathname), "..", "voice-clone-scripts");

const PYTHON_BIN = process.env.RVC_PYTHON || "python3";
const F0_METHOD = process.env.RVC_F0_METHOD || "rmvpe";

// RVC on CPU is slower — allow enough time for a paragraph of speech
const RVC_TIMEOUT_MS = 90_000;

/**
 * Run the RVC conversion Python script as a subprocess.
 */
function runRvcScript(args, timeoutMs = RVC_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const script = path.join(SCRIPTS_DIR, "rvc_convert.py");
    const proc = spawn(PYTHON_BIN, [script, ...args], { stdio: ["pipe", "pipe", "pipe"] });

    const stderr = [];
    proc.stderr.on("data", (d) => stderr.push(d));

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      const err = new Error(`RVC conversion timed out after ${timeoutMs}ms.`);
      err.statusCode = 503;
      reject(err);
    }, timeoutMs);

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        const errText = Buffer.concat(stderr).toString("utf8").slice(0, 800);
        const err = new Error(`RVC script exited with code ${code}: ${errText}`);
        err.statusCode = 502;
        reject(err);
      } else {
        resolve();
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Check if the RVC Python environment is available.
 */
export async function isRvcInstalled() {
  return new Promise((resolve) => {
    const proc = spawn(PYTHON_BIN, ["-c", "import rvc_python"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}

/**
 * Get the model path for a voice pack, given its directory.
 * Looks for the first .pth file in the pack directory.
 */
export async function resolveModelPath(packId) {
  const packDir = getRvcPackDir(packId);
  let files;
  try {
    files = await fs.readdir(packDir);
  } catch {
    return null;
  }
  const modelFile = files.find((f) => f.endsWith(".pth"));
  return modelFile ? path.join(packDir, modelFile) : null;
}

/**
 * Get the optional index file path for a pack.
 */
export async function resolveIndexPath(packId) {
  const packDir = getRvcPackDir(packId);
  let files;
  try {
    files = await fs.readdir(packDir);
  } catch {
    return null;
  }
  const indexFile = files.find((f) => f.endsWith(".index"));
  return indexFile ? path.join(packDir, indexFile) : null;
}

/**
 * Convert a WAV buffer using an RVC voice pack.
 *
 * @param {object} opts
 * @param {Buffer} opts.inputBuffer   WAV audio to convert (e.g. Kokoro output)
 * @param {number|string} opts.packId RVC voice pack ID
 * @param {number} [opts.pitchShift]  Semitone shift (0 = no change, ±12 = one octave)
 * @returns {Promise<{ buffer: Buffer, contentType: string, engine: string }>}
 */
export async function convertWithRvc({ inputBuffer, packId, pitchShift = 0 }) {
  const modelPath = await resolveModelPath(packId);
  if (!modelPath) {
    const err = new Error(`RVC voice pack ${packId} model file (.pth) not found.`);
    err.statusCode = 400;
    throw err;
  }

  const indexPath = (await resolveIndexPath(packId)) || "";

  const tmpIn = path.join(os.tmpdir(), `voxis-rvc-in-${randomUUID()}.wav`);
  const tmpOut = path.join(os.tmpdir(), `voxis-rvc-out-${randomUUID()}.wav`);

  try {
    await fs.writeFile(tmpIn, inputBuffer);

    await runRvcScript([
      "--model", modelPath,
      "--input", tmpIn,
      "--output", tmpOut,
      "--f0-method", F0_METHOD,
      "--pitch", String(Math.round(Number(pitchShift) || 0)),
      ...(indexPath ? ["--index", indexPath] : []),
    ]);

    const buffer = await fs.readFile(tmpOut);
    return { buffer, contentType: "audio/wav", engine: "kokoro-rvc" };
  } finally {
    await Promise.all([
      fs.unlink(tmpIn).catch(() => {}),
      fs.unlink(tmpOut).catch(() => {}),
    ]);
  }
}
