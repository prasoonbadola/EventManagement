import type { NextFunction, Request, Response } from "express";
import { rateLimit as expressRateLimit, type RateLimitRequestHandler } from "express-rate-limit";
import { ApiError } from "../errors.js";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  code?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Rate limiter middleware powered by express-rate-limit.
 * Emits standard IETF Draft-6 headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`),
 * handles IPv6/IPv4 clients, and routes rate-limit violations through the global ApiError handler.
 */
export function rateLimit(options: RateLimitOptions): RateLimitRequestHandler {
  const {
    windowMs,
    max,
    message = "Too many requests, please try again later.",
    code = "TOO_MANY_REQUESTS",
    keyGenerator,
  } = options;

  return expressRateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-6",
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: () => process.env.NODE_ENV === "test",
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (_req: Request, _res: Response, next: NextFunction) => {
      next(new ApiError(429, code, message));
    },
  });
}

/** Stricter rate limits for login and signup (15 attempts per 15 minutes) */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
  code: "AUTH_RATE_LIMIT",
});

/** Event registration rate limit to prevent bot hoarding (30 registrations per 5 minutes) */
export const registrationRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: "Too many registration requests. Please wait a few moments and try again.",
  code: "REGISTRATION_RATE_LIMIT",
});
