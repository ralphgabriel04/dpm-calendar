"use client";

import { Target, Calendar } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface GoalProgress {
  id: string;
  title: string;
  color: string | null;
  targetType: string;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  progress: number;
  daysRemaining: number | null;
}

interface GoalProgressWidgetProps {
  goals: GoalProgress[];
  className?: string;
}

export function GoalProgressWidget({
  goals,
  className,
}: GoalProgressWidgetProps) {
  if (goals.length === 0) {
    return (
      <div className={cn("rounded-xl border bg-card p-6", className)}>
        <h3 className="font-semibold mb-4">Objectifs</h3>
        <p className="text-muted-foreground text-sm text-center py-4">
          Aucun objectif actif
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Objectifs</h3>
        <Target className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: goal.color || "#6b7280" }}
                />
                <span className="text-sm font-medium">{goal.title}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {goal.currentValue}/{goal.targetValue} {goal.unit || ""}
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                style={{
                  width: `${goal.progress}%`,
                  backgroundColor: goal.color || "#6b7280",
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{goal.progress}% complete</span>
              {goal.daysRemaining !== null && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {goal.daysRemaining > 0
                      ? `${goal.daysRemaining} jours restants`
                      : goal.daysRemaining === 0
                      ? "Aujourd'hui"
                      : "En retard"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
