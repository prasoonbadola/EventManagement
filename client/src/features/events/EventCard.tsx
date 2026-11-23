import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PlacesPill } from "../../shared/components/Badges";
import { fmtDay } from "../../shared/lib/format";
import type { Event } from "./types";

export function EventCard({ e }: { e: Event }) {
  const d = fmtDay(e.startsAt, e.timeZone);

  return (
    <Link
      to="/events/$id"
      params={{ id: String(e.id) } as any}
      className="ticket"
      title={`View details for ${e.title}`}
    >
      <div className="stub">
        <span className="mon">{d.mon}</span>
        <span className="day">{d.day}</span>
        <span className="tm">{d.time}</span>
      </div>
      <div className="body">
        <h3 className="card-title">{e.title}</h3>
        <p className="card-location flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[var(--accent)]" />
          <span>{e.location}</span>
        </p>
        <p className={`card-desc ${!e.description?.trim() ? "empty" : ""}`}>
          {e.description?.trim() || "No event description provided."}
        </p>
        <div className="card-footer">
          <PlacesPill remaining={e.placesRemaining} capacity={e.capacity} />
          {e.organizer?.name ? (
            <span className="card-host">by {e.organizer.name}</span>
          ) : (
            <span className="card-host" style={{ visibility: "hidden" }}>by Host</span>
          )}
        </div>
      </div>
    </Link>
  );
}
