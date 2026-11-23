import { useMemo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import Barcode from "react-barcode";
import { isFuture } from "date-fns";
import { Printer, Ticket } from "lucide-react";
import { fmtEventTime, fmtMine } from "../../shared/lib/format";
import { AddToCalendarMenu } from "./AddToCalendarMenu";
import type { VirtualTicketProps } from "./types";

/**
 * Visual Virtual Ticket / Pass component.
 * Renders an authentic boarding pass / admission ticket with perforation and barcode.
 * Supports native printing via window.print().
 */
export function VirtualTicket({
  event,
  attendee,
  registrationId,
  registeredAt,
  status = "active",
  showActions = true,
  onCancel,
  onClose,
}: VirtualTicketProps) {
  const loc = useLocation();
  const isOnEventPage = loc.pathname === `/events/${event.id}`;

  // Generate ticket reference number: e.g. #GTR-005-0142
  const ticketRef = useMemo(() => {
    const evNum = String(event.id).padStart(3, "0");
    const regNum = String(registrationId ?? 1).padStart(4, "0");
    return `GTR-${evNum}-${regNum}`;
  }, [event.id, registrationId]);

  const isUpcoming = isFuture(new Date(event.startsAt));
  const isCanceled = status === "canceled";

  return (
    <div className={`virtual-ticket ${isCanceled ? "canceled" : ""}`}>
      {/* Top Header */}
      <div className="ticket-header">
        <div className="ticket-brand flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-[var(--accent)]" />
          <span className="brand-title">GATHR ADMISSION PASS</span>
        </div>
        <div className="ticket-status">
          {isCanceled ? (
            <span className="badge canceled">CANCELED</span>
          ) : (
            <span className="badge published">CONFIRMED</span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="ticket-main">
        <div className="ticket-event-info">
          <span className="ticket-ref">REF #{ticketRef}</span>
          <h2 className="ticket-title">{event.title}</h2>
          <div className="ticket-details-grid">
            <div>
              <span className="detail-label">DATE & TIME</span>
              <span className="detail-value">{fmtEventTime(event.startsAt, event.timeZone)}</span>
            </div>
            <div>
              <span className="detail-label">VENUE / LOCATION</span>
              <span className="detail-value">{event.location}</span>
            </div>
          </div>
        </div>

        {/* Attendee Info Card */}
        <div className="ticket-attendee-card">
          <div className="attendee-avatar">{attendee.name.charAt(0).toUpperCase()}</div>
          <div className="attendee-meta">
            <span className="detail-label">REGISTERED ATTENDEE</span>
            <span className="attendee-name">{attendee.name}</span>
            <span className="attendee-email">{attendee.email}</span>
          </div>
        </div>
      </div>

      {/* Perforated Divider with cut notches */}
      <div className="ticket-perforation">
        <div className="perforation-notch left" />
        <div className="perforation-line" />
        <div className="perforation-notch right" />
      </div>

      {/* Ticket Stub / Barcode Footer */}
      <div className="ticket-stub">
        <div className="barcode-wrap" title={`Barcode: ${ticketRef}`}>
          <div style={{ opacity: isCanceled ? 0.35 : 0.9 }}>
            <Barcode
              value={ticketRef}
              format="CODE128"
              renderer="svg"
              width={1.5}
              height={36}
              margin={0}
              displayValue={false}
              background="transparent"
              lineColor="currentColor"
            />
          </div>
          <span className="barcode-text">{ticketRef}</span>
        </div>

        <div className="ticket-timestamp">
          {registeredAt && <span>ISSUED: {fmtMine(registeredAt)}</span>}
          <span>ENTRY PERMITTED ONLY WITH VALID ID</span>
        </div>
      </div>

      {/* Action Toolbar */}
      {showActions && (
        <div className="ticket-toolbar no-print">
          <div className="ticket-actions-left">
            <button
              type="button"
              className="btn small btn-pass flex items-center gap-1.5"
              onClick={() => window.print()}
              title="Print or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            {!isCanceled && isUpcoming && (
              <AddToCalendarMenu event={event} align="left" direction="up" />
            )}
            {isOnEventPage ? (
              <button
                type="button"
                className="btn small btn-pass"
                onClick={() => onClose?.()}
                title="Close ticket and view event details"
              >
                Event Details
              </button>
            ) : (
              <Link
                to="/events/$id"
                params={{ id: String(event.id) } as any}
                className="btn small btn-pass"
                onClick={() => onClose?.()}
              >
                Event Details
              </Link>
            )}
          </div>
          {!isCanceled && isUpcoming && onCancel && (
            <div className="ticket-actions-right">
              <button
                type="button"
                className="btn danger small btn-pass"
                onClick={onCancel}
              >
                Cancel Registration
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
