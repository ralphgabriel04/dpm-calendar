"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { trpc as api } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  TrendingUp,
  Clock,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface WorkloadAlertsProps {
  className?: string;
  compact?: boolean;
}

export function WorkloadAlerts({ className, compact = false }: WorkloadAlertsProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const { data: alerts, isLoading: loadingAlerts } = api.workload.getAlerts.useQuery(undefined, {
    enabled: expanded,
  });

  const { data: urgentTasks, isLoading: loadingUrgent } = api.workload.getPerceivedUrgency.useQuery(
    { limit: 5 },
    { enabled: expanded }
  );

  const { data: criticalWeeks, isLoading: loadingWeeks } = api.workload.getCriticalWeeks.useQuery(
    { weeksAhead: 4 },
    { enabled: expanded }
  );

  const dismissAlert = (key: string) => {
    setDismissedAlerts((prev) => new Set([...Array.from(prev), key]));
  };

  const getAlertIcon = (type: "critical" | "warning" | "info") => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBg = (type: "critical" | "warning" | "info") => {
    switch (type) {
      case "critical":
        return "bg-red-500/10 border-red-500/20";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20";
      case "info":
        return "bg-blue-500/10 border-blue-500/20";
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const visibleAlerts = alerts?.filter(
    (a, i) => !dismissedAlerts.has(`${a.type}-${i}`)
  );

  const criticalWeeksData = criticalWeeks?.filter((w) => w.isCriticalWeek || w.isWarningWeek);

  const isLoading = loadingAlerts || loadingUrgent || loadingWeeks;

  return (
    <div className={cn("rounded-xl border bg-gradient-to-br from-red-500/5 to-orange-500/10", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="font-semibold">Alertes de charge</span>
          {visibleAlerts && visibleAlerts.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {visibleAlerts.length}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-red-500" />
            </div>
          ) : (
            <>
              {visibleAlerts && visibleAlerts.length > 0 && (
                <div className="space-y-2">
                  {visibleAlerts.map((alert, index) => (
                    <div
                      key={`${alert.type}-${index}`}
                      className={cn(
                        "p-3 rounded-lg border flex items-start gap-3",
                        getAlertBg(alert.type)
                      )}
                    >
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                        {alert.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(alert.date), "EEEE d MMMM", { locale: fr })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => dismissAlert(`${alert.type}-${index}`)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {urgentTasks && urgentTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Taches urgentes
                  </h4>
                  <div className="space-y-2">
                    {urgentTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.taskId}
                        className="p-2 rounded-lg bg-card border flex items-center gap-3"
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            getUrgencyColor(task.urgencyLevel)
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {task.dueAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.dueAt), "d MMM", { locale: fr })}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.estimatedMinutes} min
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              task.urgencyLevel === "critical"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : task.urgencyLevel === "high"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            )}
                          >
                            {task.perceivedUrgency}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {criticalWeeksData && criticalWeeksData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    Semaines a surveiller
                  </h4>
                  <div className="space-y-2">
                    {criticalWeeksData.map((week, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-2 rounded-lg border",
                          week.isCriticalWeek
                            ? "bg-red-500/10 border-red-500/20"
                            : "bg-amber-500/10 border-amber-500/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Semaine du {format(new Date(week.weekStart), "d MMM", { locale: fr })}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              week.isCriticalWeek
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            )}
                          >
                            {week.isCriticalWeek ? "Critique" : "Chargee"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {week.criticalDays} jour(s) critique(s), {week.warningDays} jour(s) charge(s)
                        </p>
                        {week.recommendation && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {week.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!visibleAlerts || visibleAlerts.length === 0) &&
                (!urgentTasks || urgentTasks.length === 0) &&
                (!criticalWeeksData || criticalWeeksData.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune alerte</p>
                    <p className="text-xs">Votre charge de travail est equilibree</p>
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
