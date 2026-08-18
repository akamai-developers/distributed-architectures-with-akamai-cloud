import { config } from "./config";
import logger from "./logger";
import { connectValkey, ensureConsumerGroup } from "./valkey";
import { claimStalePendingMessages } from "./pendingMessages";
import { isOrder } from "./types";
import { processOrder } from "./processor";
import type Redis from "ioredis";
import { hostname } from "os";

// Identifies which instance handled a message in the logs.
const HOSTNAME = hostname();

// ioredis returns null on BLOCK timeout, or:
// Array<[streamName, Array<[messageId, flatFieldsArray]>]>
type XReadGroupResult = Array<[string, Array<[string, string[]]>]> | null;

async function handleMessage(client: Redis, id: string, fields: string[]): Promise<void> {
  const dataIndex = fields.indexOf("data");
  const raw = dataIndex !== -1 ? fields[dataIndex + 1] : undefined;

  let parsed: unknown;
  try {
    parsed = raw !== undefined ? JSON.parse(raw) : undefined;
  } catch {
    parsed = undefined;
  }

  if (isOrder(parsed)) {
    try {
      await processOrder(parsed);
      // Best-effort ACK and counter — log a warning if either fails but don't throw,
      // as the order was already processed successfully.
      try {
        await client.xack(config.STREAM_NAME, config.CONSUMER_GROUP, id);
        await client.incr("total_orders");
      } catch (counterErr: unknown) {
        const msg = counterErr instanceof Error ? counterErr.message : String(counterErr);
        logger.warn(`Order ${parsed.id} processed but post-ACK step failed: ${msg}`);
      }
      logger.info(`Order ${parsed.id} (Total: ${parsed.total}) processed successfully on ${HOSTNAME}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to process order on ${HOSTNAME} — id=${id}: ${msg}`);
      // Do NOT ack — message stays in PEL for recovery
      await client.incr("failed_orders").catch(() => {});
    }
  } else {
    await client.incr("invalid_requests").catch(() => {});
    logger.warn(`Invalid or unrecognised message — id=${id} raw=${JSON.stringify(fields)}`);
    // Do NOT ack — malformed messages stay in PEL and are handled by the recovery stub
  }
}

async function main(): Promise<void> {
  const client = await connectValkey();
  await ensureConsumerGroup(client);
  await claimStalePendingMessages(client);

  let running = true;

  const shutdown = () => {
    logger.info("Shutdown signal received — draining current batch then exiting...");
    running = false;
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  logger.info(
    `Consumer "${config.CONSUMER_NAME}" listening on stream "${config.STREAM_NAME}" (group: "${config.CONSUMER_GROUP}")`
  );

  while (running) {
    const result = (await client.xreadgroup(
      "GROUP",
      config.CONSUMER_GROUP,
      config.CONSUMER_NAME,
      "COUNT",
      "10",
      "BLOCK",
      "2000",
      "STREAMS",
      config.STREAM_NAME,
      ">"
    )) as XReadGroupResult;

    if (!result) continue; // BLOCK timeout — no messages, loop again

    for (const [, messages] of result) {
      for (const [id, fields] of messages) {
        await handleMessage(client, id, fields);
      }
    }
  }

  logger.info("Loop exited cleanly — closing Valkey connection");
  await client.quit();
}

main().catch((err) => {
  logger.error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
