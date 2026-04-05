"use client";

import { CheckCircle2, Circle, Clock, Calendar, Target, Flame } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface DailyOverviewProps {
  totalTasks: number;
  completedTasks: number;
  meetings: number;
  focusTimeMinutes: number;
  habitsCompleted?: number;
  habitsTotal?: number;
  className?: string;
}

export function DailyOverview({
  totalTasks,
  completedTasks,
  meetings,
  focusTimeMinutes,
  habitsCompleted = 0,
  habitsTotal = 0,
  className,
}: DailyOverviewProps) {
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const habitProgress = habitsTotal > 0 ? Math.round((habitsCompleted / habitsTotal) * 100) : 0;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const stats = [
    {
      label: "Tâches",
      value: `${completedTasks}/${totalTasks}`,
      progress: taskProgress,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500",
    },
    {
      label: "Réunions",
      value: meetings.toString(),
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500",
    },
    {
      label: "Focus",
      value: formatTime(focusTimeMinutes),
      icon: Target,
      color: "text-violet-500",
      bgColor: "bg-violet-500",
    },
    ...(habitsTotal > 0 ? [{
      label: "Habitudes",
      value: `${habitsCompleted}/${habitsTotal}`,
      progress: habitProgress,
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500",
    }] : []),
  ];

  return (
    <div className={cn(
      "grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4",
      className
    )}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border bg-card p-3 md:p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted-foreground">
              {stat.label}
            </span>
            <stat.icon className={cn("h-4 w-4", stat.color)} />
          </div>
          <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
          {stat.progress !== undefined && (
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", stat.bgColor)}
                style={{ width: `${stat.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Mini timeline for upcoming events
interface TimelineEvent {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  type: "event" | "task" | "focus";
}

interface MiniTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function MiniTimeline({ events, className }: MiniTimelineProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeStyles = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "event":
        return "border-l-blue-500 bg-blue-500/5";
      case "task":
        return "border-l-violet-500 bg-violet-500/5";
      case "focus":
        return "border-l-green-500 bg-green-500/5";
    }
  };

  if (events.length === 0) {
    return (
      <div className={cn("text-center py-6 text-muted-foreground", className)}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucun événement à venir</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {events.slice(0, 5).map((event) => (
        <div
          key={event.id}
          className={cn(
            "rounded-lg border-l-4 px-3 py-2",
            getTypeStyles(event.type)
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">{event.title}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(event.startAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Quick actions component
interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "primary";
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "transition-colors",
            action.variant === "primary"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </button>
      ))}
    </div>
  );
}
