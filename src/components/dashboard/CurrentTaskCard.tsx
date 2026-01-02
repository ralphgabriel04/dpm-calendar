"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Check, SkipForward, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  plannedDuration?: number | null;
  priority: string;
  status: string;
}

interface CurrentTaskCardProps {
  task: Task | null;
  nextTask?: Task | null;
  onComplete?: (taskId: string) => void;
  onSkip?: (taskId: string) => void;
  onStartFocus?: (taskId: string) => void;
  className?: string;
}

export function CurrentTaskCard({
  task,
  nextTask,
  onComplete,
  onSkip,
  onStartFocus,
  className,
}: CurrentTaskCardProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Reset timer when task changes
  useEffect(() => {
    setElapsedSeconds(0);
    setIsTimerRunning(false);
  }, [task?.id]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "text-red-500";
      case "HIGH": return "text-orange-500";
      case "MEDIUM": return "text-yellow-500";
      default: return "text-green-500";
    }
  };

  if (!task) {
    return (
      <div className={cn(
        "rounded-2xl border-2 border-dashed border-muted-foreground/20 p-6 md:p-8",
        "flex flex-col items-center justify-center text-center",
        className
      )}>
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-muted-foreground">
          Aucune tache en cours
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Toutes vos taches sont terminees ou planifiez-en une nouvelle
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl border bg-card overflow-hidden",
      "shadow-lg shadow-primary/5",
      className
    )}>
      {/* Main task area */}
      <div className="p-4 md:p-6 space-y-4">
        {/* Priority badge */}
        <div className="flex items-center justify-between">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            "bg-primary/10 text-primary"
          )}>
            <Zap className="h-3 w-3" />
            Tache actuelle
          </div>
          {task.plannedDuration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {task.plannedDuration} min
            </div>
          )}
        </div>

        {/* Task title */}
        <h2 className="text-xl md:text-2xl font-semibold leading-tight">
          {task.title}
        </h2>

        {/* Description if exists */}
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Timer display */}
        <div className="flex items-center justify-center py-4 md:py-6">
          <div className={cn(
            "text-4xl md:text-5xl font-mono font-bold tracking-wider",
            isTimerRunning ? "text-primary" : "text-foreground"
          )}>
            {formatTimer(elapsedSeconds)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
          <Button
            variant={isTimerRunning ? "outline" : "default"}
            size="lg"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="flex-1 sm:flex-none sm:min-w-[120px]"
          >
            {isTimerRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {elapsedSeconds > 0 ? "Reprendre" : "Demarrer"}
              </>
            )}
          </Button>

          <Button
            variant="default"
            size="lg"
            onClick={() => onComplete?.(task.id)}
            className="flex-1 sm:flex-none sm:min-w-[120px] bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Terminer
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => onSkip?.(task.id)}
            className="flex-1 sm:flex-none"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Passer
          </Button>
        </div>
      </div>

      {/* Next task preview */}
      {nextTask && (
        <div className="border-t bg-muted/30 px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SkipForward className="h-4 w-4" />
              <span>Suivant:</span>
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {nextTask.title}
              </span>
            </div>
            {nextTask.plannedDuration && (
              <span className="text-xs text-muted-foreground">
                {nextTask.plannedDuration} min
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
