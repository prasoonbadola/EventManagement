/**
 * Standard business error codes used across the Gathr API.
 * Eliminates magic string typos and provides a single reference point.
 */
export const ErrorCode = {
  // Authentication & Authorization
  UNAUTHENTICATED: "UNAUTHENTICATED",
  BAD_CREDENTIALS: "BAD_CREDENTIALS",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  FORBIDDEN: "FORBIDDEN",

  // Resource status
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_JSON: "BAD_JSON",

  // Domain & Business Rules
  EVENT_FULL: "EVENT_FULL",
  EVENT_CANCELED: "EVENT_CANCELED",
  EVENT_STARTED: "EVENT_STARTED",
  ALREADY_REGISTERED: "ALREADY_REGISTERED",
  ALREADY_CANCELED: "ALREADY_CANCELED",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  CAPACITY_BELOW_REGISTRATIONS: "CAPACITY_BELOW_REGISTRATIONS",

  // Rate Limiting & System
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  AUTH_RATE_LIMIT: "AUTH_RATE_LIMIT",
  REGISTRATION_RATE_LIMIT: "REGISTRATION_RATE_LIMIT",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCodeType | string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound = (what = "Resource") =>
  new ApiError(404, ErrorCode.NOT_FOUND, `${what} not found.`);

export const forbidden = (msg = "You are not allowed to do that.") =>
  new ApiError(403, ErrorCode.FORBIDDEN, msg);
