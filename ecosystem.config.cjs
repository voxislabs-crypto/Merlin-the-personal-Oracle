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
      },
    },
  ],
};