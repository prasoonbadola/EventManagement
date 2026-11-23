import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import { isPast } from "date-fns";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

import { fmtTimeLocal } from "../../shared/lib/format";
import type { MyRegistration } from "./types";

export function RegistrationCalendar({
  regs,
  onSelect,
}: {
  regs: MyRegistration[];
  onSelect: (r: MyRegistration) => void;
}) {
  const events = useMemo(() => {
    return regs.map((r) => {
      const isPastEvent = isPast(new Date(r.event.startsAt));
      const isEventCanceled = r.event.status === "canceled";
      const isRegCanceled = r.status === "canceled";

      const className = isEventCanceled
        ? "fc-event-event-canceled"
        : isRegCanceled
        ? "fc-event-canceled"
        : isPastEvent
        ? "fc-event-past"
        : "fc-event-active";

      return {
        id: String(r.id),
        title: `${fmtTimeLocal(r.event.startsAt)} ${r.event.title}`,
        start: r.event.startsAt,
        className,
        extendedProps: {
          registration: r,
        },
      };
    });
  }, [regs]);

  return (
    <div className="cal fullcalendar-container" aria-label="Registration calendar">
      <FullCalendar
        plugins={[dayGridPlugin, classicThemePlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          const r = info.event.extendedProps.registration as MyRegistration;
          if (r) onSelect(r);
        }}
        dayMaxEvents={2}
        headerToolbar={{
          left: "prev,today,next",
          center: "title",
          right: "",
        }}
        height="auto"
      />
      <ul className="legend" aria-label="Legend" style={{ marginTop: "16px" }}>
        <li>
          <i className="dot reg" /> Registered
        </li>
        <li>
          <i className="dot past" /> Past
        </li>
        <li>
          <i className="dot canc" /> Registration canceled
        </li>
        <li>
          <i className="dot evc" /> Event canceled
        </li>
      </ul>
    </div>
  );
}
