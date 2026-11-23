import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Edit3, Share2, Users } from "lucide-react";
import { ApiError } from "../../shared/api/http";
import { StatusBadge } from "../../shared/components/Badges";
import { useConfirm } from "../../shared/components/ConfirmProvider";
import { Empty, ErrorState, Loading } from "../../shared/components/States";
import { useToast } from "../../shared/components/Toast";
import { useFetch } from "../../shared/hooks/useFetch";
import { fmtEventTime, fmtMine, sameZoneAsViewer } from "../../shared/lib/format";
import { useAuth } from "../auth/useAuth";
import type { User } from "../auth/types";
import { RegistrationSuccessModal } from "../registrations/RegistrationSuccessModal";
import { cancelRegistration, registerForEvent } from "../registrations/registrationsApi";
import { getEvent } from "./eventsApi";
import type { Event } from "./types";

interface ActionPanelProps {
  event: Event;
  user: User | null;
  busy: boolean;
  onRegister: () => void;
  onCancel: () => void;
}

/**
 * Renders the context-aware registration CTA button or informational badge.
 */
function EventActionPanel({ event, user, busy, onRegister, onCancel }: ActionPanelProps) {
  if (event.status === "canceled") {
    return <p className="note bad">This event has been canceled.</p>;
  }

  if (event.status === "draft") {
    return (
      <p className="note">
        Draft — only you can see this. Publish it from the organizer dashboard to open registration.
      </p>
    );
  }

  if (event.myRegistration) {
    return (
      <div>
        <p className="note good flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[var(--good)] flex-shrink-0" />
          <span>You're registered for this event.</span>
        </p>
        <button className="btn" disabled={busy} onClick={onCancel}>
          {busy ? "Working…" : "Cancel my registration"}
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        className="btn primary"
        to="/login"
        search={{ from: `/events/${event.id}` } as any}
      >
        Sign in to register
      </Link>
    );
  }

  if (user.role === "organizer") {
    return (
      <p className="note">
        Organizer accounts cannot register for events. Please use an attendee account.
      </p>
    );
  }

  if (event.hasStarted) {
    return <p className="note bad">This event has already started.</p>;
  }

  if (event.placesRemaining === 0) {
    return <p className="note bad">Sorry, this event is full.</p>;
  }

  return (
    <button className="btn primary big" disabled={busy} onClick={onRegister}>
      {busy ? "Registering…" : "Register"}
    </button>
  );
}

export function EventDetailPage() {
  const { id } = useParams({ strict: false });
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data, error, loading, reload } = useFetch(
    () => getEvent(id!),
    [id, user?.id]
  );

  if (loading && !data) return <Loading />;
  if (error) {
    return error.status === 404 ? (
      <Empty title="Event not found">
        It may have been removed or is not yet published.
      </Empty>
    ) : (
      <ErrorState error={error} retry={reload} />
    );
  }

  const e = data!.event;

  async function handleRegister() {
    setBusy(true);
    try {
      await registerForEvent(e.id);
      setSuccess(true);
    } catch (err) {
      toast("err", (err as ApiError).message);
    } finally {
      setBusy(false);
      reload(); // Reload so attendee counts reflect reality immediately
    }
  }

  async function handleCancel() {
    const confirmed = await confirm({
      title: "Cancel your registration?",
      message: (
        <p>
          You'll give up your place at <strong>{e.title}</strong>.
        </p>
      ),
      confirmText: "Yes, cancel it",
      cancelText: "Keep my place",
      tone: "danger",
    });

    if (!confirmed) return;

    setBusy(true);
    try {
      await cancelRegistration(e.myRegistration!.id);
      toast("ok", "Registration canceled. Your place was released.");
    } catch (err) {
      toast("err", (err as ApiError).message);
    } finally {
      setBusy(false);
      reload();
    }
  }

  async function handleShare() {
    const shareUrl = `${window.location.origin}/events/${e.id}`;

    // On mobile devices, trigger the native OS share sheet (without text to avoid URL concatenation)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: e.title,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    // On desktop, directly copy the clean URL to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("ok", "Event link copied to clipboard!");
    } catch {
      toast("err", "Could not copy link to clipboard.");
    }
  }

  return (
    <article className="detail">
      <Link to="/" className="back flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" />
        <span>All events</span>
      </Link>

      <div className="titlerow">
        <h1>{e.title}</h1>
        {e.status !== "published" && <StatusBadge status={e.status} />}
      </div>

      <p className="muted">Hosted by {e.organizer.name}</p>

      <dl className="facts">
        <div>
          <dt>When</dt>
          <dd>
            {fmtEventTime(e.startsAt, e.timeZone)}
            {!sameZoneAsViewer(e.timeZone) && (
              <small>Your time: {fmtMine(e.startsAt)}</small>
            )}
          </dd>
        </div>
        <div>
          <dt>Where</dt>
          <dd>{e.location}</dd>
        </div>
        <div>
          <dt>Capacity</dt>
          <dd>
            {e.capacity}{" "}
            <small>
              {e.status === "canceled" ? "" : `· ${e.placesRemaining} remaining`}
            </small>
          </dd>
        </div>
      </dl>

      {e.description && <p className="desc">{e.description}</p>}

      <div className="actions">
        <EventActionPanel
          event={e}
          user={user}
          busy={busy}
          onRegister={handleRegister}
          onCancel={handleCancel}
        />
      </div>

      <p className="ownerbar flex items-center gap-2 flex-wrap">
        <button className="link inline-flex items-center gap-1.5" onClick={handleShare}>
          <Share2 className="w-3.5 h-3.5" />
          <span>Share event</span>
        </button>
        {e.isOwner && (
          <>
            <span className="opacity-50">·</span>
            <Link
              to="/organizer/events/$id/edit"
              params={{ id: String(e.id) } as any}
              className="inline-flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit event</span>
            </Link>
            <span className="opacity-50">·</span>
            <Link
              to="/organizer/events/$id/attendees"
              params={{ id: String(e.id) } as any}
              className="inline-flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View attendees</span>
            </Link>
          </>
        )}
      </p>

      <RegistrationSuccessModal
        open={success}
        onClose={() => setSuccess(false)}
        event={e}
      />
    </article>
  );
}
