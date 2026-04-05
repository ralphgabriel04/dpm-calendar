/**
 * Calendar feature types
 */

export interface EventFormData {
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  calendarId: string;
  color?: string;
  reminderMinutes: number[];
  rrule?: string;
}
