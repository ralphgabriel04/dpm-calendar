import { describe, it, expect } from "vitest";
import { parseIcs } from "@/lib/integrations/ics";

function wrap(body: string): string {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", body, "END:VCALENDAR"].join("\r\n");
}

describe("parseIcs", () => {
  it("parses a timed event with TZID and DTEND", () => {
    const ics = wrap(
      [
        "BEGIN:VEVENT",
        "UID:timed-1",
        "SUMMARY:Team meeting",
        "DTSTART;TZID=America/Toronto:20240601T090000",
        "DTEND;TZID=America/Toronto:20240601T100000",
        "END:VEVENT",
      ].join("\r\n"),
    );

    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    const event = events[0];
    expect(event.uid).toBe("timed-1");
    expect(event.title).toBe("Team meeting");
    expect(event.isAllDay).toBe(false);
    // Wall-clock time parsed as local (TZID offset ignored, per documented limitation).
    expect(event.startAt).toEqual(new Date(2024, 5, 1, 9, 0, 0));
    expect(event.endAt).toEqual(new Date(2024, 5, 1, 10, 0, 0));
  });

  it("parses a UTC date-time (trailing Z)", () => {
    const ics = wrap(
      [
        "BEGIN:VEVENT",
        "UID:utc-1",
        "SUMMARY:UTC event",
        "DTSTART:20240601T130000Z",
        "DTEND:20240601T140000Z",
        "END:VEVENT",
      ].join("\r\n"),
    );

    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].startAt).toEqual(new Date(Date.UTC(2024, 5, 1, 13, 0, 0)));
    expect(events[0].endAt).toEqual(new Date(Date.UTC(2024, 5, 1, 14, 0, 0)));
    expect(events[0].isAllDay).toBe(false);
  });

  it("parses an all-day event (VALUE=DATE)", () => {
    const ics = wrap(
      [
        "BEGIN:VEVENT",
        "UID:allday-1",
        "SUMMARY:Holiday",
        "DTSTART;VALUE=DATE:20240601",
        "END:VEVENT",
      ].join("\r\n"),
    );

    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].isAllDay).toBe(true);
    expect(events[0].startAt).toEqual(new Date(2024, 5, 1));
    // Default all-day end is +1 day.
    expect(events[0].endAt).toEqual(new Date(2024, 5, 2));
  });

  it("captures the raw RRULE without expanding it", () => {
    const ics = wrap(
      [
        "BEGIN:VEVENT",
        "UID:recurring-1",
        "SUMMARY:Weekly standup",
        "DTSTART;TZID=America/Toronto:20240603T090000",
        "DTEND;TZID=America/Toronto:20240603T091500",
        "RRULE:FREQ=WEEKLY;BYDAY=MO",
        "END:VEVENT",
      ].join("\r\n"),
    );

    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].rrule).toBe("FREQ=WEEKLY;BYDAY=MO");
  });

  it("computes endAt from DURATION when DTEND is absent", () => {
    const ics = wrap(
      [
        "BEGIN:VEVENT",
        "UID:duration-1",
        "SUMMARY:Short call",
        "DTSTART:20240601T130000Z",
        "DURATION:PT30M",
        "END:VEVENT",
      ].join("\r\n"),
    );

    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].endAt).toEqual(new Date(Date.UTC(2024, 5, 1, 13, 30, 0)));
  });

  it("unfolds folded lines (continuation with leading space)", () => {
    const ics = wrap(
      [
        "BEGIN:VEVENT",
        "UID:folded-1",
        "SUMMARY:This is a very long summary that has been",
        "  folded across two lines",
        "DTSTART:20240601T130000Z",
        "END:VEVENT",
      ].join("\r\n"),
    );

    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe(
      "This is a very long summary that has been folded across two lines",
    );
  });

  it("unescapes text values (newline, comma, semicolon, backslash)", () => {
    const ics = wrap(
      [
        "BEGIN:VEVENT",
        "UID:escaped-1",
        "SUMMARY:Line one\\nLine two\\, still\\; ok\\\\done",
        "DTSTART:20240601T130000Z",
        "END:VEVENT",
      ].join("\r\n"),
    );

    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Line one\nLine two, still; ok\\done");
  });

  it("skips a malformed VEVENT (no DTSTART) but keeps valid ones", () => {
    const ics = wrap(
      [
        "BEGIN:VEVENT",
        "UID:bad-1",
        "SUMMARY:Missing start",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "UID:good-1",
        "SUMMARY:Has start",
        "DTSTART:20240601T130000Z",
        "END:VEVENT",
      ].join("\r\n"),
    );

    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].uid).toBe("good-1");
  });

  it("returns an empty array for empty input", () => {
    expect(parseIcs("")).toEqual([]);
  });

  it("defaults title to empty string and end to +1 hour when SUMMARY/DTEND absent", () => {
    const ics = wrap(
      [
        "BEGIN:VEVENT",
        "UID:bare-1",
        "DTSTART:20240601T130000Z",
        "END:VEVENT",
      ].join("\r\n"),
    );

    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("");
    expect(events[0].endAt).toEqual(new Date(Date.UTC(2024, 5, 1, 14, 0, 0)));
  });
});
