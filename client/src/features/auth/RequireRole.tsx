import type { ReactNode } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { Empty, Loading } from "../../shared/components/States";
import { useAuth } from "./useAuth";
import type { User } from "./types";

/** UI convenience only — the API enforces roles and ownership independently. */
export function RequireRole({ role, children }: { role: User["role"]; children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return (
      <Empty title={`${role === "organizer" ? "Organizer" : "Attendee"} Access Only`}>
        <p>
          You are currently signed in as <strong>{user.name}</strong> ({user.role}).
        </p>
        <p className="muted">
          {role === "organizer"
            ? "This dashboard is for event organizers. If you are an attendee, check your registrations or switch to an organizer account."
            : "This page is for attendees."}
        </p>
        <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "center" }}>
          {user.role === "attendee" && (
            <Link to="/me" className="btn small">
              View My Registrations
            </Link>
          )}
          {user.role === "organizer" && (
            <Link to="/organizer" className="btn small">
              Go to My Events
            </Link>
          )}
          <Link to="/login" className="btn small primary">
            Switch Account
          </Link>
        </div>
      </Empty>
    );
  }
  return <>{children}</>;
}
