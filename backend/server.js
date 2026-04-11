import express from "express";
import cors from "cors";

import personalityRoutes from "./routes/personalityRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import loopRoutes from "./routes/loopRoutes.js";
import sfxRoutes from "./routes/sfxRoutes.js";
import { initSfxCache } from "./services/sfxCacheService.js";
import { getTtsHealthStatus, preloadKokoro } from "./services/ttsService.js";
import { clerkVerify } from "./middleware/requireAuth.js";

try {
  await import("dotenv/config");
} catch {
  console.warn("[Env] dotenv not installed; relying on PM2/system environment only.");
}

const app = express();
const port = Number(process.env.PORT || 3101);

function getReleaseInfo() {
  return {
    gitSha: String(process.env.VOXIS_GIT_SHA || "").trim(),
    branch: String(process.env.VOXIS_BRANCH || "").trim(),
    pm2AppName: String(process.env.PM2_APP_NAME || "voxis-backend").trim(),
  };
}

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

// Clerk JWT verification runs on every request (no-op when no token present).
// Individual routes call requireAuth() to enforce sign-in.
app.use(clerkVerify);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    release: getReleaseInfo(),
  });
});

app.get("/health/tts", async (_req, res, next) => {
  try {
    const status = await getTtsHealthStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

app.use(personalityRoutes);
app.use(chatRoutes);
app.use(settingsRoutes);
app.use(userRoutes);
app.use(loopRoutes);
app.use(sfxRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);

  if (res.headersSent) {
    return;
  }

  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
  });
});

app.listen(port, () => {
  const release = getReleaseInfo();
  console.log(
    `Voxis backend listening on port ${port} (branch=${release.branch || "unknown"}, sha=${release.gitSha || "unknown"})`,
  );
  // Non-blocking SFX pre-fetch on startup
  initSfxCache().catch((err) => console.warn("[SFX Cache] init error:", err.message));
  // Pre-load Kokoro model in the background so the first TTS request is instant.
  // Skip if a different engine is forced via TTS_ENGINE env to avoid crash loops
  // when Kokoro's HuggingFace model files are unavailable.
  const _forcedEngine = String(process.env.TTS_ENGINE || "auto").trim().toLowerCase();
  if (_forcedEngine === "auto" || _forcedEngine === "kokoro") {
    preloadKokoro().catch((err) => console.warn("[Kokoro] preload error:", err.message));
  } else {
    console.log(`[Kokoro] Preload skipped (TTS_ENGINE=${_forcedEngine}).`);
  }
});
