"use client";

import { Flame, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export function StreakDisplay({ currentStreak, longestStreak, className }: StreakDisplayProps) {
  const isNewRecord = currentStreak >= longestStreak && currentStreak > 0;

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {/* Current streak */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            currentStreak > 0 ? "bg-orange-100 text-orange-500" : "bg-muted text-muted-foreground"
          )}
        >
          <Flame className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Série actuelle</p>
        </div>
      </div>

      {/* Best streak */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            isNewRecord ? "bg-yellow-100 text-yellow-600" : "bg-muted text-muted-foreground"
          )}
        >
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{longestStreak}</p>
          <p className="text-xs text-muted-foreground">
            {isNewRecord ? "Nouveau record !" : "Meilleure série"}
          </p>
        </div>
      </div>
    </div>
  );
}

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  if (streak === 0) return null;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-600 font-medium",
        sizeClasses[size]
      )}
    >
      <Flame className={iconSizes[size]} />
      <span>{streak}</span>
    </div>
  );
}

interface WeekStreakProps {
  completedDays: boolean[];
}

export function WeekStreak({ completedDays }: WeekStreakProps) {
  const days = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="flex items-center gap-1">
      {days.map((day, index) => (
        <div
          key={index}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
            completedDays[index]
              ? "bg-green-500 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          {day}
        </div>
      ))}
    </div>
  );
}
