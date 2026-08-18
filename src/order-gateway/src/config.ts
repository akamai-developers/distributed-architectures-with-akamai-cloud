// Application configuration, sourced from Spin variables.
//
// Rather than reading Spin variables ad-hoc inside handlers, we resolve them
// once per request in `configMiddleware`. The resulting `Config` is attached to
// Hono's context (typed via `AppEnv`) and passed down to the router-agnostic
// store functions.
import type { Context, Next } from 'hono';
import { get } from '@spinframework/spin-variables';

export interface Config {
  valkeyUrl: string;
  streamName: string;
}

// Hono environment: makes `c.get('config')` / `c.set('config', ...)` type-safe.
export interface AppEnv {
  Variables: {
    config: Config;
  };
}

function loadConfig(): Config | null {
  const valkeyUrl = get('valkey_url');
  const streamName = get('stream_name');
  if (!valkeyUrl || !streamName) return null;
  return { valkeyUrl, streamName };
}

// Resolves and validates app config for every request hitting a valid route.
// If any required variable is missing, processing stops with 500.
export async function configMiddleware(c: Context<AppEnv>, next: Next) {
  const config = loadConfig();
  if (!config) {
    return c.text('Invalid App Config', 500);
  }
  c.set('config', config);
  return next();
}
