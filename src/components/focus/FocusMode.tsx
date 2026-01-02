"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  Check,
  SkipForward,
  RotateCcw,
  Clock,
  Timer,
  Coffee,
  Zap,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  plannedDuration?: number | null;
  priority: string;
}

interface FocusModeProps {
  task: Task;
  nextTask?: Task | null;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
  onClose: () => void;
  onAddTime?: (taskId: string, minutes: number) => void;
}

type PomodoroState = "work" | "shortBreak" | "longBreak";

export function FocusMode({
  task,
  nextTask,
  onComplete,
  onSkip,
  onClose,
  onAddTime,
}: FocusModeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>("work");
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [quickNote, setQuickNote] = useState("");

  // Pomodoro settings (in minutes)
  const WORK_DURATION = 25;
  const SHORT_BREAK = 5;
  const LONG_BREAK = 15;
  const POMODOROS_BEFORE_LONG_BREAK = 4;

  const getDuration = (state: PomodoroState) => {
    switch (state) {
      case "work":
        return WORK_DURATION * 60;
      case "shortBreak":
        return SHORT_BREAK * 60;
      case "longBreak":
        return LONG_BREAK * 60;
    }
  };

  const remainingSeconds = getDuration(pomodoroState) - elapsedSeconds;
  const progress = (elapsedSeconds / getDuration(pomodoroState)) * 100;

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else if (remainingSeconds <= 0 && isRunning) {
      // Pomodoro completed
      setIsRunning(false);
      if (pomodoroState === "work") {
        setPomodorosCompleted((p) => p + 1);
        // Determine next break
        if ((pomodorosCompleted + 1) % POMODOROS_BEFORE_LONG_BREAK === 0) {
          setPomodoroState("longBreak");
        } else {
          setPomodoroState("shortBreak");
        }
      } else {
        setPomodoroState("work");
      }
      setElapsedSeconds(0);
      // Play notification sound
      if (typeof window !== "undefined" && "Notification" in window) {
        new Audio("/notification.mp3").play().catch(() => {});
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds, pomodoroState, pomodorosCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  const skipBreak = () => {
    setPomodoroState("work");
    setElapsedSeconds(0);
    setIsRunning(false);
  };

  const getStateLabel = (state: PomodoroState) => {
    switch (state) {
      case "work":
        return "Focus";
      case "shortBreak":
        return "Pause courte";
      case "longBreak":
        return "Pause longue";
    }
  };

  const getStateColor = (state: PomodoroState) => {
    switch (state) {
      case "work":
        return "text-violet-500";
      case "shortBreak":
        return "text-green-500";
      case "longBreak":
        return "text-blue-500";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 border-b">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-semibold">Mode Focus</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-2xl mx-auto w-full">
        {/* Pomodoro indicator */}
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: POMODOROS_BEFORE_LONG_BREAK }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-3 w-3 rounded-full transition-colors",
                i < pomodorosCompleted ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* State label */}
        <div className={cn("text-lg font-medium mb-4", getStateColor(pomodoroState))}>
          {pomodoroState !== "work" && <Coffee className="h-5 w-5 inline mr-2" />}
          {getStateLabel(pomodoroState)}
        </div>

        {/* Task title */}
        <h1 className="text-2xl md:text-4xl font-bold text-center mb-8 px-4">
          {task.title}
        </h1>

        {/* Timer circle */}
        <div className="relative mb-8">
          <svg className="w-48 h-48 md:w-64 md:h-64 -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000",
                pomodoroState === "work" ? "text-violet-500" : "text-green-500"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-4xl md:text-5xl font-mono font-bold",
              isRunning && "text-primary"
            )}>
              {formatTime(remainingSeconds)}
            </span>
            <span className="text-sm text-muted-foreground mt-2">
              {pomodoroState === "work" ? "restant" : "de pause"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={resetTimer}
            className="h-12 w-12 rounded-full p-0"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            size="lg"
            onClick={toggleTimer}
            className={cn(
              "h-16 w-16 rounded-full p-0",
              pomodoroState !== "work" && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isRunning ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>

          {pomodoroState !== "work" ? (
            <Button
              variant="outline"
              size="lg"
              onClick={skipBreak}
              className="h-12 w-12 rounded-full p-0"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={() => onAddTime?.(task.id, 15)}
              className="h-12 w-12 rounded-full p-0"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-md">
          <Button
            variant="default"
            size="lg"
            onClick={() => onComplete(task.id)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-5 w-5 mr-2" />
            Terminer la tache
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onSkip(task.id)}
            className="flex-1"
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Passer
          </Button>
        </div>

        {/* Quick note */}
        <div className="w-full max-w-md mt-8">
          <textarea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Notes rapides..."
            className={cn(
              "w-full h-24 p-3 rounded-lg border bg-muted/50 resize-none",
              "text-sm placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20"
            )}
          />
        </div>
      </main>

      {/* Footer - Next task */}
      {nextTask && (
        <footer className="border-t p-4 md:p-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SkipForward className="h-4 w-4" />
              <span>Suivant:</span>
              <span className="font-medium text-foreground">{nextTask.title}</span>
            </div>
            {nextTask.plannedDuration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {nextTask.plannedDuration} min
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
