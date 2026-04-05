"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/Tooltip";

interface WorkloadDay {
  date: string;
  scheduledMins: number;
  actualMins: number;
  overloadScore: number;
  status: "light" | "normal" | "heavy" | "overloaded";
}

interface WorkloadBalanceWidgetProps {
  data: WorkloadDay[];
  className?: string;
}

const STATUS_COLORS = {
  light: "bg-green-400 dark:bg-green-600",
  normal: "bg-gray-400 dark:bg-gray-500",
  heavy: "bg-orange-400 dark:bg-orange-500",
  overloaded: "bg-red-500 dark:bg-red-600",
};

const STATUS_LABELS = {
  light: "Leger",
  normal: "Normal",
  heavy: "Charge",
  overloaded: "Surcharge",
};

export function WorkloadBalanceWidget({
  data,
  className,
}: WorkloadBalanceWidgetProps) {
  // Calculate summary
  const summary = data.reduce(
    (acc, day) => {
      acc[day.status]++;
      return acc;
    },
    { light: 0, normal: 0, heavy: 0, overloaded: 0 }
  );

  const total = data.length;

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <h3 className="font-semibold mb-4">Balance de charge</h3>

      {/* Summary bar */}
      <div className="flex h-4 rounded-full overflow-hidden mb-4">
        {(["light", "normal", "heavy", "overloaded"] as const).map((status) => {
          const percent = total > 0 ? (summary[status] / total) * 100 : 0;
          if (percent === 0) return null;
          return (
            <div
              key={status}
              className={cn("transition-all", STATUS_COLORS[status])}
              style={{ width: `${percent}%` }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {(["light", "normal", "heavy", "overloaded"] as const).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", STATUS_COLORS[status])} />
            <span className="text-xs text-muted-foreground">
              {STATUS_LABELS[status]} ({summary[status]})
            </span>
          </div>
        ))}
      </div>

      {/* Daily bars */}
      <div className="space-y-2">
        <TooltipProvider delayDuration={100}>
          {data.slice(-7).map((day) => (
            <Tooltip key={day.date}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 cursor-default">
                  <span className="text-xs text-muted-foreground w-16">
                    {format(new Date(day.date), "EEE d", { locale: fr })}
                  </span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        STATUS_COLORS[day.status]
                      )}
                      style={{
                        width: `${Math.min(100, (day.scheduledMins / 540) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {Math.round(day.scheduledMins / 60)}h
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">
                  {format(new Date(day.date), "EEEE d MMMM", { locale: fr })}
                </p>
                <p className="text-muted-foreground">
                  Planifie: {Math.round(day.scheduledMins / 60)}h
                </p>
                <p className="text-muted-foreground">
                  Realise: {Math.round(day.actualMins / 60)}h
                </p>
                <p className={cn("text-xs mt-1", STATUS_COLORS[day.status].replace("bg-", "text-"))}>
                  {STATUS_LABELS[day.status]}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
