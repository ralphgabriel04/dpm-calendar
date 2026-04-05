"use client";

import { Target, MoreVertical, Pencil, Trash2, Link2, TrendingUp, Pause, Play } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    targetType: string;
    targetValue: number;
    currentValue: number;
    unit?: string | null;
    status: string;
    startDate?: Date | null;
    endDate?: Date | null;
    habits?: Array<{ id: string; name: string }>;
  };
  onEdit: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onToggleStatus: (goalId: string, status: string) => void;
  onClick?: (goalId: string) => void;
}

export function GoalCard({ goal, onEdit, onDelete, onToggleStatus, onClick }: GoalCardProps) {
  const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  const isCompleted = goal.status === "COMPLETED";
  const isPaused = goal.status === "PAUSED";

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-4 transition-all hover:shadow-md cursor-pointer",
        isPaused && "opacity-60",
        isCompleted && "border-green-500/50 bg-green-50/50"
      )}
      onClick={() => onClick?.(goal.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isCompleted ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
            )}
          >
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">{goal.title}</h3>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {goal.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(goal.id); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(goal.id, isPaused ? "ACTIVE" : "PAUSED");
              }}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Reprendre
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Mettre en pause
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progression</span>
          <span className="font-medium">
            {goal.currentValue} / {goal.targetValue} {goal.unit || ""}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              isCompleted ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          {goal.category && (
            <Badge variant="secondary" className="text-xs">
              {goal.category}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {targetTypeLabels[goal.targetType] || goal.targetType}
          </Badge>
        </div>

        {goal.habits && goal.habits.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link2 className="h-3 w-3" />
            <span>{goal.habits.length} habitude{goal.habits.length > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Status badge */}
      {(isCompleted || isPaused) && (
        <div className="absolute top-2 right-12">
          <Badge
            variant={isCompleted ? "default" : "secondary"}
            className={cn("text-xs", isCompleted && "bg-green-500")}
          >
            {statusLabels[goal.status]}
          </Badge>
        </div>
      )}
    </div>
  );
}

const targetTypeLabels: Record<string, string> = {
  CUMULATIVE: "Cumulatif",
  STREAK: "Série",
  COMPLETION: "Complétion",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  COMPLETED: "Complété",
  PAUSED: "En pause",
  ABANDONED: "Abandonné",
};
