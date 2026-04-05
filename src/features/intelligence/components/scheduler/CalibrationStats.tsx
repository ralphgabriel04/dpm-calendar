"use client";

import { trpc as api } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  BarChart3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface CalibrationStatsProps {
  className?: string;
}

export function CalibrationStats({ className }: CalibrationStatsProps) {
  const {
    data: stats,
    isLoading,
    refetch,
  } = api.aiScheduler.getStats.useQuery(
    { days: 30 },
    {
      refetchOnWindowFocus: false,
    }
  );

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border bg-card p-4", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!stats || stats.totalTasks === 0) {
    return (
      <div className={cn("rounded-lg border bg-card p-4", className)}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Calibration des estimations</h3>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Pas encore de données</p>
          <p className="text-xs">
            Complétez quelques tâches pour voir vos statistiques.
          </p>
        </div>
      </div>
    );
  }

  const getAccuracyColor = (accuracy: number | null) => {
    if (!accuracy) return "text-muted-foreground";
    if (accuracy >= 80) return "text-green-500";
    if (accuracy >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getTrendIcon = () => {
    if (!stats.avgOverrun) return <Minus className="h-5 w-5 text-muted-foreground" />;
    if (stats.avgOverrun > 0) {
      return <TrendingUp className="h-5 w-5 text-orange-500" />;
    }
    return <TrendingDown className="h-5 w-5 text-green-500" />;
  };

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Calibration des estimations</h3>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {/* Accuracy */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Précision</span>
          </div>
          <p
            className={cn(
              "text-2xl font-bold",
              getAccuracyColor(stats.avgAccuracy)
            )}
          >
            {stats.avgAccuracy !== null ? `${stats.avgAccuracy}%` : "—"}
          </p>
        </div>

        {/* Average overrun */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-xs text-muted-foreground">Écart moyen</span>
          </div>
          <p className="text-2xl font-bold">
            {stats.avgOverrun !== null ? (
              <>
                {stats.avgOverrun > 0 ? "+" : ""}
                {stats.avgOverrun} min
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      {/* Distribution */}
      <div className="px-4 pb-4">
        <div className="text-xs text-muted-foreground mb-2">
          Répartition ({stats.totalTasks} tâches)
        </div>
        <div className="flex items-center gap-2">
          {/* Under-estimate */}
          <div className="flex-1">
            <div
              className="h-2 rounded-full bg-orange-200 dark:bg-orange-900/50"
              style={{
                width: `${(stats.underEstimateCount / stats.totalTasks) * 100}%`,
              }}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-orange-600 dark:text-orange-400">
                Sous-estimé
              </span>
              <span className="text-xs text-muted-foreground">
                {stats.underEstimateCount}
              </span>
            </div>
          </div>

          {/* On time */}
          <div className="flex-1">
            <div
              className="h-2 rounded-full bg-green-200 dark:bg-green-900/50"
              style={{
                width: `${(stats.onTimeCount / stats.totalTasks) * 100}%`,
              }}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-green-600 dark:text-green-400">
                À l'heure
              </span>
              <span className="text-xs text-muted-foreground">
                {stats.onTimeCount}
              </span>
            </div>
          </div>

          {/* Over-estimate */}
          <div className="flex-1">
            <div
              className="h-2 rounded-full bg-blue-200 dark:bg-blue-900/50"
              style={{
                width: `${(stats.overEstimateCount / stats.totalTasks) * 100}%`,
              }}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Sur-estimé
              </span>
              <span className="text-xs text-muted-foreground">
                {stats.overEstimateCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="px-4 pb-4">
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <p>{stats.recommendation}</p>
        </div>
      </div>
    </div>
  );
}
