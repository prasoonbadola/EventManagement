import { GoogleCalendar, ICalendar } from "datebook";
import { addMinutes } from "date-fns";

/** Calendar helpers: .ics generation and Google Calendar links powered by datebook and date-fns. */
export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  startsAt: string; // ISO
}

// Default duration for events when only start time is stored (2 hours)
export const DEFAULT_DURATION_MIN = 120;

const createEventConfig = (e: CalendarEvent) => {
  const start = new Date(e.startsAt);
  return {
    title: e.title,
    description: e.description ?? "",
    location: e.location ?? "",
    start,
    end: addMinutes(start, DEFAULT_DURATION_MIN),
  };
};

export const toICalendar = (e: CalendarEvent) => new ICalendar(createEventConfig(e));

export function buildIcs(events: CalendarEvent[]): string {
  if (events.length === 0) return "";
  const root = toICalendar(events[0]);
  for (let i = 1; i < events.length; i++) {
    root.addEvent(toICalendar(events[i]));
  }
  return root.render();
}

export const googleCalendarUrl = (e: CalendarEvent): string =>
  new GoogleCalendar(createEventConfig(e)).render();

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 100);
}

export const downloadIcs = (filename: string, events: CalendarEvent[]) => {
  if (events.length === 0) return;
  downloadFile(filename, buildIcs(events), "text/calendar;charset=utf-8");
};
