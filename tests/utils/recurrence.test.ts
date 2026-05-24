import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RRule } from "rrule";
import {
  parseRRule,
  expandRecurringEvents,
  type RecurringEvent,
} from "@/lib/calendar/recurrence";

describe("Recurrence Utilities", () => {
  let realDate: typeof Date;

  beforeEach(() => {
    realDate = global.Date;
    const mockDate = new Date(2024, 5, 15, 10, 0, 0); // June 15, 2024, 10:00 AM
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
    global.Date = realDate;
  });

  describe("parseRRule", () => {
    it("parses daily recurrence rule", () => {
      const dtstart = new Date(2024, 5, 1, 9, 0); // June 1, 2024
      const rule = parseRRule("FREQ=DAILY;COUNT=5", dtstart);

      expect(rule.options.freq).toBe(RRule.DAILY);
      expect(rule.options.count).toBe(5);
    });

    it("parses weekly recurrence rule", () => {
      const dtstart = new Date(2024, 5, 1, 9, 0);
      const rule = parseRRule("FREQ=WEEKLY;INTERVAL=2", dtstart);

      expect(rule.options.freq).toBe(RRule.WEEKLY);
      expect(rule.options.interval).toBe(2);
    });

    it("parses monthly recurrence rule", () => {
      const dtstart = new Date(2024, 5, 1, 9, 0);
      const rule = parseRRule("FREQ=MONTHLY;BYMONTHDAY=15", dtstart);

      expect(rule.options.freq).toBe(RRule.MONTHLY);
      expect(rule.options.bymonthday).toContain(15);
    });

    it("parses yearly recurrence rule", () => {
      const dtstart = new Date(2024, 5, 1, 9, 0);
      const rule = parseRRule("FREQ=YEARLY;BYMONTH=6", dtstart);

      expect(rule.options.freq).toBe(RRule.YEARLY);
      expect(rule.options.bymonth).toContain(6);
    });

    it("parses BYDAY correctly", () => {
      const dtstart = new Date(2024, 5, 1, 9, 0);
      const rule = parseRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR", dtstart);

      expect(rule.options.freq).toBe(RRule.WEEKLY);
      expect(rule.options.byweekday).toContain(RRule.MO.weekday);
      expect(rule.options.byweekday).toContain(RRule.WE.weekday);
      expect(rule.options.byweekday).toContain(RRule.FR.weekday);
    });

    it("parses UNTIL date correctly", () => {
      const dtstart = new Date(2024, 5, 1, 9, 0);
      const rule = parseRRule("FREQ=DAILY;UNTIL=20240630", dtstart);

      expect(rule.options.freq).toBe(RRule.DAILY);
      expect(rule.options.until).toBeDefined();
      expect(rule.options.until?.getFullYear()).toBe(2024);
      expect(rule.options.until?.getMonth()).toBe(5); // June
      expect(rule.options.until?.getDate()).toBe(30);
    });

    it("handles RRULE: prefix", () => {
      const dtstart = new Date(2024, 5, 1, 9, 0);
      const rule = parseRRule("RRULE:FREQ=DAILY;COUNT=3", dtstart);

      expect(rule.options.freq).toBe(RRule.DAILY);
      expect(rule.options.count).toBe(3);
    });

    it("handles rrule with existing DTSTART", () => {
      const dtstart = new Date(2024, 5, 1, 9, 0);
      const rruleWithDtstart =
        "DTSTART:20240601T090000\nRRULE:FREQ=WEEKLY;COUNT=4";
      const rule = parseRRule(rruleWithDtstart, dtstart);

      expect(rule.options.freq).toBe(RRule.WEEKLY);
      expect(rule.options.count).toBe(4);
    });
  });

  describe("expandRecurringEvents", () => {
    it("returns non-recurring events unchanged", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Single Event",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 10, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: null,
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("event-1");
      expect(result[0].title).toBe("Single Event");
    });

    it("expands daily recurring events", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Daily Standup",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 9, 30),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=5",
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      expect(result).toHaveLength(5);
      result.forEach((event) => {
        expect(event.title).toBe("Daily Standup");
      });
    });

    it("expands weekly recurring events", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Weekly Meeting",
          startAt: new Date(2024, 5, 3, 14, 0), // Monday, June 3
          endAt: new Date(2024, 5, 3, 15, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=WEEKLY;COUNT=4",
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      expect(result).toHaveLength(4);
      // Each occurrence should be 1 week apart
      const dates = result.map((e) => e.startAt.getDate());
      expect(dates).toContain(3);
      expect(dates).toContain(10);
      expect(dates).toContain(17);
      expect(dates).toContain(24);
    });

    it("preserves event duration for expanded instances", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Long Meeting",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 12, 0), // 3 hours
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=3",
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      expect(result).toHaveLength(3);
      result.forEach((event) => {
        const durationMs = event.endAt.getTime() - event.startAt.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        expect(durationHours).toBe(3);
      });
    });

    it("adds recurrence metadata to expanded events", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Recurring Event",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 10, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=2",
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      expect(result).toHaveLength(2);
      result.forEach((event) => {
        expect((event as any).isRecurrenceInstance).toBe(true);
        expect((event as any).originalEventId).toBe("event-1");
        expect((event as any).recurrenceDate).toBeDefined();
      });
    });

    it("generates unique IDs for each instance", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Recurring Event",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 10, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=3",
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      const ids = result.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it("skips child events with parentEventId", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Parent Event",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 10, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=5",
        },
        {
          id: "event-2",
          title: "Modified Instance",
          startAt: new Date(2024, 5, 11, 10, 0), // Modified time
          endAt: new Date(2024, 5, 11, 11, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=5", // Has rrule but also parentEventId
          parentEventId: "event-1",
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      // Parent should expand, child should be added as-is
      const parentInstances = result.filter(
        (e) => (e as any).originalEventId === "event-1"
      );
      const childEvents = result.filter((e) => e.id === "event-2");

      expect(parentInstances.length).toBe(5);
      expect(childEvents.length).toBe(1);
    });

    it("only includes occurrences within date range", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Daily Event",
          startAt: new Date(2024, 5, 1, 9, 0),
          endAt: new Date(2024, 5, 1, 10, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY",
        },
      ];

      const rangeStart = new Date(2024, 5, 10);
      const rangeEnd = new Date(2024, 5, 15);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      // Should only include events from June 10-15 (6 days)
      result.forEach((event) => {
        expect(event.startAt.getTime()).toBeGreaterThanOrEqual(
          rangeStart.getTime()
        );
        expect(event.startAt.getTime()).toBeLessThanOrEqual(rangeEnd.getTime());
      });
    });

    it("sorts expanded events by start time", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-2",
          title: "Afternoon Event",
          startAt: new Date(2024, 5, 10, 14, 0),
          endAt: new Date(2024, 5, 10, 15, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=3",
        },
        {
          id: "event-1",
          title: "Morning Event",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 10, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=3",
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      // Results should be sorted by start time
      for (let i = 1; i < result.length; i++) {
        expect(result[i].startAt.getTime()).toBeGreaterThanOrEqual(
          result[i - 1].startAt.getTime()
        );
      }
    });

    it("handles events with pre-calculated duration", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Event with Duration",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 10, 30),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=2",
          duration: 90, // 90 minutes
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      expect(result).toHaveLength(2);
      result.forEach((event) => {
        const durationMs = event.endAt.getTime() - event.startAt.getTime();
        const durationMinutes = durationMs / (1000 * 60);
        expect(durationMinutes).toBe(90);
      });
    });

    it("preserves all event properties in expanded instances", () => {
      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Full Event",
          description: "Event description",
          location: "Conference Room A",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 10, 0),
          isAllDay: false,
          color: "#FF0000",
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=2",
          calendar: {
            color: "#0000FF",
            name: "Work",
          },
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      expect(result).toHaveLength(2);
      result.forEach((event) => {
        expect(event.title).toBe("Full Event");
        expect(event.description).toBe("Event description");
        expect(event.location).toBe("Conference Room A");
        expect(event.color).toBe("#FF0000");
        expect(event.calendarId).toBe("cal-1");
        expect(event.calendar?.name).toBe("Work");
      });
    });

    it("handles empty events array", () => {
      const result = expandRecurringEvents(
        [],
        new Date(2024, 5, 1),
        new Date(2024, 5, 30)
      );

      expect(result).toHaveLength(0);
    });

    it("handles invalid rrule gracefully", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const events: RecurringEvent[] = [
        {
          id: "event-1",
          title: "Bad RRULE Event",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 10, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "INVALID_RRULE_STRING",
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      // Should not throw, should return original event
      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      expect(result.length).toBeGreaterThanOrEqual(1);
      consoleSpy.mockRestore();
    });

    it("handles mixed recurring and non-recurring events", () => {
      const events: RecurringEvent[] = [
        {
          id: "recurring-1",
          title: "Daily Event",
          startAt: new Date(2024, 5, 10, 9, 0),
          endAt: new Date(2024, 5, 10, 10, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: "FREQ=DAILY;COUNT=3",
        },
        {
          id: "single-1",
          title: "Single Event",
          startAt: new Date(2024, 5, 12, 14, 0),
          endAt: new Date(2024, 5, 12, 15, 0),
          isAllDay: false,
          calendarId: "cal-1",
          rrule: null,
        },
      ];

      const rangeStart = new Date(2024, 5, 1);
      const rangeEnd = new Date(2024, 5, 30);

      const result = expandRecurringEvents(events, rangeStart, rangeEnd);

      expect(result).toHaveLength(4); // 3 recurring + 1 single
      expect(result.some((e) => e.id === "single-1")).toBe(true);
    });
  });
});
