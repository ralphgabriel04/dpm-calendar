import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  eachHourOfInterval,
  format,
  isSameDay,
  isWithinInterval,
  differenceInMinutes,
  addMinutes,
  setHours,
  setMinutes,
} from "date-fns";
import { fr } from "date-fns/locale";

export type ViewType = "day" | "week" | "month" | "agenda" | "timeline";

// Get the date range for a given view
export function getViewDateRange(
  date: Date,
  viewType: ViewType
): { start: Date; end: Date } {
  switch (viewType) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "week":
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case "month":
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      };
    default:
      return { start: startOfDay(date), end: endOfDay(date) };
  }
}

// Get days for a view
export function getViewDays(date: Date, viewType: ViewType): Date[] {
  const { start, end } = getViewDateRange(date, viewType);
  return eachDayOfInterval({ start, end });
}

// Get hours for time grid (default 0-23)
export function getHoursOfDay(
  date: Date = new Date(),
  startHour: number = 0,
  endHour: number = 24
): Date[] {
  const start = setMinutes(setHours(startOfDay(date), startHour), 0);
  const end = setMinutes(setHours(startOfDay(date), endHour - 1), 0);
  return eachHourOfInterval({ start, end });
}

// Position calculation for events in day/week view
export interface EventPosition {
  top: number; // percentage from top
  height: number; // percentage of container height
  left: number; // percentage from left (for overlapping)
  width: number; // percentage of column width
}

export function calculateEventPosition(
  eventStart: Date,
  eventEnd: Date,
  dayStart: Date,
  dayEnd: Date,
  hourHeight: number = 60, // pixels per hour
  startHour: number = 0
): { top: number; height: number } {
  const dayStartTime = setMinutes(setHours(dayStart, startHour), 0);

  const minutesFromDayStart = Math.max(
    0,
    differenceInMinutes(eventStart, dayStartTime)
  );
  const eventDuration = Math.max(
    15, // minimum 15 minutes
    differenceInMinutes(eventEnd, eventStart)
  );

  const top = (minutesFromDayStart / 60) * hourHeight;
  const height = (eventDuration / 60) * hourHeight;

  return { top, height };
}

// Check if an event overlaps with a time slot
export function isEventInTimeSlot(
  eventStart: Date,
  eventEnd: Date,
  slotStart: Date,
  slotEnd: Date
): boolean {
  return (
    isWithinInterval(eventStart, { start: slotStart, end: slotEnd }) ||
    isWithinInterval(eventEnd, { start: slotStart, end: slotEnd }) ||
    (eventStart <= slotStart && eventEnd >= slotEnd)
  );
}

// Check if event is on a specific day
export function isEventOnDay(
  eventStart: Date,
  eventEnd: Date,
  day: Date
): boolean {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  return isEventInTimeSlot(eventStart, eventEnd, dayStart, dayEnd);
}

// Format time for display
export function formatTime(date: Date): string {
  return format(date, "HH:mm", { locale: fr });
}

// Format date for display
export function formatDate(date: Date, formatStr: string = "d MMMM yyyy"): string {
  return format(date, formatStr, { locale: fr });
}

// Format day header (e.g., "Lun 15")
export function formatDayHeader(date: Date): string {
  return format(date, "EEE d", { locale: fr });
}

// Check if date is today
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// Get current time position in percentage
export function getCurrentTimePosition(
  startHour: number = 0,
  endHour: number = 24
): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const rangeMinutes = (endHour - startHour) * 60;
  const offsetMinutes = startHour * 60;

  return ((currentMinutes - offsetMinutes) / rangeMinutes) * 100;
}

// Group overlapping events for proper layout
export interface EventGroup {
  events: Array<{
    event: CalendarEvent;
    column: number;
    totalColumns: number;
  }>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  color?: string;
  calendarId: string;
  rrule?: string;
  parentEventId?: string;
  calendar?: {
    color: string;
    name: string;
  };
}

export function groupOverlappingEvents(
  events: CalendarEvent[],
  day: Date
): EventGroup {
  // Filter events for this day and sort by start time
  const dayEvents = events
    .filter((e) => !e.isAllDay && isEventOnDay(e.startAt, e.endAt, day))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  if (dayEvents.length === 0) {
    return { events: [] };
  }

  // Find overlapping groups
  const columns: CalendarEvent[][] = [];

  for (const event of dayEvents) {
    // Find a column where this event doesn't overlap
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const lastEventInColumn = columns[i][columns[i].length - 1];
      if (event.startAt >= lastEventInColumn.endAt) {
        columns[i].push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
    }
  }

  // Map events to their positions
  const totalColumns = columns.length;
  const result: EventGroup["events"] = [];

  for (let col = 0; col < columns.length; col++) {
    for (const event of columns[col]) {
      result.push({
        event,
        column: col,
        totalColumns,
      });
    }
  }

  return { events: result };
}

// Get all-day events for a day
export function getAllDayEvents(
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  return events.filter(
    (e) => e.isAllDay && isEventOnDay(e.startAt, e.endAt, day)
  );
}

// Create a time slot from click position
export function getTimeFromPosition(
  yPosition: number,
  containerTop: number,
  hourHeight: number,
  startHour: number = 0,
  roundToMinutes: number = 15
): Date {
  const offsetY = yPosition - containerTop;
  const totalMinutes = (offsetY / hourHeight) * 60 + startHour * 60;
  const roundedMinutes =
    Math.round(totalMinutes / roundToMinutes) * roundToMinutes;

  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  const date = new Date();
  return setMinutes(setHours(date, hours), minutes);
}

// Generate default event duration (1 hour)
export function getDefaultEventEnd(start: Date, durationMinutes: number = 60): Date {
  return addMinutes(start, durationMinutes);
}
