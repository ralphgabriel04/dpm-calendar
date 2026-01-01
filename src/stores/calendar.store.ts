import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  startOfWeek,
  startOfMonth,
  addDays,
  addWeeks,
  addMonths,
} from "date-fns";

type ViewType = "day" | "week" | "month" | "agenda";

interface CalendarState {
  // View state
  currentDate: Date;
  viewType: ViewType;

  // Filters
  visibleCalendarIds: string[];

  // Actions
  setCurrentDate: (date: Date) => void;
  setViewType: (viewType: ViewType) => void;
  navigatePrev: () => void;
  navigateNext: () => void;
  navigateToday: () => void;
  toggleCalendarVisibility: (calendarId: string) => void;
  setVisibleCalendars: (calendarIds: string[]) => void;

  // Computed
  getViewRange: () => { start: Date; end: Date };
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      currentDate: new Date(),
      viewType: "week",
      visibleCalendarIds: [],

      setCurrentDate: (date) => set({ currentDate: date }),

      setViewType: (viewType) => set({ viewType }),

      navigatePrev: () => {
        const { currentDate, viewType } = get();
        let newDate: Date;
        switch (viewType) {
          case "day":
            newDate = addDays(currentDate, -1);
            break;
          case "week":
            newDate = addWeeks(currentDate, -1);
            break;
          case "agenda":
            newDate = addWeeks(currentDate, -1);
            break;
          default:
            newDate = addMonths(currentDate, -1);
        }
        set({ currentDate: newDate });
      },

      navigateNext: () => {
        const { currentDate, viewType } = get();
        let newDate: Date;
        switch (viewType) {
          case "day":
            newDate = addDays(currentDate, 1);
            break;
          case "week":
            newDate = addWeeks(currentDate, 1);
            break;
          case "agenda":
            newDate = addWeeks(currentDate, 1);
            break;
          default:
            newDate = addMonths(currentDate, 1);
        }
        set({ currentDate: newDate });
      },

      navigateToday: () => set({ currentDate: new Date() }),

      toggleCalendarVisibility: (calendarId) => {
        const { visibleCalendarIds } = get();
        const newIds = visibleCalendarIds.includes(calendarId)
          ? visibleCalendarIds.filter((id) => id !== calendarId)
          : [...visibleCalendarIds, calendarId];
        set({ visibleCalendarIds: newIds });
      },

      setVisibleCalendars: (calendarIds) =>
        set({ visibleCalendarIds: calendarIds }),

      getViewRange: () => {
        const { currentDate, viewType } = get();
        switch (viewType) {
          case "day":
            return {
              start: currentDate,
              end: addDays(currentDate, 1),
            };
          case "week":
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
            return {
              start: weekStart,
              end: addDays(weekStart, 7),
            };
          case "agenda":
            return {
              start: currentDate,
              end: addDays(currentDate, 14), // 2 weeks ahead
            };
          default:
            const monthS = startOfMonth(currentDate);
            const monthStart = startOfWeek(monthS, { weekStartsOn: 1 });
            return {
              start: monthStart,
              end: addDays(monthStart, 42), // 6 weeks
            };
        }
      },
    }),
    {
      name: "dpm-calendar-storage",
      partialize: (state) => ({
        viewType: state.viewType,
        visibleCalendarIds: state.visibleCalendarIds,
      }),
    }
  )
);
