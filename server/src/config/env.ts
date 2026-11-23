import "dotenv/config";
import { z } from "zod";
import { logger } from "../shared/logger.js";

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgres://evt:evt@localhost:5432/events"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required").default("dev-only-secret"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).optional(),
  DB_POOL_SIZE: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error("Invalid environment configuration:", parsed.error.format());
  process.exit(1);
}

export const env = {
  databaseUrl: parsed.data.DATABASE_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  port: parsed.data.PORT,
  clientOrigin: parsed.data.CLIENT_ORIGIN,
  isProd: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  logLevel: parsed.data.LOG_LEVEL ?? (parsed.data.NODE_ENV === "production" ? "info" : "debug"),
  dbPoolSize: parsed.data.DB_POOL_SIZE,
};
