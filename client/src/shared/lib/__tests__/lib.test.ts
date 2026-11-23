import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl } from "../calendar";
import { toCsv } from "../csv";
import { addDaysToLocalIso } from "../format";

const ev = { id: 7, title: "Rock, Paper; Scissors", description: "Line1\nLine2", location: "Hall A", startsAt: "2026-12-01T10:30:00.000Z" };

describe("buildIcs", () => {
  const ics = buildIcs([ev]);
  it("is a valid VCALENDAR with RFC 5545 format and UTC times", () => {
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20261201T103000Z");
    expect(ics).toContain("DTEND:20261201T123000Z");
    expect(ics).toContain("END:VCALENDAR");
  });
  it("escapes commas, semicolons and newlines", () => {
    expect(ics).toContain("SUMMARY:Rock\\, Paper\\; Scissors");
    expect(ics).toContain("Line1\\nLine2");
  });
});

describe("googleCalendarUrl", () => {
  it("encodes title and UTC date range", () => {
    const u = new URL(googleCalendarUrl(ev));
    expect(u.searchParams.get("text")).toBe(ev.title);
    expect(u.searchParams.get("dates")).toBe("20261201T103000Z/20261201T123000Z");
  });
});

describe("toCsv", () => {
  it("quotes special characters and neutralises spreadsheet formulas via PapaParse", () => {
    expect(toCsv([["a,b", 'say "hi"'], ["=HYPERLINK(1)", "+1", "ok"]])).toBe(`"a,b","say ""hi"""\r\n'=HYPERLINK(1),'+1,ok`);
  });
});

describe("addDaysToLocalIso", () => {
  it("correctly advances date by 7 days using date-fns", () => {
    expect(addDaysToLocalIso("2026-12-01T18:00", 7)).toBe("2026-12-08T18:00");
  });
});
