import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Download } from "lucide-react";
import { CapacityBar } from "../../shared/components/Badges";
import { DataTable } from "../../shared/components/DataTable";
import { Empty, ErrorState, Loading } from "../../shared/components/States";
import { useToast } from "../../shared/components/Toast";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { useFetch } from "../../shared/hooks/useFetch";
import { downloadCsv } from "../../shared/lib/csv";
import { fmtMine } from "../../shared/lib/format";
import { getEvent, listAttendees } from "../events/eventsApi";
import type { Attendee } from "../events/types";

export function AttendeesPage() {
  const { id } = useParams({ strict: false });
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [exporting, setExporting] = useState(false);

  const debouncedSearch = useDebounce(search.trim(), 300);

  const ev = useFetch(() => getEvent(id!), [id]);
  const list = useFetch(
    () =>
      listAttendees(id!, {
        page,
        limit: pageSize,
        q: debouncedSearch,
      }),
    [id, page, pageSize, debouncedSearch]
  );

  const event = ev.data?.event;
  const attendees = list.data?.attendees ?? [];
  const pagination = list.data?.pagination;

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<Attendee>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] font-bold text-xs flex items-center justify-center flex-none">
              {row.original.name.charAt(0).toUpperCase()}
            </div>
            <strong className="text-[var(--ink)] font-semibold">{row.original.name}</strong>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <a
            href={`mailto:${row.original.email}`}
            className="text-[var(--muted)] hover:text-[var(--ink)] no-underline hover:underline text-xs sm:text-sm"
          >
            {row.original.email}
          </a>
        ),
      },
      {
        accessorKey: "registeredAt",
        header: "Registered at",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-[var(--muted)]">
            {fmtMine(row.original.registeredAt)}
          </span>
        ),
      },
    ],
    []
  );

  const exportCsv = async () => {
    setExporting(true);
    try {
      // Export full attendee list (fetch up to 1000)
      const all = await listAttendees(id!, { page: 1, limit: 1000 });
      downloadCsv(`attendees-${event?.id ?? "event"}.csv`, [
        ["Name", "Email", "Registered at"],
        ...all.attendees.map((a) => [a.name, a.email, a.registeredAt]),
      ]);
      toast("ok", "Attendees exported to CSV successfully.");
    } catch (err) {
      toast("err", (err as Error)?.message ?? "Failed to export attendees.");
    } finally {
      setExporting(false);
    }
  };

  if (ev.loading && !ev.data) return <Loading />;
  if (ev.error) return <ErrorState error={ev.error} retry={ev.reload} />;
  if (!event) return null;

  return (
    <>
      <Link to="/organizer" className="back flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" />
        <span>My events</span>
      </Link>

      <div className="titlerow">
        <h1>{event.title}</h1>
        {event.activeRegistrations > 0 && (
          <button
            type="button"
            className="btn flex items-center gap-1.5"
            onClick={exportCsv}
            disabled={exporting}
            title="Export all attendees to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? "Exporting…" : "Export CSV"}</span>
          </button>
        )}
      </div>

      <p className="muted text-sm mb-2">
        {event.activeRegistrations} of {event.capacity} places taken ·{" "}
        {event.placesRemaining} available
      </p>

      <div className="capwide mb-6">
        <CapacityBar used={event.activeRegistrations} capacity={event.capacity} />
      </div>

      {event.activeRegistrations === 0 ? (
        <Empty title="No registrations yet">
          Share the event link to get people signed up.
        </Empty>
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <input
              className="filter-input py-2 px-3 border-2 border-[var(--line)] rounded-lg bg-[var(--card)] text-[var(--ink)] w-full focus:border-[var(--ink)] focus:outline-none text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search attendees by name or email…"
              aria-label="Filter attendees"
            />
          </div>

          {list.error ? (
            <ErrorState error={list.error} retry={list.reload} />
          ) : (
            <DataTable
              columns={columns}
              data={attendees}
              pagination={pagination}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              isLoading={list.loading}
              emptyMessage={
                debouncedSearch ? (
                  <div className="py-6">
                    <p>No attendees match “{debouncedSearch}”.</p>
                    <button
                      type="button"
                      className="btn small mt-2"
                      onClick={() => setSearch("")}
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  "No attendees registered."
                )
              }
            />
          )}
        </>
      )}
    </>
  );
}
