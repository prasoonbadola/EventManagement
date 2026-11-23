import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { isFuture, isPast } from "date-fns";
import { Calendar, Download, List, Ticket } from "lucide-react";
import { ApiError } from "../../shared/api/http";
import { useConfirm } from "../../shared/components/ConfirmProvider";
import { DataTable } from "../../shared/components/DataTable";
import { Empty, ErrorState, Loading } from "../../shared/components/States";
import { useToast } from "../../shared/components/Toast";
import { useFetch } from "../../shared/hooks/useFetch";
import { downloadIcs } from "../../shared/lib/calendar";
import { fmtTableDateTime } from "../../shared/lib/format";
import { AddToCalendarMenu } from "./AddToCalendarMenu";
import { RegistrationCalendar } from "./RegistrationCalendar";
import { RegistrationDetailModal } from "./RegistrationDetailModal";
import { cancelRegistration, listMyRegistrations } from "./registrationsApi";
import type { MyRegistration } from "./types";

type View = "list" | "calendar";
type Tab = "upcoming" | "past";

export function MyRegistrationsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [view, setView] = useState<View>("list");
  const [tab, setTab] = useState<Tab>("upcoming");
  const [selected, setSelected] = useState<MyRegistration | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { data, error, loading, reload } = useFetch(() => listMyRegistrations("all"), []);

  const { upcoming, past } = useMemo(() => {
    const regs = data?.registrations ?? [];
    return {
      upcoming: regs.filter((r) => isFuture(new Date(r.event.startsAt))),
      past: regs.filter((r) => isPast(new Date(r.event.startsAt))).reverse(),
    };
  }, [data]);

  const cancel = useCallback(
    async (r: MyRegistration) => {
      setSelected(null);
      const ok = await confirm({
        title: "Cancel registration?",
        message: (
          <>
            <p>
              You'll give up your place at <strong>{r.event.title}</strong>.
            </p>
            <p className="muted">
              Someone else can take it straight away, though you can register again if there's still room.
            </p>
          </>
        ),
        confirmText: "Yes, cancel it",
        cancelText: "Keep my place",
        tone: "danger",
      });
      if (!ok) return;
      setBusyId(r.id);
      try {
        await cancelRegistration(r.id);
        toast("ok", "Registration canceled. Your place was released.");
      } catch (e) {
        toast("err", (e as ApiError).message);
      } finally {
        setBusyId(null);
        reload();
      }
    },
    [confirm, reload, toast]
  );

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<MyRegistration>[]>(
    () => [
      {
        accessorKey: "event.title",
        header: "Event",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              <Link to="/events/$id" params={{ id: String(r.event.id) } as any}>
                <strong>{r.event.title}</strong>
              </Link>
              {r.event.status === "canceled" && r.status === "active" && (
                <div
                  className="note bad"
                  style={{ marginTop: "4px", fontSize: "0.78rem", padding: "2px 8px" }}
                >
                  The organizer canceled this event.
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const r = row.original;
          if (r.status === "canceled") {
            return <span className="badge canceled">Registration Canceled</span>;
          }
          if (r.event.status === "canceled") {
            return <span className="badge canceled">Event Canceled</span>;
          }
          return <span className="badge published">Registered</span>;
        },
      },
      {
        accessorKey: "event.startsAt",
        header: "Date & Time",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <span className="whitespace-nowrap">
              {fmtTableDateTime(r.event.startsAt, r.event.timeZone)}
            </span>
          );
        },
      },
      {
        accessorKey: "event.location",
        header: "Location",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <span className="muted" style={{ fontSize: "0.88rem" }}>
              {r.event.location}
            </span>
          );
        },
      },
      {
        id: "pass",
        header: "Pass",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <button
              type="button"
              className="btn small btn-pass flex items-center gap-1.5"
              onClick={() => setSelected(r)}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>View Pass</span>
            </button>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="table-actions justify-end">
              {r.status === "active" && tab === "upcoming" && r.event.status !== "canceled" && (
                <AddToCalendarMenu event={r.event} align="right" />
              )}
              {r.status === "active" && tab === "upcoming" && (
                <button
                  className="btn small danger"
                  disabled={busyId === r.id}
                  onClick={() => cancel(r)}
                >
                  {busyId === r.id ? "Canceling…" : "Cancel"}
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [busyId, cancel, tab]
  );

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} retry={reload} />;
  const all = data!.registrations;
  const activeUpcoming = upcoming.filter((r) => r.status === "active");
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <>
      <div className="titlerow">
        <h1>My registrations</h1>
        <div className="toolbar">
          {activeUpcoming.length > 0 && (
            <button
              className="btn flex items-center gap-1.5"
              onClick={() =>
                downloadIcs(
                  "my-gathr-events.ics",
                  activeUpcoming.map((r) => r.event)
                )
              }
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export all (.ics)</span>
            </button>
          )}
          <div className="seg" role="tablist" aria-label="View">
            <button
              role="tab"
              aria-selected={view === "list"}
              className={`${view === "list" ? "on" : ""} flex items-center gap-1.5`}
              onClick={() => setView("list")}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              role="tab"
              aria-selected={view === "calendar"}
              className={`${view === "calendar" ? "on" : ""} flex items-center gap-1.5`}
              onClick={() => setView("calendar")}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {all.length === 0 ? (
        <Empty title="You haven't registered for anything yet">
          <Link to="/">Browse upcoming events</Link>
        </Empty>
      ) : view === "calendar" ? (
        <RegistrationCalendar regs={all} onSelect={setSelected} />
      ) : (
        <>
          <div className="tabs mb-4" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "upcoming"}
              className={tab === "upcoming" ? "on" : ""}
              onClick={() => setTab("upcoming")}
            >
              Upcoming <span className="count">{upcoming.length}</span>
            </button>
            <button
              role="tab"
              aria-selected={tab === "past"}
              className={tab === "past" ? "on" : ""}
              onClick={() => setTab("past")}
            >
              Past <span className="count">{past.length}</span>
            </button>
          </div>

          <DataTable
            columns={columns}
            data={list}
            pagination="client"
            initialPageSize={5}
            emptyMessage={
              <div className="py-8 text-center">
                <p className="font-semibold text-[var(--ink)]">
                  {tab === "upcoming"
                    ? "You have no upcoming registrations."
                    : "You have no past event registrations."}
                </p>
                {tab === "upcoming" && (
                  <Link to="/" className="btn small primary mt-3 inline-flex">
                    Find events to attend
                  </Link>
                )}
              </div>
            }
          />
        </>
      )}

      <RegistrationDetailModal
        reg={selected}
        onClose={() => setSelected(null)}
        onCancel={cancel}
      />
    </>
  );
}
