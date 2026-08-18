import Redis from "ioredis";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function claimStalePendingMessages(client: Redis): Promise<void> {
  /*
   * PENDING MESSAGE RECOVERY (STUB)
   *
   * In a Valkey/Redis Streams consumer group, if a consumer reads a message but
   * never ACKs it, that message sits in the Pending Entries List (PEL) indefinitely.
   * Valkey itself does NOT re-deliver it automatically — a consumer must actively
   * claim it via XAUTOCLAIM or XCLAIM.
   *
   * The challenge in a horizontally-scaled Kubernetes deployment is that pod names
   * are ephemeral. If pod "order-processor-abc" claimed a message and then crashed,
   * no future pod will ever have that same consumer name, so the message would be
   * stuck in the PEL forever unless claimed by another consumer.
   *
   * RECOMMENDED APPROACH:
   * On startup, use XAUTOCLAIM to scan the PEL for messages that have been idle
   * longer than a configurable threshold (e.g. 30 seconds) and re-assign them to
   * THIS consumer. Process and ACK them normally.
   *
   * To prevent infinite retries for poison messages:
   * - Use a separate Redis Hash (e.g. `order-processor:retry-counts`) keyed by
   *   message ID to track how many times a message has been attempted.
   * - After 3 failed attempts, move the message to a dead-letter stream
   *   (e.g. `orders:dead-letter`) and ACK the original so it leaves the PEL.
   * - This requires incrementing the retry count BEFORE processing, so a crash
   *   mid-processing still counts as an attempt.
   *
   * This stub is intentionally left unimplemented for demo purposes.
   */
}
