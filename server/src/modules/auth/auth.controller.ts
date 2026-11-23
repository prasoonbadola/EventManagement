import type { Request, Response } from "express";
import * as service from "./auth.service.js";

export async function signup(req: Request, res: Response) {
  const result = await service.signup(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await service.login(req.body);
  res.json(result);
}

export function getMe(req: Request, res: Response) {
  res.json({ user: req.user });
}

export async function updateProfile(req: Request, res: Response) {
  const result = await service.updateProfile(req.user!.id, req.body);
  res.json(result);
}
