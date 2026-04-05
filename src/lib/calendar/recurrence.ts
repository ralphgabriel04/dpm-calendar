import { RRule, RRuleSet, rrulestr } from "rrule";
import { addMinutes, differenceInMinutes } from "date-fns";

export interface RecurringEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  color?: string | null;
  calendarId: string;
  rrule?: string | null;
  parentEventId?: string | null;
  duration?: number | null;
  calendar?: {
    color: string | null;
    name: string;
  } | null;
}

export interface ExpandedEvent extends Omit<RecurringEvent, "id"> {
  id: string;
  originalEventId: string;
  isRecurrenceInstance: boolean;
  recurrenceDate: Date;
}

/**
 * Parse an RRULE string and return an RRule object
 */
export function parseRRule(rruleString: string, dtstart: Date): RRule {
  // Handle different RRULE formats
  let fullRRule = rruleString;

  // If the rrule doesn't include DTSTART, add it
  if (!rruleString.includes("DTSTART")) {
    const dtstartStr = formatDateToRRule(dtstart);
    fullRRule = `DTSTART:${dtstartStr}\nRRULE:${rruleString}`;
  }

  try {
    return rrulestr(fullRRule);
  } catch {
    // Fallback: create a basic rule
    const options = parseRRuleOptions(rruleString);
    return new RRule({
      ...options,
      dtstart,
    });
  }
}

/**
 * Parse RRULE string options manually
 */
function parseRRuleOptions(rruleString: string): Partial<RRule["options"]> {
  const options: Partial<RRule["options"]> = {};
  const parts = rruleString.replace("RRULE:", "").split(";");

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!value) continue;

    switch (key) {
      case "FREQ":
        options.freq = {
          YEARLY: RRule.YEARLY,
          MONTHLY: RRule.MONTHLY,
          WEEKLY: RRule.WEEKLY,
          DAILY: RRule.DAILY,
          HOURLY: RRule.HOURLY,
          MINUTELY: RRule.MINUTELY,
          SECONDLY: RRule.SECONDLY,
        }[value] ?? RRule.WEEKLY;
        break;
      case "INTERVAL":
        options.interval = parseInt(value, 10);
        break;
      case "COUNT":
        options.count = parseInt(value, 10);
        break;
      case "UNTIL":
        options.until = parseRRuleDate(value);
        break;
      case "BYDAY":
        options.byweekday = value.split(",").map((day) => {
          const dayMap: Record<string, number> = {
            MO: RRule.MO.weekday,
            TU: RRule.TU.weekday,
            WE: RRule.WE.weekday,
            TH: RRule.TH.weekday,
            FR: RRule.FR.weekday,
            SA: RRule.SA.weekday,
            SU: RRule.SU.weekday,
          };
          return dayMap[day] ?? 0;
        });
        break;
      case "BYMONTHDAY":
        options.bymonthday = value.split(",").map((d) => parseInt(d, 10));
        break;
      case "BYMONTH":
        options.bymonth = value.split(",").map((m) => parseInt(m, 10));
        break;
    }
  }

  return options;
}

/**
 * Parse RRULE date format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
 */
function parseRRuleDate(dateStr: string): Date {
  if (dateStr.length === 8) {
    // YYYYMMDD format
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1;
    const day = parseInt(dateStr.slice(6, 8), 10);
    return new Date(year, month, day);
  }

  // YYYYMMDDTHHMMSSZ format
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1;
  const day = parseInt(dateStr.slice(6, 8), 10);
  const hour = parseInt(dateStr.slice(9, 11), 10) || 0;
  const minute = parseInt(dateStr.slice(11, 13), 10) || 0;
  const second = parseInt(dateStr.slice(13, 15), 10) || 0;

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

/**
 * Format a date for RRULE DTSTART
 */
function formatDateToRRule(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}${second}`;
}

/**
 * Expand recurring events into individual instances within a date range
 */
export function expandRecurringEvents(
  events: RecurringEvent[],
  rangeStart: Date,
  rangeEnd: Date
): (RecurringEvent | ExpandedEvent)[] {
  const result: (RecurringEvent | ExpandedEvent)[] = [];

  for (const event of events) {
    // If not a recurring event, add as-is
    if (!event.rrule || event.parentEventId) {
      result.push(event);
      continue;
    }

    // Calculate event duration in minutes
    const duration = event.duration || differenceInMinutes(event.endAt, event.startAt);

    try {
      // Parse the recurrence rule
      const rule = parseRRule(event.rrule, event.startAt);

      // Get all occurrences within the range
      // Add a buffer to the range to catch events that might span across boundaries
      const occurrences = rule.between(
        rangeStart,
        rangeEnd,
        true // Include boundaries
      );

      // Create an instance for each occurrence
      for (const occurrence of occurrences) {
        // Preserve the original time from the event
        const instanceStart = new Date(occurrence);
        instanceStart.setHours(
          event.startAt.getHours(),
          event.startAt.getMinutes(),
          event.startAt.getSeconds(),
          event.startAt.getMilliseconds()
        );

        const instanceEnd = addMinutes(instanceStart, duration);

        const expandedEvent: ExpandedEvent = {
          ...event,
          id: `${event.id}_${instanceStart.toISOString()}`,
          originalEventId: event.id,
          startAt: instanceStart,
          endAt: instanceEnd,
          isRecurrenceInstance: true,
          recurrenceDate: occurrence,
        };

        result.push(expandedEvent);
      }
    } catch (error) {
      console.error(`Failed to expand recurring event ${event.id}:`, error);
      // If expansion fails, add the original event
      result.push(event);
    }
  }

  // Sort by start time
  result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  return result;
}

