"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  Check,
  SkipForward,
  RotateCcw,
  Clock,
  Coffee,
  Zap,
  Plus,
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";
import { trpc } from "@/infrastructure/trpc/client";

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

type PresetKey = "pomodoro_25_5" | "pomodoro_50_10" | "deep_90" | "custom";
type PomodoroState = "work" | "shortBreak";

interface Preset {
  key: PresetKey;
  label: string;
  workMins: number;
  breakMins: number;
}

const PRESETS: Preset[] = [
  { key: "pomodoro_25_5", label: "Pomodoro 25/5", workMins: 25, breakMins: 5 },
  { key: "pomodoro_50_10", label: "Pomodoro 50/10", workMins: 50, breakMins: 10 },
  { key: "deep_90", label: "Deep Work 90", workMins: 90, breakMins: 15 },
];

export function FocusMode({
  task,
  nextTask,
  onComplete,
  onSkip,
  onClose,
  onAddTime,
}: FocusModeProps) {
  const [presetKey, setPresetKey] = useState<PresetKey>("pomodoro_25_5");
  const [customWorkMins, setCustomWorkMins] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>("work");
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [quickNote, setQuickNote] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interruptions, setInterruptions] = useState(0);
  const sessionIdRef = useRef<string | null>(null);

  const startMutation = trpc.focusSession.start.useMutation();
  const stopMutation = trpc.focusSession.stop.useMutation();
  const pauseMutation = trpc.focusSession.pause.useMutation();

  const activePreset: Preset =
    presetKey === "custom"
      ? { key: "custom", label: "Custom", workMins: customWorkMins, breakMins: 5 }
      : PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0];

  const getDuration = (state: PomodoroState) => {
    return (state === "work" ? activePreset.workMins : activePreset.breakMins) * 60;
  };

  const remainingSeconds = getDuration(pomodoroState) - elapsedSeconds;
  const progress = (elapsedSeconds / getDuration(pomodoroState)) * 100;

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else if (remainingSeconds <= 0 && isRunning) {
      setIsRunning(false);
      if (pomodoroState === "work") {
        setPomodorosCompleted((p) => p + 1);
        // Persist completed work session
        const sid = sessionIdRef.current;
        if (sid) {
          stopMutation.mutate({
            sessionId: sid,
            completed: true,
            interruptions,
          });
          sessionIdRef.current = null;
          setSessionId(null);
          setInterruptions(0);
        }
        setPomodoroState("shortBreak");
      } else {
        setPomodoroState("work");
      }
      setElapsedSeconds(0);
      if (typeof window !== "undefined") {
        new Audio("/notification.mp3").play().catch(() => {});
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds, pomodoroState, interruptions, stopMutation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = async () => {
    if (!isRunning) {
      // Starting
      if (pomodoroState === "work" && !sessionIdRef.current) {
        try {
          const created = await startMutation.mutateAsync({
            taskId: task.id,
            plannedMins: activePreset.workMins,
            preset: activePreset.key,
          });
          sessionIdRef.current = created.id;
          setSessionId(created.id);
        } catch {
          // proceed even if persistence fails
        }
      }
      setIsRunning(true);
    } else {
      // Pausing
      setIsRunning(false);
      setInterruptions((i) => i + 1);
      const sid = sessionIdRef.current;
      if (sid) {
        pauseMutation.mutate({ sessionId: sid });
      }
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    const sid = sessionIdRef.current;
    if (sid) {
      stopMutation.mutate({
        sessionId: sid,
        completed: false,
        interruptions,
      });
      sessionIdRef.current = null;
      setSessionId(null);
      setInterruptions(0);
    }
  };

  const skipBreak = () => {
    setPomodoroState("work");
    setElapsedSeconds(0);
    setIsRunning(false);
  };

  const handleClose = () => {
    const sid = sessionIdRef.current;
    if (sid) {
      stopMutation.mutate({
        sessionId: sid,
        completed: false,
        interruptions,
      });
    }
    onClose();
  };

  const handleComplete = () => {
    const sid = sessionIdRef.current;
    if (sid) {
      stopMutation.mutate({
        sessionId: sid,
        completed: true,
        interruptions,
      });
    }
    onComplete(task.id);
  };

  const getStateLabel = (state: PomodoroState) => {
    return state === "work" ? "Focus" : "Pause";
  };
  const getStateColor = (state: PomodoroState) => {
    return state === "work" ? "text-violet-500" : "text-green-500";
  };

  const handlePresetChange = (key: PresetKey) => {
    if (isRunning) return;
    setPresetKey(key);
    setElapsedSeconds(0);
    setPomodoroState("work");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 border-b">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-semibold">Mode Focus</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* Preset selector */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-4 border-b">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePresetChange(p.key)}
            disabled={isRunning}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              presetKey === p.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted",
              isRunning && "opacity-50 cursor-not-allowed"
            )}
          >
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePresetChange("custom")}
            disabled={isRunning}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              presetKey === "custom"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted",
              isRunning && "opacity-50 cursor-not-allowed"
            )}
          >
            Custom
          </button>
          {presetKey === "custom" && (
            <input
              type="number"
              min={1}
              max={240}
              value={customWorkMins}
              onChange={(e) =>
                setCustomWorkMins(Math.max(1, Math.min(240, Number(e.target.value) || 1)))
              }
              disabled={isRunning}
              className="w-16 px-2 py-1 rounded border bg-background text-xs"
            />
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-2xl mx-auto w-full">
        {/* Pomodoro indicator */}
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-3 w-3 rounded-full transition-colors",
                i < pomodorosCompleted % 4 ? "bg-primary" : "bg-muted"
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
            <span
              className={cn(
                "text-4xl md:text-5xl font-mono font-bold",
                isRunning && "text-primary"
              )}
            >
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
            onClick={handleComplete}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-5 w-5 mr-2" />
            Terminer la tâche
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

        {sessionId && (
          <div className="text-xs text-muted-foreground mt-3">
            Session active · {interruptions} interruption{interruptions !== 1 ? "s" : ""}
          </div>
        )}
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
