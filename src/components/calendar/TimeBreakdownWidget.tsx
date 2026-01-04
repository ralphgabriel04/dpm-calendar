"use client";

import { useMemo, useState } from "react";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes, format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/calendar/utils";

type ViewType = "day" | "week" | "month" | "agenda" | "timeline" | "workload";

interface TimeCategory {
  id: string;
  name: string;
  color: string;
  minutes: number;
}

interface TimeBreakdownWidgetProps {
  events: CalendarEvent[];
  date?: Date;
  viewType?: ViewType;
  onViewAll?: () => void;
  className?: string;
}

// Default category colors
const CATEGORY_COLORS: Record<string, string> = {
  meeting: "#3b82f6", // blue
  meetings: "#3b82f6",
  reunion: "#3b82f6",
  reunions: "#3b82f6",
  project: "#22c55e", // green
  projects: "#22c55e",
  projets: "#22c55e",
  event: "#f59e0b", // amber
  events: "#f59e0b",
  evenement: "#f59e0b",
  evenements: "#f59e0b",
  review: "#ef4444", // red
  reviews: "#ef4444",
  revue: "#ef4444",
  focus: "#8b5cf6", // purple
  work: "#06b6d4", // cyan
  travail: "#06b6d4",
  personal: "#ec4899", // pink
  personnel: "#ec4899",
  default: "#6b7280", // gray
};

function getCategoryColor(categoryName: string): string {
  const lowerName = categoryName.toLowerCase();
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (lowerName.includes(key)) {
      return color;
    }
  }
  return CATEGORY_COLORS.default;
}

export function TimeBreakdownWidget({
  events,
  date = new Date(),
  viewType = "day",
  onViewAll,
  className,
}: TimeBreakdownWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate date range based on view type
  const { rangeStart, rangeEnd } = useMemo(() => {
    switch (viewType) {
      case "day":
        return { rangeStart: startOfDay(date), rangeEnd: endOfDay(date) };
      case "week":
      case "timeline":
        return {
          rangeStart: startOfWeek(date, { weekStartsOn: 1 }),
          rangeEnd: endOfWeek(date, { weekStartsOn: 1 }),
        };
      case "month":
      case "workload":
        return {
          rangeStart: startOfMonth(date),
          rangeEnd: endOfMonth(date),
        };
      default:
        return { rangeStart: startOfDay(date), rangeEnd: endOfDay(date) };
    }
  }, [date, viewType]);

  // Calculate time breakdown by category/calendar
  const categories = useMemo(() => {
    // Filter events in range
    const rangeEvents = events.filter((event) => {
      const eventStart = new Date(event.startAt);
      const eventEnd = new Date(event.endAt);
      return eventStart <= rangeEnd && eventEnd >= rangeStart;
    });

    // Group by calendar/category
    const categoryMap = new Map<string, TimeCategory>();

    rangeEvents.forEach((event) => {
      // Calculate duration in minutes (clamp to range boundaries)
      const eventStart = new Date(event.startAt);
      const eventEnd = new Date(event.endAt);
      const clampedStart = eventStart < rangeStart ? rangeStart : eventStart;
      const clampedEnd = eventEnd > rangeEnd ? rangeEnd : eventEnd;
      const minutes = differenceInMinutes(clampedEnd, clampedStart);

      if (minutes <= 0) return;

      // Use calendar name or event title as category
      const categoryName = event.calendar?.name || "Événements";
      const categoryId = categoryName.toLowerCase().replace(/\s+/g, "-");
      const color = event.calendar?.color || event.color || getCategoryColor(categoryName);

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)!;
        existing.minutes += minutes;
      } else {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          color,
          minutes,
        });
      }
    });

    // Convert to array and sort by minutes (descending)
    return Array.from(categoryMap.values()).sort((a, b) => b.minutes - a.minutes);
  }, [events, rangeStart, rangeEnd]);

  // Calculate max minutes for scaling
  const maxMinutes = useMemo(() => {
    if (categories.length === 0) return 60;
    return Math.max(...categories.map((c) => c.minutes), 60);
  }, [categories]);

  // Format minutes to hours:minutes
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  // Generate title based on view type
  const title = useMemo(() => {
    switch (viewType) {
      case "day":
        return "Répartition du temps";
      case "week":
      case "timeline":
        return "Temps de la semaine";
      case "month":
      case "workload":
        return `Temps - ${format(date, "MMMM", { locale: fr })}`;
      default:
        return "Répartition du temps";
    }
  }, [date, viewType]);

  return (
    <div className={cn("rounded-xl bg-card border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1 text-sm font-semibold hover:text-primary transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {title}
        </button>
        {onViewAll && categories.length > 0 && !isCollapsed && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Voir tout
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <>
          {/* Categories */}
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune donnée
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => {
                const percentage = (category.minutes / maxMinutes) * 100;

                return (
                  <div key={category.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDuration(category.minutes)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total */}
          {categories.length > 0 && (
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">
                {formatDuration(categories.reduce((sum, c) => sum + c.minutes, 0))}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
