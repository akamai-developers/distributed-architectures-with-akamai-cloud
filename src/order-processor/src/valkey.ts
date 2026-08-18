import Redis from "ioredis";
import { config } from "./config";
import logger from "./logger";

export async function connectValkey(): Promise<Redis> {
  const client = new Redis(config.VALKEY_URL, {
    // Prevent ioredis from retrying forever on initial connect failure
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  // Persistent error handler — keeps Node from crashing on post-connect errors
  client.on("error", (err: Error) => {
    logger.error(`Valkey client error: ${err.message}`);
  });

  await client.connect();
  logger.info("Connected to Valkey");
  return client;
}

export async function ensureConsumerGroup(client: Redis): Promise<void> {
  try {
    await client.xgroup("CREATE", config.STREAM_NAME, config.CONSUMER_GROUP, "$", "MKSTREAM");
    logger.info(`Consumer group "${config.CONSUMER_GROUP}" created on stream "${config.STREAM_NAME}"`);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("BUSYGROUP")) {
      logger.info(`Consumer group "${config.CONSUMER_GROUP}" already exists — continuing`);
    } else {
      throw err;
    }
  }
}
