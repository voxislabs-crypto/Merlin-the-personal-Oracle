const path = require("node:path");

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "voxis-backend",
      cwd: path.join(__dirname, "backend"),
      script: "server.js",
      interpreter: "node",
      env_file: path.join(__dirname, "backend", ".env"),
      max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || "1536M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3101",
        // TTS vars: read from shell env when pm2 loads this config, fall back to safe defaults.
        // "set -a && source backend/.env && set +a" before pm2 startOrReload exports these properly.
        // Clerk: forward canonical key name so @clerk/express per-request env lookups work.
        // Set BOTH aliases: @clerk/shared reads NEXT_PUBLIC_ first, CLERK_ second.
        CLERK_PUBLISHABLE_KEY:
          process.env.CLERK_PUBLISHABLE_KEY ||
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
          process.env.VITE_CLERK_PUBLISHABLE_KEY ||
          "",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
          process.env.CLERK_PUBLISHABLE_KEY ||
          process.env.VITE_CLERK_PUBLISHABLE_KEY ||
          "",
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
        TTS_ENGINE: process.env.TTS_ENGINE || "auto",
        TTS_DEBUG_PROVIDER_LOCK: process.env.TTS_DEBUG_PROVIDER_LOCK ?? "false",
        // Default true: prevents ~500MB Kokoro model load on servers where it isn't wanted.
        TTS_DISABLE_KOKORO: process.env.TTS_DISABLE_KOKORO ?? "true",
        TTS_REQUEST_TIMEOUT_MS: process.env.TTS_REQUEST_TIMEOUT_MS || "12000",
      },
    },
  ],
};