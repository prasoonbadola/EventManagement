import "reflect-metadata";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { migrate } from "./db/migrate.js";
import { seed } from "./db/seed.js";
import { AppDataSource } from "./db/data-source.js";
import { logger } from "./shared/logger.js";

await AppDataSource.initialize();
await migrate();
await seed();
createApp().listen(env.port, () => {
  logger.info(`API listening on http://localhost:${env.port}`, { port: env.port, env: process.env.NODE_ENV || "development" });
});
