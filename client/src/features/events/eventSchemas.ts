import { z } from "zod";

export const eventFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters"),
  startLocal: z.string().min(1, "Start date and time is required"),
  timeZone: z.string().min(1, "Time zone is required"),
  location: z
    .string()
    .trim()
    .min(2, "Venue / location must be at least 2 characters")
    .max(200, "Location cannot exceed 200 characters"),
  capacity: z
    .number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(100000, "Capacity cannot exceed 100,000"),
  status: z.enum(["draft", "published", "canceled"]),
});

export type EventFormData = z.infer<typeof eventFormSchema>;
