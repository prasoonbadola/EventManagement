import type { NextFunction, Request, Response } from "express";

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Prevent clickjacking by forbidding embedding in iframes
  res.setHeader("X-Frame-Options", "DENY");
  // Cross-site scripting filter protection for legacy browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Disable unnecessary browser features
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}
