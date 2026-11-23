import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown } from "lucide-react";
import { downloadIcs, googleCalendarUrl } from "../../shared/lib/calendar";
import type { AddToCalendarMenuProps } from "./types";

interface MenuCoords {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export function AddToCalendarMenu({
  event,
  align = "left",
  direction,
  size = "small",
}: AddToCalendarMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;

    const shouldPopUp =
      direction === "up" || (!direction && spaceBelow < 180 && rect.top > 180);

    const newCoords: MenuCoords = {};

    if (shouldPopUp) {
      newCoords.bottom = window.innerHeight - rect.top + 6;
    } else {
      newCoords.top = rect.bottom + 6;
    }

    if (align === "right") {
      newCoords.right = Math.max(12, window.innerWidth - rect.right);
    } else {
      newCoords.left = Math.max(12, rect.left);
    }

    setCoords(newCoords);
  }, [align, direction]);

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
  }, [open, updatePosition]);

  return (
    <div className="menu" style={{ display: "inline-block" }}>
      <button
        ref={buttonRef}
        type="button"
        className={`btn ${size === "small" ? "small" : ""} btn-calendar flex items-center gap-1.5`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>Add to calendar</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            className="menu-pop portal-menu"
            role="menu"
            style={{
              position: "fixed",
              top: coords.top !== undefined ? `${coords.top}px` : "auto",
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : "auto",
              left: coords.left !== undefined ? `${coords.left}px` : "auto",
              right: coords.right !== undefined ? `${coords.right}px` : "auto",
              minWidth: "210px",
              zIndex: 99999,
            }}
          >
            <a
              role="menuitem"
              href={googleCalendarUrl(event)}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              Google Calendar
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                downloadIcs(
                  `${event.title.replace(/\W+/g, "-").toLowerCase()}.ics`,
                  [event]
                );
                setOpen(false);
              }}
            >
              Apple / Outlook (.ics)
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
