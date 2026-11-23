import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
export const signupSchema = loginSchema.extend({
  name: z.string().trim().min(1, "Name is required").max(100),
  role: z.enum(["organizer", "attendee"]),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  currentPassword: z.string().min(1, "Current password is required").optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200).optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) return false;
  return true;
}, {
  message: "Current password is required to change password",
  path: ["currentPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
