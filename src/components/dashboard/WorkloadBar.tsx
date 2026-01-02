"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle2, Calendar } from "lucide-react";

interface WorkloadBarProps {
  plannedMinutes: number;
  completedMinutes: number;
  meetingMinutes: number;
  availableMinutes?: number; // Default 8h = 480 min
  className?: string;
}

export function WorkloadBar({
  plannedMinutes,
  completedMinutes,
  meetingMinutes,
  availableMinutes = 480,
  className,
}: WorkloadBarProps) {
  const totalPlanned = plannedMinutes + meetingMinutes;
  const percentage = Math.min((totalPlanned / availableMinutes) * 100, 100);
  const completedPercentage = Math.min((completedMinutes / availableMinutes) * 100, 100);
  const meetingPercentage = Math.min((meetingMinutes / availableMinutes) * 100, 100);
  const taskPercentage = Math.min(((plannedMinutes - completedMinutes) / availableMinutes) * 100, 100 - meetingPercentage - completedPercentage);

  const isOverloaded = totalPlanned > availableMinutes * 1.2;
  const isNearCapacity = totalPlanned > availableMinutes * 0.9 && !isOverloaded;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header with time info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {formatTime(totalPlanned)} / {formatTime(availableMinutes)}
          </span>
          <span className="text-muted-foreground">
            ({Math.round(percentage)}%)
          </span>
        </div>
        {isOverloaded && (
          <div className="flex items-center gap-1 text-destructive text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Surcharge</span>
          </div>
        )}
        {isNearCapacity && !isOverloaded && (
          <div className="flex items-center gap-1 text-amber-500 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Presque plein</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        {/* Completed segment */}
        <div
          className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
          style={{ width: `${completedPercentage}%` }}
        />
        {/* In progress tasks segment */}
        <div
          className="absolute top-0 h-full bg-violet-500 transition-all duration-500"
          style={{
            left: `${completedPercentage}%`,
            width: `${Math.max(0, taskPercentage)}%`
          }}
        />
        {/* Meetings segment */}
        <div
          className="absolute top-0 h-full bg-blue-500 transition-all duration-500"
          style={{
            left: `${completedPercentage + Math.max(0, taskPercentage)}%`,
            width: `${meetingPercentage}%`
          }}
        />
        {/* Overload indicator */}
        {isOverloaded && (
          <div className="absolute right-0 top-0 h-full w-1 bg-destructive animate-pulse" />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>Complete ({formatTime(completedMinutes)})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-violet-500" />
          <span>Taches ({formatTime(Math.max(0, plannedMinutes - completedMinutes))})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span>Reunions ({formatTime(meetingMinutes)})</span>
        </div>
      </div>
    </div>
  );
}

// Compact version for sidebar
export function WorkloadBarCompact({
  plannedMinutes,
  completedMinutes,
  meetingMinutes,
  availableMinutes = 480,
  className,
}: WorkloadBarProps) {
  const totalPlanned = plannedMinutes + meetingMinutes;
  const percentage = Math.min((totalPlanned / availableMinutes) * 100, 100);
  const completedPercentage = Math.min((completedMinutes / availableMinutes) * 100, 100);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}`;
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Charge</span>
        <span className="font-medium">{formatTime(totalPlanned)}</span>
      </div>
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-green-500 transition-all"
          style={{ width: `${completedPercentage}%` }}
        />
        <div
          className="absolute top-0 h-full bg-violet-500 transition-all"
          style={{
            left: `${completedPercentage}%`,
            width: `${percentage - completedPercentage}%`
          }}
        />
      </div>
    </div>
  );
}
