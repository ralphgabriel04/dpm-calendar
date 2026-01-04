"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  dueAt: Date | null;
  priority: string;
  status: string;
  daysRemaining: number | null;
}

interface UpcomingDeadlinesWidgetProps {
  tasks: Task[];
  className?: string;
}

const PRIORITY_COLORS = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-gray-500",
};

const PRIORITY_BG = {
  URGENT: "bg-red-500/10",
  HIGH: "bg-orange-500/10",
  MEDIUM: "bg-yellow-500/10",
  LOW: "bg-gray-500/10",
};

export function UpcomingDeadlinesWidget({
  tasks,
  className,
}: UpcomingDeadlinesWidgetProps) {
  if (tasks.length === 0) {
    return (
      <div className={cn("rounded-xl border bg-card p-6", className)}>
        <h3 className="font-semibold mb-4">Échéances à venir</h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mb-2" />
          <p className="text-sm">Aucune échéance</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Échéances à venir</h3>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        {tasks.map((task) => {
          const isUrgent = task.daysRemaining !== null && task.daysRemaining <= 1;
          const isWarning = task.daysRemaining !== null && task.daysRemaining <= 3;

          return (
            <div
              key={task.id}
              className={cn(
                "p-3 rounded-lg border transition-colors hover:bg-muted/50",
                isUrgent && "border-red-500/50 bg-red-500/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  {task.dueAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(task.dueAt), "EEEE d MMMM", { locale: fr })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      PRIORITY_BG[task.priority as keyof typeof PRIORITY_BG] || PRIORITY_BG.LOW,
                      PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.LOW
                    )}
                  >
                    {task.priority}
                  </span>
                  {isUrgent ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : isWarning ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : null}
                </div>
              </div>
              {task.daysRemaining !== null && (
                <p
                  className={cn(
                    "text-xs mt-2",
                    isUrgent
                      ? "text-red-500"
                      : isWarning
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                  )}
                >
                  {task.daysRemaining === 0
                    ? "Aujourd'hui"
                    : task.daysRemaining === 1
                    ? "Demain"
                    : `Dans ${task.daysRemaining} jours`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
