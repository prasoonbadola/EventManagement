import { useCallback, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, MapPin, Plus, Users } from "lucide-react";
import { ApiError } from "../../shared/api/http";
import { CapacityBar, StatusBadge } from "../../shared/components/Badges";
import { useConfirm } from "../../shared/components/ConfirmProvider";
import { DataTable } from "../../shared/components/DataTable";
import { Empty, ErrorState, Loading } from "../../shared/components/States";
import { useToast } from "../../shared/components/Toast";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { useFetch } from "../../shared/hooks/useFetch";
import { downloadCsv } from "../../shared/lib/csv";
import { addDaysToLocalIso, fmtTableDateTime } from "../../shared/lib/format";
import { createEvent, deleteEvent, listOrganizerEvents, updateEvent } from "../events/eventsApi";
import type { Event } from "../events/types";
import { OrganizerActionMenu } from "./OrganizerActionMenu";
import type { StatusTab } from "./types";

export function OrganizerPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [exporting, setExporting] = useState(false);

  const debouncedSearch = useDebounce(search.trim(), 300);

  // Fetch paginated events from backend
  const { data, error, loading, reload } = useFetch(
    () =>
      listOrganizerEvents({
        page,
        limit: pageSize,
        status: tab,
        q: debouncedSearch,
      }),
    [page, pageSize, tab, debouncedSearch]
  );

  const stats = data?.stats ?? {
    total: 0,
    live: 0,
    drafts: 0,
    canceled: 0,
    used: 0,
    fill: 0,
  };

  const handleTabChange = (newTab: StatusTab) => {
    setTab(newTab);
    setPage(1);
  };

  const setStatus = useCallback(
    async (e: Event, status: "published" | "canceled") => {
      const ok = await confirm(
        status === "published"
          ? {
              title: "Publish this event?",
              message: (
                <p>
                  <strong>{e.title}</strong> will be visible to everyone and open for registration.
                </p>
              ),
              confirmText: "Publish",
              cancelText: "Not yet",
            }
          : {
              title: "Cancel this event?",
              message: (
                <>
                  <p>
                    <strong>{e.title}</strong> will show as canceled and registration will close.
                  </p>
                  <p className="muted">This cannot be undone.</p>
                </>
              ),
              confirmText: "Cancel event",
              cancelText: "Keep event",
              tone: "danger",
            }
      );
      if (!ok) return;

      try {
        await updateEvent(e.id, { status });
        toast("ok", status === "published" ? "Event published." : "Event canceled.");
      } catch (err) {
        toast("err", (err as ApiError).message);
      }
      reload();
    },
    [confirm, reload, toast]
  );

  const handleDuplicate = useCallback(
    async (e: Event) => {
      const ok = await confirm({
        title: "Duplicate this event?",
        message: (
          <p>
            Create a copy of <strong>{e.title}</strong> as a new draft scheduled for 1 week later?
          </p>
        ),
        confirmText: "Duplicate as Draft",
        cancelText: "Cancel",
      });
      if (!ok) return;

      try {
        const nextDate = addDaysToLocalIso(e.startLocal, 7);

        await createEvent({
          title: `${e.title} (Copy)`,
          description: e.description,
          startLocal: nextDate,
          timeZone: e.timeZone,
          location: e.location,
          capacity: e.capacity,
          status: "draft",
        });

        toast("ok", "Duplicated as new draft.");
        reload();
      } catch (err) {
        toast("err", (err as ApiError).message);
      }
    },
    [confirm, reload, toast]
  );

  const handleDeleteDraft = useCallback(
    async (e: Event) => {
      const ok = await confirm({
        title: "Delete this draft?",
        message: (
          <p>
            Are you sure you want to permanently delete draft <strong>{e.title}</strong>? This cannot
            be undone.
          </p>
        ),
        confirmText: "Delete Draft",
        cancelText: "Keep it",
        tone: "danger",
      });
      if (!ok) return;

      try {
        await deleteEvent(e.id);
        toast("ok", "Draft deleted.");
        reload();
      } catch (err) {
        toast("err", (err as ApiError).message);
      }
    },
    [confirm, reload, toast]
  );

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<Event>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Event",
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div>
              <Link
                to="/events/$id"
                params={{ id: String(e.id) } as any}
                className="font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
              >
                {e.title}
              </Link>
              <div className="text-xs text-[var(--muted)] mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[var(--muted)]" />
                <span>{e.location}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "startsAt",
        header: "Date & Time",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs sm:text-sm">
            {fmtTableDateTime(row.original.startsAt, row.original.timeZone)}
          </span>
        ),
      },
      {
        id: "capacity",
        header: "Capacity / Fill",
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="min-w-[130px] max-w-[180px]">
              <div className="flex justify-between text-xs mb-1">
                <span>
                  <strong>{e.activeRegistrations}</strong> / {e.capacity}
                </span>
                <span className="text-[var(--muted)]">{e.placesRemaining} left</span>
              </div>
              <CapacityBar used={e.activeRegistrations} capacity={e.capacity} />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="table-actions justify-end">
              <Link
                className="btn small flex items-center gap-1.5"
                to="/organizer/events/$id/attendees"
                params={{ id: String(e.id) } as any}
                title="View registered attendees"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Attendees ({e.activeRegistrations})</span>
              </Link>
              <OrganizerActionMenu
                event={e}
                onDuplicate={handleDuplicate}
                onPublish={(ev) => setStatus(ev, "published")}
                onCancel={(ev) => setStatus(ev, "canceled")}
                onDelete={handleDeleteDraft}
              />
            </div>
          );
        },
      },
    ],
    [handleDeleteDraft, handleDuplicate, setStatus]
  );

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} retry={reload} />;

  const events = data?.events ?? [];
  const pagination = data?.pagination;

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const all = await listOrganizerEvents({ page: 1, limit: 1000, status: tab });
      downloadCsv(`my-events-${tab}.csv`, [
        ["Title", "Date & Time", "Time Zone", "Location", "Capacity", "Active Registrations", "Status"],
        ...all.events.map((ev) => [
          ev.title,
          ev.startsAt,
          ev.timeZone,
          ev.location,
          ev.capacity,
          ev.activeRegistrations,
          ev.status,
        ]),
      ]);
      toast("ok", "Events exported to CSV successfully.");
    } catch (err) {
      toast("err", (err as Error)?.message ?? "Failed to export events.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="titlerow">
        <h1>My events</h1>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <button
              type="button"
              className="btn flex items-center gap-1.5"
              onClick={handleExportCsv}
              disabled={exporting}
              title="Export filtered events to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? "Exporting…" : "Export CSV"}</span>
            </button>
          )}
          <Link className="btn primary flex items-center gap-1.5" to="/organizer/events/new">
            <Plus className="w-4 h-4" />
            <span>New event</span>
          </Link>
        </div>
      </div>

      {/* Aggregate Stats Dashboard */}
      {stats.total > 0 && (
        <div className="stats">
          <div className="stat">
            <b>{stats.total}</b>
            <span>Total Events</span>
          </div>
          <div className="stat">
            <b>{stats.live}</b>
            <span>Published</span>
          </div>
          <div className="stat">
            <b>{stats.used}</b>
            <span>Registrations</span>
          </div>
          <div className="stat">
            <b>{stats.fill}%</b>
            <span>Seats filled (published)</span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      {stats.total > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 mt-2">
          <div className="seg" role="group" aria-label="Status filter">
            <button
              className={tab === "all" ? "on" : ""}
              onClick={() => handleTabChange("all")}
            >
              All ({stats.total})
            </button>
            <button
              className={tab === "published" ? "on" : ""}
              onClick={() => handleTabChange("published")}
            >
              Published ({stats.live})
            </button>
            <button
              className={tab === "draft" ? "on" : ""}
              onClick={() => handleTabChange("draft")}
            >
              Drafts ({stats.drafts})
            </button>
            <button
              className={tab === "canceled" ? "on" : ""}
              onClick={() => handleTabChange("canceled")}
            >
              Canceled ({stats.canceled})
            </button>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search your events…"
              className="py-1.5 px-3 text-xs sm:text-sm border-2 border-[var(--line)] rounded-lg bg-[var(--card)] text-[var(--ink)] w-full focus:border-[var(--ink)] focus:outline-none"
              aria-label="Search events"
            />
          </div>
        </div>
      )}

      {/* TanStack Table with Server-Side Pagination */}
      {stats.total === 0 ? (
        <Empty title="No events yet">
          <p>Create your first event to start collecting registrations.</p>
        </Empty>
      ) : (
        <DataTable
          columns={columns}
          data={events}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          isLoading={loading}
          emptyMessage={
            debouncedSearch || tab !== "all" ? (
              <div className="py-6">
                <p>No events match your current filter or search query.</p>
                <button
                  type="button"
                  className="btn small mt-2"
                  onClick={() => {
                    setTab("all");
                    setSearch("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              "No events found."
            )
          }
        />
      )}
    </>
  );
}
