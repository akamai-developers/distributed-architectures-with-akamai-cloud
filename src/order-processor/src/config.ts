function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function buildConfig() {
  const CONSUMER_GROUP = process.env.CONSUMER_GROUP ?? "order-processors";
  return {
    VALKEY_URL: requireEnv("VALKEY_URL"),
    STREAM_NAME: process.env.STREAM_NAME ?? "orders",
    CONSUMER_GROUP,
    CONSUMER_NAME: process.env.POD_NAME ?? `${CONSUMER_GROUP}-1`,
  } as const;
}

export type Config = ReturnType<typeof buildConfig>;
export const config: Config = buildConfig();
