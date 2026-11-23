import type { Request, Response } from "express";
import { parseId } from "../../shared/parseId.js";
import * as service from "./events.service.js";

export async function listPublic(req: Request, res: Response) {
  const result = await service.listPublic(req.query);
  res.json(result);
}

export async function getForViewer(req: Request, res: Response) {
  const eventId = parseId(req.params.id, "Event");
  const event = await service.getForViewer(eventId, req.user);
  res.json({ event });
}

export async function create(req: Request, res: Response) {
  const event = await service.createEvent(req.user!, req.body);
  res.status(201).json({ event });
}

export async function update(req: Request, res: Response) {
  const eventId = parseId(req.params.id, "Event");
  const event = await service.updateEvent(req.user!, eventId, req.body);
  res.json({ event });
}

export async function deleteDraft(req: Request, res: Response) {
  const eventId = parseId(req.params.id, "Event");
  const result = await service.deleteEvent(req.user!, eventId);
  res.json(result);
}

export async function listByOrganizer(req: Request, res: Response) {
  const result = await service.listByOrganizer(req.user!.id, req.query);
  res.json(result);
}

export async function listAttendees(req: Request, res: Response) {
  const eventId = parseId(req.params.id, "Event");
  const result = await service.listAttendees(req.user!, eventId, req.query);
  res.json(result);
}
