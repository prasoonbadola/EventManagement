import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.js";
import { authRateLimiter } from "../../shared/middleware/rateLimit.js";
import { validateBody } from "../../shared/middleware/validate.js";
import * as controller from "./auth.controller.js";
import { loginSchema, signupSchema, updateProfileSchema } from "./auth.schemas.js";

export const authRoutes = Router();

authRoutes.post("/auth/signup", authRateLimiter, validateBody(signupSchema), controller.signup);
authRoutes.post("/auth/login", authRateLimiter, validateBody(loginSchema), controller.login);
authRoutes.get("/auth/me", requireAuth, controller.getMe);
authRoutes.patch("/auth/profile", requireAuth, validateBody(updateProfileSchema), controller.updateProfile);
