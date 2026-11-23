import { addDays, format, parseISO } from "date-fns";

export const fmtEventTime = (iso: string, tz: string) => {
  try {
    const d = new Date(iso);
    const main = new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short", timeZone: tz }).format(d);
    const zone = new Intl.DateTimeFormat(undefined, { timeZoneName: "short", timeZone: tz }).formatToParts(d).find((p) => p.type === "timeZoneName")?.value;
    return zone ? `${main} (${zone})` : main;
  } catch {
    return iso;
  }
};

/** Compact, responsive date-time string ideal for table cells */
export const fmtTableDateTime = (iso: string, tz: string) => {
  try {
    const d = new Date(iso);
    const dateStr = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: tz,
    }).format(d);
    const timeStr = new Intl.DateTimeFormat(undefined, {
      timeStyle: "short",
      timeZone: tz,
    }).format(d);
    const zone = new Intl.DateTimeFormat(undefined, {
      timeZoneName: "short",
      timeZone: tz,
    }).formatToParts(d).find((p) => p.type === "timeZoneName")?.value;

    return `${dateStr} · ${timeStr}${zone ? ` (${zone})` : ""}`;
  } catch {
    return iso;
  }
};

export const fmtMine = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export const fmtTimeLocal = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export function fmtDay(iso: string, tz: string) {
  try {
    const d = new Date(iso);
    const p = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, { ...o, timeZone: tz }).format(d);
    return { mon: p({ month: "short" }), day: p({ day: "numeric" }), time: p({ timeStyle: "short" }) };
  } catch {
    return { mon: "", day: "", time: "" };
  }
}

export const sameZoneAsViewer = (tz: string) => {
  try {
    return tz === Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return false;
  }
};

/**
 * Adds N days to a local ISO datetime string ('YYYY-MM-DDTHH:mm')
 * keeping local wall-clock hours and minutes identical, powered by date-fns.
 */
export function addDaysToLocalIso(localStr: string, days = 7): string {
  try {
    const date = parseISO(localStr);
    const future = addDays(date, days);
    return format(future, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return localStr;
  }
}
