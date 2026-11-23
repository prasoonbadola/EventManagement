import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

export type ValidationSource = "body" | "query" | "params";

/**
 * Validates request data (body, query, or params) against a Zod schema.
 * Replaces the raw property with the sanitized, coerced, and validated data.
 * Throws ZodError on failure, which is caught by global errorHandler.
 */
export function validate<T>(schema: ZodType<T>, source: ValidationSource = "body"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      try {
        (req as unknown as Record<string, unknown>)[source] = parsed;
      } catch {
        // Express 5 defines req.query as a getter; override via defineProperty
        Object.defineProperty(req, source, {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const validateBody = <T>(schema: ZodType<T>) => validate(schema, "body");
export const validateQuery = <T>(schema: ZodType<T>) => validate(schema, "query");
export const validateParams = <T>(schema: ZodType<T>) => validate(schema, "params");
