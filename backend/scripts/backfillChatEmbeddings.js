import "dotenv/config";

import db from "../db/db.js";
import { embedChatMessageAsync, getChatMessages } from "../models/chatModel.js";
import { isEmbeddingConfigured, getEmbeddingModelName } from "../services/llmService.js";

function printUsage() {
  console.log("Usage: npm run backfill-chat-embeddings --workspace backend -- [--personality=ID] [--limit=100]");
}

function parseArgs(argv) {
  const options = {
    personalityId: null,
    limit: 100,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg.startsWith("--personality=")) {
      options.personalityId = Number(arg.split("=")[1]);
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

  if (options.personalityId !== null && !Number.isInteger(options.personalityId)) {
    console.error("--personality must be an integer.");
    process.exit(1);
  }

  // Get messages without embeddings
  const messages = db
    .prepare(
      `SELECT id, content, personalityId
       FROM chat_messages
       WHERE (embedding = '' OR embedding IS NULL)
       ${options.personalityId ? 'AND personalityId = ?' : ''}
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(...(options.personalityId ? [options.personalityId, limit] : [limit]));

  console.log(`Found ${messages.length} messages without embeddings`);

  let completed = 0;
  let failed = 0;

  for (const msg of messages) {
    try {
      await embedChatMessageAsync(msg.id, msg.content);
      completed++;
      console.log(`[${completed}/${messages.length}] Embedded message ${msg.id} (personality ${msg.personalityId})`);
    } catch (error) {
      failed++;
      console.error(`Failed to embed message ${msg.id}:`, error.message);
    }
  }

  console.log(
    JSON.stringify(
      {
        embeddingModel: getEmbeddingModelName(),
        attempted: messages.length,
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
