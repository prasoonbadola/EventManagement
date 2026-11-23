import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore } from "../../shared/api/http";
import { AuthContext } from "./context";
import type { User } from "./types";

/**
 * AuthProvider
 * Manages authentication state across the frontend application.
 * - Restores session from localStorage on initial load via GET /api/auth/me.
 * - Handles login, signup, signout, and profile updates.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(() => !tokenStore.get());

  // Restore authenticated session on mount if a token is present
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    api<{ user: User }>("/auth/me")
      .then((res) => setUser(res.user))
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (path: "login" | "signup", body: object) => {
    const res = await api<{ token: string; user: User }>(`/auth/${path}`, {
      method: "POST",
      body,
    });
    tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
