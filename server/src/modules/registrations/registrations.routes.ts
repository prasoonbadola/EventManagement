import { Router } from "express";
import { requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { registrationRateLimiter } from "../../shared/middleware/rateLimit.js";
import * as controller from "./registrations.controller.js";

export const registrationRoutes = Router();

const attendeeOnly = [requireAuth, requireRole("attendee")];

registrationRoutes.post(
  "/events/:id/registrations",
  registrationRateLimiter,
  ...attendeeOnly,
  controller.register
);

registrationRoutes.delete("/registrations/:id", ...attendeeOnly, controller.cancel);

registrationRoutes.get("/me/registrations", ...attendeeOnly, controller.listMine);
