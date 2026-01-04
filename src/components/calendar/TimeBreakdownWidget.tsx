"use client";

import { useMemo } from "react";
import { startOfDay, endOfDay, differenceInMinutes } from "date-fns";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface TimeCategory {
  id: string;
  name: string;
  color: string;
  minutes: number;
}

interface TimeBreakdownWidgetProps {
  events: CalendarEvent[];
  date?: Date;
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
  onViewAll,
  className,
}: TimeBreakdownWidgetProps) {
  // Calculate time breakdown by category/calendar
  const categories = useMemo(() => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Filter events for today
    const todayEvents = events.filter((event) => {
      const eventStart = new Date(event.startAt);
      const eventEnd = new Date(event.endAt);
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });

    // Group by calendar/category
    const categoryMap = new Map<string, TimeCategory>();

    todayEvents.forEach((event) => {
      // Calculate duration in minutes (clamp to day boundaries)
      const eventStart = new Date(event.startAt);
      const eventEnd = new Date(event.endAt);
      const clampedStart = eventStart < dayStart ? dayStart : eventStart;
      const clampedEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
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
  }, [events, date]);

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

  return (
    <div className={cn("rounded-xl bg-card border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Répartition du temps</h3>
        {onViewAll && categories.length > 0 && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Voir tout
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

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
    </div>
  );
}
