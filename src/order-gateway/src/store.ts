// Valkey/Redis access for the gateway.
//
// The order-processor consumes a stream where each entry carries the order as a
// JSON string in a `data` field, and it maintains a set of counters via INCR.
// We mirror those exact conventions here so the two apps interoperate.
import {
  open,
  type RedisConnection,
  type RedisParameter,
  type RedisResult,
} from '@spinframework/spin-redis';
import type { Config } from './config';
import type { Order } from './types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Counter keys owned by the order-processor.
const COUNTER_KEYS = {
  total: 'total_orders',
  failed: 'failed_orders',
  invalid: 'invalid_requests',
} as const;

function bin(value: string): RedisParameter {
  return { tag: 'binary', val: encoder.encode(value) };
}

function resultToString(result: RedisResult | undefined): string {
  if (!result) return '';
  switch (result.tag) {
    case 'status':
      return result.val;
    case 'binary':
      return decoder.decode(result.val);
    case 'int64':
      return result.val.toString();
    default:
      return '';
  }
}

// Append the order to the stream as a single `data` JSON field and return the
// generated message ID.
export function submitOrder(config: Config, order: Order): string {
  const conn = open(config.valkeyUrl);
  const result = conn.execute('XADD', [
    bin(config.streamName),
    bin('*'),
    bin('data'),
    bin(JSON.stringify(order)),
  ]);
  return resultToString(result[0]);
}

function readCounter(conn: RedisConnection, key: string): number {
  const raw = conn.get(key);
  if (!raw) return 0;
  const value = Number.parseInt(decoder.decode(raw), 10);
  return Number.isNaN(value) ? 0 : value;
}


export interface Metrics {
  totalOrders: number;
  failedOrders: number;
  invalidRequests: number;
}

export function getMetrics(config: Config): Metrics {
  const conn = open(config.valkeyUrl);
  return {
    totalOrders: readCounter(conn, COUNTER_KEYS.total),
    failedOrders: readCounter(conn, COUNTER_KEYS.failed),
    invalidRequests: readCounter(conn, COUNTER_KEYS.invalid),
  };
}

export function nukeMetrics(config: Config): void {
  const con = open(config.valkeyUrl);
  con.del([COUNTER_KEYS.total,COUNTER_KEYS.failed,COUNTER_KEYS.invalid])

}
