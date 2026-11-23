import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Edit3, Copy, Send, Trash2, Ban } from "lucide-react";
import type { MenuCoords, OrganizerActionMenuProps } from "./types";

/**
 * OrganizerActionMenu
 * Portal-based action dropdown menu for organizer event rows.
 * Renders into document.body to prevent any clipping from table overflow,
 * especially when there is only a single record in the table.
 */
export function OrganizerActionMenu({
  event,
  onDuplicate,
  onPublish,
  onCancel,
  onDelete,
}: OrganizerActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const right = window.innerWidth - rect.right;

    // Flip upwards if cramped below and ample space above
    if (spaceBelow < 210 && rect.top > 210) {
      setCoords({
        bottom: window.innerHeight - rect.top + 6,
        right: Math.max(12, right),
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        right: Math.max(12, right),
      });
    }
  };

  const toggleOpen = () => {
    if (!open) {
      updatePosition();
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape, true);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape, true);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  return (
    <div className="menu" style={{ display: "inline-block" }}>
      <button
        ref={buttonRef}
        type="button"
        className="btn small icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${event.title}`}
        title="More actions"
        onClick={toggleOpen}
      >
        ⋯
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            className="menu-pop right portal-menu"
            role="menu"
            style={{
              position: "fixed",
              top: coords.top !== undefined ? `${coords.top}px` : "auto",
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : "auto",
              right: `${coords.right}px`,
              minWidth: "180px",
              zIndex: 99999,
            }}
          >
            {event.status !== "canceled" && (
              <Link
                to="/organizer/events/$id/edit"
                params={{ id: String(event.id) } as any}
                role="menuitem"
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <Edit3 className="w-4 h-4" /> Edit event
              </Link>
            )}

            <button
              type="button"
              role="menuitem"
              className="flex items-center gap-2"
              onClick={() => {
                setOpen(false);
                onDuplicate(event);
              }}
            >
              <Copy className="w-4 h-4" /> Duplicate as draft
            </button>

            {event.status === "draft" && (
              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-2"
                onClick={() => {
                  setOpen(false);
                  onPublish(event);
                }}
              >
                <Send className="w-4 h-4" /> Publish event
              </button>
            )}

            {event.status === "draft" && (
              <button
                type="button"
                role="menuitem"
                className="danger-text flex items-center gap-2"
                onClick={() => {
                  setOpen(false);
                  onDelete(event);
                }}
              >
                <Trash2 className="w-4 h-4" /> Delete draft
              </button>
            )}

            {event.status === "published" && (
              <button
                type="button"
                role="menuitem"
                className="danger-text flex items-center gap-2"
                onClick={() => {
                  setOpen(false);
                  onCancel(event);
                }}
              >
                <Ban className="w-4 h-4" /> Cancel event
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
