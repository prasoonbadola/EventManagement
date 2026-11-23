import { Router } from "express";
import { optionalAuth, requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { validateBody, validateQuery } from "../../shared/middleware/validate.js";
import * as controller from "./events.controller.js";
import {
  attendeesQuerySchema,
  createEventSchema,
  listEventsQuerySchema,
  organizerEventsQuerySchema,
  updateEventSchema,
} from "./events.schemas.js";

export const eventRoutes = Router();

// Middleware stack for organizer-only endpoints
const organizerOnly = [requireAuth, requireRole("organizer")];

// Public event discovery and detail
eventRoutes.get("/events", validateQuery(listEventsQuerySchema), controller.listPublic);
eventRoutes.get("/events/:id", optionalAuth, controller.getForViewer);

// Organizer event lifecycle management
eventRoutes.post("/events", ...organizerOnly, validateBody(createEventSchema), controller.create);
eventRoutes.patch("/events/:id", ...organizerOnly, validateBody(updateEventSchema), controller.update);
eventRoutes.delete("/events/:id", ...organizerOnly, controller.deleteDraft);

// Organizer dashboards and attendee reporting
eventRoutes.get("/organizer/events", ...organizerOnly, validateQuery(organizerEventsQuerySchema), controller.listByOrganizer);
eventRoutes.get("/events/:id/registrations", ...organizerOnly, validateQuery(attendeesQuerySchema), controller.listAttendees);
