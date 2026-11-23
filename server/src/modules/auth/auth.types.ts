export type Role = "organizer" | "attendee";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthTokenPayload {
  uid: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface UserProfileResponse {
  user: AuthUser;
}

export type { LoginInput, SignupInput, UpdateProfileInput } from "./auth.schemas.js";
