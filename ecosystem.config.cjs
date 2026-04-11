const path = require("node:path");

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "voxis-backend",
      cwd: path.join(__dirname, "backend"),
      script: "server.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3101",
      },
    },
  ],
};