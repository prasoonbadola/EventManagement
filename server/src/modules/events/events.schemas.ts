import { z } from "zod";

const isValidZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const fields = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).default(""),
  // Wall-clock time in the event's own zone, e.g. "2026-12-01T18:30"
  startLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Use format YYYY-MM-DDTHH:mm"),
  timeZone: z.string().refine(isValidZone, "Unknown IANA time zone"),
  location: z.string().trim().min(1, "Location is required").max(300),
  capacity: z
    .number({ error: "Capacity must be a number" })
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(100000),
  status: z.enum(["draft", "published", "canceled"]),
});

export const createEventSchema = fields.extend({ status: fields.shape.status.default("draft") });
export const updateEventSchema = fields.partial();

/**
 * Validates and coerces incoming URL query parameters for GET /api/events.
 * Provides safe defaults for search, flags, and pagination.
 */
export const listEventsQuerySchema = z.object({
  q: z.string().trim().default(""),
  onlyOpen: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true" || val === "1")
    .default(false),
  days: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const organizerEventsQuerySchema = z.object({
  q: z.string().trim().default(""),
  status: z.enum(["all", "published", "draft", "canceled"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
});

export const attendeesQuerySchema = z.object({
  q: z.string().trim().default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQueryInput = z.infer<typeof listEventsQuerySchema>;
export type OrganizerEventsQueryInput = z.infer<typeof organizerEventsQuerySchema>;
export type AttendeesQueryInput = z.infer<typeof attendeesQuerySchema>;
