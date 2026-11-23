import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Empty, ErrorState, Loading } from "../../shared/components/States";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { useFetch } from "../../shared/hooks/useFetch";
import { EventCard } from "./EventCard";
import { listEvents } from "./eventsApi";

const WINDOWS = { any: undefined, week: 7, month: 30 } as const;

export function EventsPage() {
  const [q, setQ] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [win, setWin] = useState<keyof typeof WINDOWS>("any");
  const [page, setPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Automatically debounce user search input by 300ms
  const debouncedQuery = useDebounce(q.trim(), 300);

  // Keyboard shortcut: Press "/" anywhere on the page to focus the search bar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const days = WINDOWS[win];
  const { data, error, loading, reload } = useFetch(
    () => listEvents({ q: debouncedQuery, onlyOpen, days, page, limit: 12 }),
    [debouncedQuery, onlyOpen, days, page]
  );

  const events = data?.events ?? [];
  const pagination = data?.pagination;
  const filtered = Boolean(q.trim()) || onlyOpen || win !== "any";

  const handleFilterChange = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const handleClearAll = () => {
    setQ("");
    setOnlyOpen(false);
    setWin("any");
    setPage(1);
  };

  return (
    <>
      <header className="hero-landing">
        <div className="hero-grid">
          <div className="hero-text-col">
            <div className="hero-badge-pill">
              <span className="live-pulse"></span>
              <span>Live Seat Reservation Platform</span>
            </div>
            <h1 className="hero-headline">Discover & attend exceptional gatherings.</h1>
            <p className="hero-subtext">
              Curated developer meetups, intimate workshops, and tech summits.
              Instant ticket generation with guaranteed zero overselling.
            </p>

            <form onSubmit={(ev) => ev.preventDefault()} className="search hero-search">
              <div className="search-box">
                <input
                  ref={searchInputRef}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by title, location, topic, or organizer…"
                  aria-label="Search events"
                />
                <kbd title="Press / to search">/</kbd>
              </div>
              <button type="submit" className="btn primary">
                Search
              </button>
            </form>
          </div>

          <div className="hero-banner-col">
            <div className="hero-card-frame">
              <img
                src="/hero-banner.jpg"
                alt="Community gatherings, workshops, and tech conferences"
                className="hero-banner-img"
              />
            </div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="seg" role="group" aria-label="When">
            {(
              [
                ["any", "Any time"],
                ["week", "Next 7 days"],
                ["month", "Next 30 days"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                className={win === k ? "on" : ""}
                aria-pressed={win === k}
                onClick={() => handleFilterChange(() => setWin(k))}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => handleFilterChange(() => setOnlyOpen(e.target.checked))}
            />
            Only with places left
          </label>

          {filtered && (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={handleClearAll}
              title="Reset all search and filter options"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              <span>Reset filters</span>
            </button>
          )}

          {data && (
            <span className="results-count muted">
              Showing <strong>{events.length}</strong> {events.length === 1 ? "event" : "events"}
            </span>
          )}
        </div>
      </header>

      {loading && !data && <Loading label="Finding events…" />}
      {error && <ErrorState error={error} retry={reload} />}

      {!error && data && (
        events.length === 0 ? (
          <Empty
            title={
              debouncedQuery
                ? `No events match “${debouncedQuery}”`
                : filtered
                ? "No events match these filters"
                : "No upcoming events yet"
            }
          >
            {filtered ? (
              <div style={{ marginTop: "12px" }}>
                <p>Try widening your search or clearing active filters.</p>
                <button
                  className="btn"
                  onClick={handleClearAll}
                  style={{ marginTop: "8px" }}
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              "Check back soon."
            )}
          </Empty>
        ) : (
          <>
            <div className="grid">
              {events.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>

            {pagination && (
              <div className="flex items-center justify-center gap-3 mt-10 sm:mt-12 select-none">
                <button
                  type="button"
                  className="h-8 px-3 inline-flex items-center gap-1 justify-center rounded-lg text-xs font-semibold border-2 border-[var(--line)] hover:border-[var(--ink)] hover:bg-[var(--card)] text-[var(--ink)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--line)] disabled:hover:bg-transparent"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="text-xs sm:text-sm font-medium text-[var(--muted)]">
                  Page <strong className="text-[var(--ink)] font-bold">{page}</strong> of{" "}
                  <strong className="text-[var(--ink)] font-bold">{Math.max(1, pagination.totalPages)}</strong>{" "}
                  <span className="hidden sm:inline">({pagination.total} events)</span>
                </span>
                <button
                  type="button"
                  className="h-8 px-3 inline-flex items-center gap-1 justify-center rounded-lg text-xs font-semibold border-2 border-[var(--line)] hover:border-[var(--ink)] hover:bg-[var(--card)] text-[var(--ink)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--line)] disabled:hover:bg-transparent"
                  disabled={!pagination.hasMore || page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )
      )}

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <strong>Gathr<span>.</span></strong>
            <p className="muted" style={{ fontSize: "0.85rem", margin: "4px 0 0" }}>
              Community event discovery with strict pessimistic row locking and zero overbooking.
            </p>
          </div>
          <div className="footer-links">
            <span className="muted" style={{ fontSize: "0.82rem" }}>
              Tip: Press <kbd style={{ padding: "2px 6px" }}>/</kbd> anywhere to search
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
