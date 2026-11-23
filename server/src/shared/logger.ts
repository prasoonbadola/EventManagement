import winston from "winston";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

// Custom human-friendly console formatter for development
const devLogFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaKeys = Object.keys(meta);
  const metaString = metaKeys.length ? ` ${JSON.stringify(meta)}` : "";
  const errorMessage = stack ? `\n${stack}` : "";
  return `[${timestamp}] ${level}: ${message}${metaString}${errorMessage}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  silent: isTest,
  format: isProd
    ? combine(
        timestamp(),
        errors({ stack: true }),
        json()
      )
    : combine(
        colorize({ all: true }),
        timestamp({ format: "HH:mm:ss" }),
        errors({ stack: true }),
        devLogFormat
      ),
  transports: [
    new winston.transports.Console(),
  ],
});

/** Stream adapter so Morgan HTTP request logs pipe through Winston at HTTP level */
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
