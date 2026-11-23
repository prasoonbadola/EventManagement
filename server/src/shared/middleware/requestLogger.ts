import morgan from "morgan";
import { morganStream } from "../logger.js";

/**
 * HTTP request logger powered by Morgan and routed through Winston.
 * Silenced in test mode to keep test runner output clean.
 */
export const requestLogger = morgan(
  process.env.NODE_ENV === "production" ? "combined" : "dev",
  {
    stream: morganStream,
    skip: () => process.env.NODE_ENV === "test",
  }
);
