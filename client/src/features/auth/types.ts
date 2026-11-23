export type Role = "organizer" | "attendee";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateProfileInput {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}
