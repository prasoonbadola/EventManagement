import type { Request, Response } from "express";
import { parseId } from "../../shared/parseId.js";
import * as service from "./registrations.service.js";

export async function register(req: Request, res: Response) {
  const eventId = parseId(req.params.id, "Event");
  const registration = await service.register(req.user!.id, eventId);
  res.status(201).json({ registration });
}

export async function cancel(req: Request, res: Response) {
  const registrationId = parseId(req.params.id, "Registration");
  const registration = await service.cancel(req.user!.id, registrationId);
  res.json({ registration });
}

export async function listMine(req: Request, res: Response) {
  const scope = req.query.scope === "all" ? "all" : "upcoming";
  const registrations = await service.listMine(req.user!.id, scope);
  res.json({ registrations });
}
