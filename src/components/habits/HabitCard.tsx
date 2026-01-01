"use client";

import { Check, Flame, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    currentStreak: number;
    longestStreak: number;
    targetCount: number;
    frequency: string;
    isActive: boolean;
  };
  completedToday: boolean;
  todayCount: number;
  onToggle: (habitId: string, completed: boolean) => void;
  onEdit: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}

export function HabitCard({
  habit,
  completedToday,
  todayCount,
  onToggle,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const progress = Math.min((todayCount / habit.targetCount) * 100, 100);
  const isComplete = todayCount >= habit.targetCount;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md",
        !habit.isActive && "opacity-60"
      )}
    >
      {/* Completion button */}
      <button
        onClick={() => onToggle(habit.id, !completedToday)}
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all",
          isComplete
            ? "border-green-500 bg-green-500 text-white"
            : "border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
        )}
        style={{
          borderColor: isComplete ? undefined : habit.color ?? undefined,
        }}
      >
        {isComplete ? (
          <Check className="h-5 w-5" />
        ) : habit.targetCount > 1 ? (
          <span className="text-xs font-medium">
            {todayCount}/{habit.targetCount}
          </span>
        ) : null}
      </button>

      {/* Habit info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{habit.name}</h3>
          {habit.currentStreak > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">{habit.currentStreak}</span>
            </div>
          )}
        </div>
        {habit.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {habit.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {frequencyLabels[habit.frequency] || habit.frequency}
          </Badge>
          {habit.targetCount > 1 && (
            <Badge variant="outline" className="text-xs">
              {habit.targetCount}x
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar for multi-count habits */}
      {habit.targetCount > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-lg overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: habit.color || "hsl(var(--primary))",
            }}
          />
        </div>
      )}

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(habit.id)}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(habit.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const frequencyLabels: Record<string, string> = {
  DAILY: "Quotidien",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel",
  CUSTOM: "Personnalisé",
};
