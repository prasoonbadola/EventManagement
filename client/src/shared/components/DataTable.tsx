import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { Pagination } from "../../features/events/types";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  pagination?: Pagination | "client" | false;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  initialPageSize?: number;
}

/**
 * Reusable, responsive table component powered by @tanstack/react-table.
 * Supports:
 * - Server-side pagination (when passing a Pagination object + onPageChange)
 * - Client-side pagination (when pagination="client" or pagination is omitted)
 * - Page size selection (5, 10, 20, 50) with styled dropdown
 * - Jump to First / Last page
 * - Stable, unified table card container with mobile-responsive controls
 */
export function DataTable<TData>({
  columns,
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  emptyMessage = "No records found.",
  initialPageSize = 10,
}: DataTableProps<TData>) {
  const isServerPagination =
    typeof pagination === "object" && pagination !== null;
  const isPaginationDisabled = pagination === false;

  // Client-side pagination internal state
  const [clientPagination, setClientPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row: any, idx) => (row?.id != null ? String(row.id) : String(idx)),
    ...(isServerPagination
      ? {
          manualPagination: true,
          pageCount: pagination.totalPages ?? -1,
        }
      : !isPaginationDisabled
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          state: { pagination: clientPagination },
          onPaginationChange: setClientPagination,
        }
      : {}),
  });

  // Determine current pagination metrics
  const currentPage = isServerPagination
    ? pagination.page ?? 1
    : !isPaginationDisabled
    ? clientPagination.pageIndex + 1
    : 1;

  const pageSize = isServerPagination
    ? pagination.limit ?? initialPageSize
    : !isPaginationDisabled
    ? clientPagination.pageSize
    : data.length;

  const total = isServerPagination
    ? pagination.total ?? data.length
    : data.length;

  const totalPages = isServerPagination
    ? Math.max(1, pagination.totalPages ?? 1)
    : !isPaginationDisabled
    ? Math.max(1, Math.ceil(total / pageSize))
    : 1;

  const startRecord =
    total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(total, currentPage * pageSize);

  const handlePage = (p: number) => {
    const target = Math.max(1, Math.min(totalPages, p));
    if (isServerPagination) {
      onPageChange?.(target);
    } else if (!isPaginationDisabled) {
      setClientPagination((prev) => ({
        ...prev,
        pageIndex: target - 1,
      }));
    }
  };

  const handlePageSize = (newSize: number) => {
    if (isServerPagination) {
      onPageSizeChange?.(newSize);
    } else if (!isPaginationDisabled) {
      setClientPagination({
        pageIndex: 0,
        pageSize: newSize,
      });
    }
  };

  // Generate page numbers window (e.g. 1, 2, 3, 4, 5)
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  // Ensure current pageSize is included in selectable options
  const pageSizeOptions = useMemo(() => {
    const set = new Set([5, 10, 20, 50, pageSize]);
    return Array.from(set).sort((a, b) => a - b);
  }, [pageSize]);

  const showPagination = !isPaginationDisabled;

  return (
    <div className="w-full border-2 border-[var(--ink)] rounded-xl bg-[var(--card)] shadow-sm overflow-hidden flex flex-col">
      {/* Table Scrollable Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)] border-b-2 border-[var(--ink)] bg-[var(--bg)] whitespace-nowrap"
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-14 text-center text-[var(--muted)]"
                >
                  <span className="spinner mr-2" /> Loading records…
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-14 text-center text-[var(--muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--line)] hover:bg-[var(--bg)]/50 transition-colors last:border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 align-middle text-[var(--ink)]"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Unified Pagination Footer */}
      {showPagination && (
        <div className="border-t-2 border-[var(--ink)] bg-[var(--bg)]/40 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-[var(--muted)] select-none">
          {/* Left section: Summary count & page size select */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4 flex-wrap">
            <span className="text-xs sm:text-sm font-medium">
              {total === 0 ? (
                "Showing 0 to 0 of 0 entries"
              ) : (
                <>
                  Showing <strong className="text-[var(--ink)] font-bold">{startRecord}</strong> to{" "}
                  <strong className="text-[var(--ink)] font-bold">{endRecord}</strong> of{" "}
                  <strong className="text-[var(--ink)] font-bold">{total}</strong> entries
                </>
              )}
            </span>

            {/* Rows dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--muted)] font-medium whitespace-nowrap">Show:</span>
              <div className="relative inline-flex items-center">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSize(Number(e.target.value))}
                  disabled={isLoading}
                  aria-label="Rows per page"
                  className="table-page-select h-8 pl-2.5 pr-6 text-xs font-bold rounded-lg border-2 border-[var(--line)] bg-[var(--card)] text-[var(--ink)] cursor-pointer hover:border-[var(--ink)] focus:border-[var(--ink)] focus:outline-none transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    width: "auto",
                    minWidth: "62px",
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 text-[var(--muted)] flex items-center justify-center">
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xs text-[var(--muted)] font-medium whitespace-nowrap">/ page</span>
            </div>
          </div>

          {/* Right section: Navigation Controls */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-1.5">
            {/* First page button */}
            <button
              type="button"
              className="h-8 px-2 inline-flex items-center justify-center gap-1 rounded-lg text-xs font-semibold border-2 border-[var(--line)] hover:border-[var(--ink)] hover:bg-[var(--card)] text-[var(--ink)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--line)] disabled:hover:bg-transparent"
              disabled={currentPage <= 1 || isLoading || total === 0}
              onClick={() => handlePage(1)}
              title="First page"
              aria-label="First page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">First</span>
            </button>

            {/* Previous page button */}
            <button
              type="button"
              className="h-8 px-2 sm:px-2.5 inline-flex items-center justify-center gap-1 rounded-lg text-xs font-semibold border-2 border-[var(--line)] hover:border-[var(--ink)] hover:bg-[var(--card)] text-[var(--ink)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--line)] disabled:hover:bg-transparent"
              disabled={currentPage <= 1 || isLoading || total === 0}
              onClick={() => handlePage(currentPage - 1)}
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Desktop page number pills */}
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="min-w-[32px] h-8 flex items-center justify-center text-xs text-[var(--muted)] font-bold tracking-widest"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={`page-${p}`}
                    type="button"
                    className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs border-2 transition-all flex items-center justify-center ${
                      p === currentPage && total > 0
                        ? "bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] shadow-xs"
                        : "border-transparent text-[var(--ink)] hover:border-[var(--line)] hover:bg-[var(--card)]"
                    }`}
                    disabled={isLoading || totalPages <= 1 || total === 0}
                    onClick={() => handlePage(p as number)}
                    aria-current={p === currentPage ? "page" : undefined}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            {/* Mobile page indicator */}
            <span className="sm:hidden text-xs font-bold px-2 text-[var(--ink)]">
              Page {currentPage} of {totalPages}
            </span>

            {/* Next page button */}
            <button
              type="button"
              className="h-8 px-2 sm:px-2.5 inline-flex items-center justify-center gap-1 rounded-lg text-xs font-semibold border-2 border-[var(--line)] hover:border-[var(--ink)] hover:bg-[var(--card)] text-[var(--ink)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--line)] disabled:hover:bg-transparent"
              disabled={currentPage >= totalPages || isLoading || total === 0}
              onClick={() => handlePage(currentPage + 1)}
              title="Next page"
              aria-label="Next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last page button */}
            <button
              type="button"
              className="h-8 px-2 inline-flex items-center justify-center gap-1 rounded-lg text-xs font-semibold border-2 border-[var(--line)] hover:border-[var(--ink)] hover:bg-[var(--card)] text-[var(--ink)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--line)] disabled:hover:bg-transparent"
              disabled={currentPage >= totalPages || isLoading || total === 0}
              onClick={() => handlePage(totalPages)}
              title="Last page"
              aria-label="Last page"
            >
              <span className="hidden sm:inline">Last</span>
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
