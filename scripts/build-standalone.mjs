import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const appDir = path.join(root, "app");
const tempRoot = path.join(root, ".standalone-temp");
const DISABLE_DIRS = [
  "api",
  "sign-in",
  "sign-up",
  "checkout-subscription",
  "(astro)",
  "oracle-chat",
  "profile",
  "soul-dashboard",
  "time-machine",
];

const DISABLE_FILES = [
  "middleware.ts",
];

function moveAsideForStandalone() {
  const moved = [];

  if (!fs.existsSync(tempRoot)) {
    fs.mkdirSync(tempRoot, { recursive: true });
  }

  for (const dirName of DISABLE_DIRS) {
    const source = path.join(appDir, dirName);
    const target = path.join(tempRoot, dirName);

    if (fs.existsSync(source) && !fs.existsSync(target)) {
      fs.renameSync(source, target);
      moved.push({ source, target });
    }
  }

  for (const fileName of DISABLE_FILES) {
    const source = path.join(root, fileName);
    const target = path.join(tempRoot, fileName);

    if (fs.existsSync(source) && !fs.existsSync(target)) {
      fs.renameSync(source, target);
      moved.push({ source, target });
    }
  }

  return moved;
}

function restoreMovedDirs(movedDirs) {
  for (const { source, target } of movedDirs) {
    if (fs.existsSync(target) && !fs.existsSync(source)) {
      fs.renameSync(target, source);
    }
  }

  if (fs.existsSync(tempRoot) && fs.readdirSync(tempRoot).length === 0) {
    fs.rmdirSync(tempRoot);
  }
}

// Copy swisseph.wasm to public/ so it's available in the static export for the
// Capacitor WebView.  The WASM engine (engine-wasm.ts) loads it from /swisseph.wasm.
function copyWasmToPublic() {
  const wasmSrc = path.join(root, "node_modules/@swisseph/browser/dist/swisseph.wasm");
  const wasmDest = path.join(root, "public/swisseph.wasm");
  if (fs.existsSync(wasmSrc)) {
    fs.copyFileSync(wasmSrc, wasmDest);
    console.log("[build-standalone] Copied swisseph.wasm to public/");
  } else {
    console.warn("[build-standalone] WARNING: swisseph.wasm not found at", wasmSrc);
    console.warn("[build-standalone] Run `npm install sweph @swisseph/browser` first.");
  }
}

let movedDirs = [];
let exitCode = 0;

try {
  copyWasmToPublic();
  movedDirs = moveAsideForStandalone();

  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    env: {
      ...process.env,
      STANDALONE_MOBILE: "true",
    },
  });

  exitCode = typeof result.status === "number" ? result.status : 1;
} catch (error) {
  console.error("Standalone build failed:", error);
  exitCode = 1;
} finally {
  restoreMovedDirs(movedDirs);
}

process.exit(exitCode);
