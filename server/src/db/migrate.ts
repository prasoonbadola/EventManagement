import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { AppDataSource } from "./data-source.js";
import { logger } from "../shared/logger.js";

/**
 * Executes the DDL statements in schema.sql to guarantee tables and indexes exist.
 * Uses AppDataSource.query to reuse the central application connection pool.
 */
export async function migrate() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const sql = readFileSync(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
  await AppDataSource.query(sql);
}

if (process.argv[1]?.endsWith("migrate.ts")) {
  migrate()
    .then(() => logger.info("Database schema is up to date."))
    .finally(async () => {
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
    });
}
