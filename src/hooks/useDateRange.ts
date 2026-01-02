"use client";

import { useState, useMemo, useCallback } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addDays,
} from "date-fns";

export type TimeRange =
  | "today"
  | "tomorrow"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom";

interface DateRangeState {
  range: TimeRange;
  customStart?: Date;
  customEnd?: Date;
}

interface UseDateRangeReturn {
  range: TimeRange;
  setRange: (range: TimeRange) => void;
  customStart?: Date;
  customEnd?: Date;
  setCustomRange: (start: Date, end: Date) => void;
  startDate: Date;
  endDate: Date;
  rangeLabel: string;
}

const RANGE_LABELS: Record<TimeRange, string> = {
  today: "Aujourd'hui",
  tomorrow: "Demain",
  week: "Cette semaine",
  month: "Ce mois",
  quarter: "Ce trimestre",
  year: "Cette annee",
  custom: "Personnalise",
};

export function useDateRange(initialRange: TimeRange = "week"): UseDateRangeReturn {
  const [state, setState] = useState<DateRangeState>({
    range: initialRange,
  });

  const setRange = useCallback((range: TimeRange) => {
    setState((prev) => ({ ...prev, range }));
  }, []);

  const setCustomRange = useCallback((start: Date, end: Date) => {
    setState({
      range: "custom",
      customStart: start,
      customEnd: end,
    });
  }, []);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();

    switch (state.range) {
      case "today":
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case "tomorrow":
        const tomorrow = addDays(now, 1);
        return { startDate: startOfDay(tomorrow), endDate: endOfDay(tomorrow) };
      case "week":
        return {
          startDate: startOfWeek(now, { weekStartsOn: 1 }),
          endDate: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case "quarter":
        return { startDate: startOfQuarter(now), endDate: endOfQuarter(now) };
      case "year":
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case "custom":
        if (state.customStart && state.customEnd) {
          return {
            startDate: startOfDay(state.customStart),
            endDate: endOfDay(state.customEnd),
          };
        }
        // Fallback to week if no custom dates
        return {
          startDate: startOfWeek(now, { weekStartsOn: 1 }),
          endDate: endOfWeek(now, { weekStartsOn: 1 }),
        };
    }
  }, [state.range, state.customStart, state.customEnd]);

  const rangeLabel = RANGE_LABELS[state.range];

  return {
    range: state.range,
    setRange,
    customStart: state.customStart,
    customEnd: state.customEnd,
    setCustomRange,
    startDate,
    endDate,
    rangeLabel,
  };
}
