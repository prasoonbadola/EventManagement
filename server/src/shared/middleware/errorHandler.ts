import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../errors.js";
import { logger } from "../logger.js";

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) =>
  next(new ApiError(404, "NOT_FOUND", "Route not found."));

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const i of err.issues) (details[i.path.join(".") || "_"] ??= []).push(i.message);
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Please fix the highlighted fields.", details } });
  }
  if (err instanceof SyntaxError) return res.status(400).json({ error: { code: "BAD_JSON", message: "Malformed JSON body." } });
  if (err instanceof ApiError) return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });

  logger.error("Unhandled server error:", err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong on our side." } });
}
