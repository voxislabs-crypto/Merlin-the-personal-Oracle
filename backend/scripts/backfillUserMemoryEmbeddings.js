import "dotenv/config";

import db from "../db/db.js";
import { isEmbeddingConfigured, generateEmbedding, getEmbeddingModelName } from "../services/llmService.js";

function printUsage() {
  console.log("Usage: npm run backfill-user-memory-embeddings --workspace backend -- [--userId=ID] [--limit=100]");
}

function parseArgs(argv) {
  const options = {
    userId: null,
    limit: 100,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg.startsWith("--userId=")) {
      options.userId = Number(arg.split("=")[1]);
      continue;
    }

    if (arg.startsWith("--limit=")) {
      options.limit = Number(arg.split("=")[1]);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!isEmbeddingConfigured()) {
    console.error("Embeddings are not configured. Set EMBEDDING_MODEL and provider settings in backend/.env first.");
    process.exit(1);
  }

  const limit = Number.isFinite(options.limit) ? Math.min(500, Math.max(1, Math.floor(options.limit))) : 100;

  if (options.userId !== null && !Number.isInteger(options.userId)) {
    console.error("--userId must be an integer.");
    process.exit(1);
  }

  // Get user memories without embeddings
  const memories = db
    .prepare(
      `SELECT id, content, userId
       FROM user_memory
       WHERE (embedding = '' OR embedding IS NULL)
       ${options.userId ? 'AND userId = ?' : ''}
       ORDER BY importance DESC, id DESC
       LIMIT ?`,
    )
    .all(...(options.userId ? [options.userId, limit] : [limit]));

  console.log(`Found ${memories.length} user memories without embeddings`);

  let completed = 0;
  let failed = 0;

  for (const mem of memories) {
    try {
      const embedding = await generateEmbedding(mem.content);
      if (Array.isArray(embedding) && embedding.length > 0) {
        db.prepare(
          `UPDATE user_memory SET embedding = ?, embeddingModel = ? WHERE id = ?`,
        ).run(JSON.stringify(embedding), getEmbeddingModelName(), mem.id);
        completed++;
        console.log(`[${completed}/${memories.length}] Embedded user memory ${mem.id} (user ${mem.userId})`);
      }
    } catch (error) {
      failed++;
      console.error(`Failed to embed user memory ${mem.id}:`, error.message);
    }
  }

  console.log(
    JSON.stringify(
      {
        embeddingModel: getEmbeddingModelName(),
        attempted: memories.length,
        completed,
        failed,
        configured: isEmbeddingConfigured(),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
