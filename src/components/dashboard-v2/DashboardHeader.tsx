"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { TimeRangeSelector } from "./TimeRangeSelector";
import type { TimeRange } from "@/hooks/useDateRange";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  startDate: Date;
  endDate: Date;
  className?: string;
}

export function DashboardHeader({
  range,
  onRangeChange,
  startDate,
  endDate,
  className,
}: DashboardHeaderProps) {
  const formatDateRange = () => {
    if (range === "today") {
      return format(startDate, "EEEE d MMMM yyyy", { locale: fr });
    }
    if (range === "week" || range === "month") {
      return `${format(startDate, "d MMM", { locale: fr })} - ${format(
        endDate,
        "d MMM yyyy",
        { locale: fr }
      )}`;
    }
    return `${format(startDate, "d MMM yyyy", { locale: fr })} - ${format(
      endDate,
      "d MMM yyyy",
      { locale: fr }
    )}`;
  };

  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <Calendar className="h-4 w-4" />
          <span className="text-sm capitalize">{formatDateRange()}</span>
        </div>
      </div>
      <TimeRangeSelector value={range} onChange={onRangeChange} />
    </header>
  );
}
