import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppDataSource } from "../../db/data-source.js";
import { UserEntity } from "../../entities/User.js";
import type { AuthTokenPayload, AuthUser, Role } from "../../modules/auth/auth.types.js";
import { ApiError, ErrorCode, forbidden } from "../errors.js";

export type { AuthUser, Role };
declare module "express-serve-static-core" {
  interface Request { user?: AuthUser }
}

export const signToken = (userId: number) => jwt.sign({ uid: userId } satisfies AuthTokenPayload, env.jwtSecret, { expiresIn: "7d" });

async function loadUser(req: Request): Promise<AuthUser | undefined> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as unknown as { uid: number };
    // Always re-read from the DB so the role is never trusted from the token.
    // Restrict column selection to avoid querying password hash on every request.
    const userRepo = AppDataSource.getRepository(UserEntity);
    const u = await userRepo.findOne({
      where: { id: payload.uid },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!u) return undefined;
    return { id: u.id, name: u.name, email: u.email, role: u.role as Role };
  } catch {
    return undefined;
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = await loadUser(req);
  next();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = await loadUser(req);
  if (!req.user) throw new ApiError(401, ErrorCode.UNAUTHENTICATED, "Please sign in to continue.");
  next();
}

export const requireRole = (role: Role) => (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== role) throw forbidden(`Only ${role}s can do that.`);
  next();
};
