"use client";

import { Clock, CheckCircle2, Target, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  trend?: number;
  trendLabel?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  trendLabel,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-muted p-2">
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trendLabel && (
          <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}

interface StatisticsCardsProps {
  totalHours: number;
  tasksCompleted: number;
  tasksPlanned: number;
  productivityScore: number;
  taskCompletionRate: number;
  percentChange?: {
    hours: number;
    tasks: number;
    productivity: number;
  } | null;
  className?: string;
}

export function StatisticsCards({
  totalHours,
  tasksCompleted,
  tasksPlanned,
  productivityScore,
  taskCompletionRate,
  percentChange,
  className,
}: StatisticsCardsProps) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      <StatCard
        title="Heures totales"
        value={`${totalHours}h`}
        icon={Clock}
        iconColor="text-blue-500"
        trend={percentChange?.hours}
        trendLabel="vs periode precedente"
      />
      <StatCard
        title="Taches completees"
        value={tasksCompleted}
        subtitle={`sur ${tasksPlanned} planifiees`}
        icon={CheckCircle2}
        iconColor="text-green-500"
        trend={percentChange?.tasks}
      />
      <StatCard
        title="Taux de completion"
        value={`${taskCompletionRate}%`}
        icon={Target}
        iconColor="text-orange-500"
      />
      <StatCard
        title="Score productivite"
        value={`${productivityScore}%`}
        icon={TrendingUp}
        iconColor="text-purple-500"
        trend={percentChange?.productivity}
      />
    </div>
  );
}
