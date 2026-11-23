import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
} from "@tanstack/react-router";
import { Navbar } from "../shared/components/Navbar";
import { Empty } from "../shared/components/States";
import { EventsPage } from "../features/events/EventsPage";
import { EventDetailPage } from "../features/events/EventDetailPage";
import { EventFormPage } from "../features/events/EventFormPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RequireRole } from "../features/auth/RequireRole";
import { MyRegistrationsPage } from "../features/registrations/MyRegistrationsPage";
import { OrganizerPage } from "../features/organizer/OrganizerPage";
import { AttendeesPage } from "../features/organizer/AttendeesPage";

// Root layout with persistent Navbar and main container
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  ),
  notFoundComponent: () => (
    <Empty title="Page not found">
      <Link to="/" className="btn small">
        Back to events
      </Link>
    </Empty>
  ),
});

// Route Definitions
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: EventsPage,
});

const eventDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events/$id",
  component: EventDetailPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { from?: string } => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
});

const meRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/me",
  component: () => (
    <RequireRole role="attendee">
      <MyRegistrationsPage />
    </RequireRole>
  ),
});

const organizerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizer",
  component: () => (
    <RequireRole role="organizer">
      <OrganizerPage />
    </RequireRole>
  ),
});

const newEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizer/events/new",
  component: () => (
    <RequireRole role="organizer">
      <EventFormPage />
    </RequireRole>
  ),
});

const editEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizer/events/$id/edit",
  component: () => (
    <RequireRole role="organizer">
      <EventFormPage />
    </RequireRole>
  ),
});

const attendeesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizer/events/$id/attendees",
  component: () => (
    <RequireRole role="organizer">
      <AttendeesPage />
    </RequireRole>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  eventDetailRoute,
  loginRoute,
  meRoute,
  organizerRoute,
  newEventRoute,
  editEventRoute,
  attendeesRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
