import * as winston from "winston";
import type { TransformableInfo } from "logform";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
    winston.format.printf((info: TransformableInfo) => {
      const ts = info["timestamp"] as string | undefined;
      return `${ts ?? new Date().toISOString()} [${info.level.toUpperCase()}] ${String(info.message)}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
