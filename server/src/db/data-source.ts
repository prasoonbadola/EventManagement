import { DataSource } from "typeorm";
import { env } from "../config/env.js";
import { UserEntity } from "../entities/User.js";
import { EventEntity } from "../entities/Event.js";
import { RegistrationEntity } from "../entities/Registration.js";

/**
 * Safely parses a PostgreSQL URL into connection options.
 * This prevents TypeORM's built-in URL parser from crashing with
 * `URIError: URI malformed` when passwords contain raw characters like `%` or `$`.
 */
function parseDbConnection(rawUrl: string) {
  const isCloud =
    rawUrl.includes("supabase.") ||
    rawUrl.includes("neon.tech") ||
    rawUrl.includes("rds.amazonaws.com") ||
    rawUrl.includes("pooler.supabase.com") ||
    rawUrl.includes("sslmode=require");

  const match = rawUrl.match(
    /^(?:postgres(?:ql)?:\/\/)(?:([^:@]+)(?::([^@]*))?@)?([^:\/?#]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?(.*))?$/
  );

  if (!match) {
    return {
      type: "postgres" as const,
      url: rawUrl,
      ssl: isCloud ? { rejectUnauthorized: false } : undefined,
    };
  }

  const [, rawUser, rawPassword, host, portStr, database] = match;
  let password = rawPassword;
  if (password) {
    if (password.startsWith("[") && password.endsWith("]")) {
      password = password.slice(1, -1);
    }
    try {
      password = decodeURIComponent(password);
    } catch {
      try {
        password = decodeURIComponent(password.replace(/%(?![0-9a-fA-F]{2})/g, "%25"));
      } catch {
        // fallback to raw password
      }
    }
  }

  return {
    type: "postgres" as const,
    host,
    port: portStr ? parseInt(portStr, 10) : 5432,
    username: rawUser ? decodeURIComponent(rawUser) : undefined,
    password,
    database: database || "postgres",
    ssl: isCloud ? { rejectUnauthorized: false } : undefined,
  };
}

const dbOptions = parseDbConnection(env.databaseUrl);

/**
 * AppDataSource
 * The single, unified TypeORM DataSource and connection pool for Gathr.
 */
export const AppDataSource = new DataSource({
  ...dbOptions,
  poolSize: env.dbPoolSize,
  synchronize: false,
  logging: false,
  entities: [UserEntity, EventEntity, RegistrationEntity],
});
