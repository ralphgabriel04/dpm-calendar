"use client";

import { Flame, Check, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitStreak {
  id: string;
  name: string;
  color: string | null;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
}

interface HabitStreaksWidgetProps {
  habits: HabitStreak[];
  className?: string;
}

export function HabitStreaksWidget({
  habits,
  className,
}: HabitStreaksWidgetProps) {
  if (habits.length === 0) {
    return (
      <div className={cn("rounded-xl border bg-card p-6", className)}>
        <h3 className="font-semibold mb-4">Streaks d'habitudes</h3>
        <p className="text-muted-foreground text-sm text-center py-4">
          Aucune habitude active
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Streaks d'habitudes</h3>
        <Flame className="h-5 w-5 text-orange-500" />
      </div>
      <div className="space-y-3">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: habit.color || "#6b7280" }}
              />
              <span className="text-sm font-medium">{habit.name}</span>
              {habit.completedToday && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-bold">{habit.currentStreak}</span>
              </div>
              {habit.currentStreak === habit.longestStreak && habit.currentStreak > 0 && (
                <Trophy className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
