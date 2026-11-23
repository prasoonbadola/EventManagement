import { createContext } from "react";
import type { User } from "./types";

export interface AuthCtx {
  user: User | null;
  ready: boolean;
  signIn: (path: "login" | "signup", body: object) => Promise<User>;
  signOut: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthCtx | null>(null);
