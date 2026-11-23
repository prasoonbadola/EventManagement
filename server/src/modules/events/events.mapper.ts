import { DateTime } from "luxon";
import type { EventEntity } from "../../entities/Event.js";
import type { EventDto } from "./events.types.js";

export const LOCAL_FMT = "yyyy-MM-dd'T'HH:mm";

/**
 * Map a TypeORM EventEntity (with joined organizer + activeCount virtual) to the API shape.
 * Also works with raw objects that have the same keys.
 */
export function mapEvent(
  ev: EventEntity & { organizerName?: string; activeCount?: number; organizer_name?: string; active_count?: number }
): EventDto {
  const startsAt = ev.startsAt instanceof Date ? ev.startsAt : new Date(ev.startsAt);
  const tz = ev.timeZone;
  const activeCount =
    ev.activeCount ?? ev.active_count ?? 0;
  const organizerName =
    ev.organizerName ?? ev.organizer_name ?? ev.organizer?.name ?? "Unknown";
  const organizerId = ev.organizerId ?? ev.organizer?.id ?? 0;
  const started = startsAt.getTime() <= Date.now();
  const remaining = Math.max(ev.capacity - activeCount, 0);
  return {
    id: ev.id,
    title: ev.title,
    description: ev.description,
    startsAt: startsAt.toISOString(),
    startLocal: DateTime.fromJSDate(startsAt).setZone(tz).toFormat(LOCAL_FMT),
    timeZone: tz,
    location: ev.location,
    capacity: ev.capacity,
    status: ev.status as "draft" | "published" | "canceled",
    organizer: { id: organizerId, name: organizerName },
    activeRegistrations: activeCount,
    placesRemaining: remaining,
    hasStarted: started,
    isRegistrationOpen: ev.status === "published" && !started && remaining > 0,
  };
}
