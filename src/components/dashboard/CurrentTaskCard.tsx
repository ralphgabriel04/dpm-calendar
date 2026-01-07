"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, Check, SkipForward, Clock, Zap, Timer, ChevronDown, RotateCcw, Coffee, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  allTasks?: Task[];
  onComplete?: (taskId: string) => void;
  onSkip?: (taskId: string) => void;
  onSelectTask?: (taskId: string) => void;
  onStartFocus?: (taskId: string) => void;
  className?: string;
}

// Default Pomodoro settings (in seconds)
const DEFAULT_POMODORO_WORK = 25 * 60; // 25 minutes
const DEFAULT_POMODORO_SHORT_BREAK = 5 * 60; // 5 minutes
const DEFAULT_POMODORO_LONG_BREAK = 15 * 60; // 15 minutes

type TimerMode = "normal" | "pomodoro";
type PomodoroPhase = "work" | "shortBreak" | "longBreak";

// LocalStorage key for timer persistence
const TIMER_STORAGE_KEY = "dpm-current-task-timer";

interface TimerState {
  taskId: string;
  elapsedSeconds: number;
  isRunning: boolean;
  mode: TimerMode;
  pomodoroPhase: PomodoroPhase;
  pomodoroCount: number;
  pomodoroTimeLeft: number;
  pomodoroWorkDuration: number;
  pomodoroShortBreakDuration: number;
  pomodoroLongBreakDuration: number;
}

export function CurrentTaskCard({
  task,
  nextTask,
  allTasks = [],
  onComplete,
  onSkip,
  onSelectTask,
  onStartFocus,
  className,
}: CurrentTaskCardProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerMode, setTimerMode] = useState<TimerMode>("normal");
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("work");
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(DEFAULT_POMODORO_WORK);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Custom Pomodoro durations (in seconds)
  const [pomodoroWorkDuration, setPomodoroWorkDuration] = useState(DEFAULT_POMODORO_WORK);
  const [pomodoroShortBreakDuration, setPomodoroShortBreakDuration] = useState(DEFAULT_POMODORO_SHORT_BREAK);
  const [pomodoroLongBreakDuration, setPomodoroLongBreakDuration] = useState(DEFAULT_POMODORO_LONG_BREAK);

  // Timer editing state
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editMinutes, setEditMinutes] = useState(25);
  const timerEditRef = useRef<HTMLDivElement>(null);

  // Load timer state from localStorage on mount
  useEffect(() => {
    if (!task) return;

    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      try {
        const state: TimerState = JSON.parse(saved);
        if (state.taskId === task.id) {
          setElapsedSeconds(state.elapsedSeconds);
          setIsTimerRunning(state.isRunning);
          setTimerMode(state.mode);
          setPomodoroPhase(state.pomodoroPhase);
          setPomodoroCount(state.pomodoroCount);
          setPomodoroTimeLeft(state.pomodoroTimeLeft);
          // Load custom durations
          if (state.pomodoroWorkDuration) setPomodoroWorkDuration(state.pomodoroWorkDuration);
          if (state.pomodoroShortBreakDuration) setPomodoroShortBreakDuration(state.pomodoroShortBreakDuration);
          if (state.pomodoroLongBreakDuration) setPomodoroLongBreakDuration(state.pomodoroLongBreakDuration);
        } else {
          // Different task, reset but don't clear other task's data
          setElapsedSeconds(0);
          setIsTimerRunning(false);
        }
      } catch (e) {
        console.error("Failed to parse timer state", e);
      }
    }
    setInitialized(true);
  }, [task?.id]);

  // Save timer state to localStorage
  useEffect(() => {
    if (!task || !initialized) return;

    const state: TimerState = {
      taskId: task.id,
      elapsedSeconds,
      isRunning: isTimerRunning,
      mode: timerMode,
      pomodoroPhase,
      pomodoroCount,
      pomodoroTimeLeft,
      pomodoroWorkDuration,
      pomodoroShortBreakDuration,
      pomodoroLongBreakDuration,
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  }, [task?.id, elapsedSeconds, isTimerRunning, timerMode, pomodoroPhase, pomodoroCount, pomodoroTimeLeft, pomodoroWorkDuration, pomodoroShortBreakDuration, pomodoroLongBreakDuration, initialized]);

  // Click outside handler to close timer editor
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timerEditRef.current && !timerEditRef.current.contains(event.target as Node)) {
        setIsEditingTimer(false);
      }
    };

    if (isEditingTimer) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingTimer]);

  // Normal timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerMode === "normal") {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerMode]);

  // Pomodoro timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerMode === "pomodoro") {
      interval = setInterval(() => {
        setPomodoroTimeLeft((time) => {
          if (time <= 1) {
            // Timer finished - will be handled in next effect
            return 0;
          }
          return time - 1;
        });
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerMode]);

  // Handle pomodoro completion
  useEffect(() => {
    if (timerMode === "pomodoro" && pomodoroTimeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);

      // Play notification sound and show notification
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(pomodoroPhase === "work" ? "Pause !" : "Retour au travail !", {
            body: pomodoroPhase === "work"
              ? "Bon travail ! Prends une pause."
              : "La pause est terminée. C'est reparti !",
          });
        }
      }

      if (pomodoroPhase === "work") {
        const newCount = pomodoroCount + 1;
        setPomodoroCount(newCount);
        // After 4 pomodoros, take a long break
        if (newCount % 4 === 0) {
          setPomodoroPhase("longBreak");
          setPomodoroTimeLeft(pomodoroLongBreakDuration);
        } else {
          setPomodoroPhase("shortBreak");
          setPomodoroTimeLeft(pomodoroShortBreakDuration);
        }
      } else {
        setPomodoroPhase("work");
        setPomodoroTimeLeft(pomodoroWorkDuration);
      }
    }
  }, [pomodoroTimeLeft, isTimerRunning, timerMode, pomodoroPhase, pomodoroCount, pomodoroWorkDuration, pomodoroShortBreakDuration, pomodoroLongBreakDuration]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const resetTimer = () => {
    setElapsedSeconds(0);
    setIsTimerRunning(false);
    setPomodoroPhase("work");
    setPomodoroTimeLeft(pomodoroWorkDuration);
    setPomodoroCount(0);
  };

  const toggleTimerMode = () => {
    const newMode = timerMode === "normal" ? "pomodoro" : "normal";
    setTimerMode(newMode);
    if (newMode === "pomodoro") {
      setPomodoroPhase("work");
      setPomodoroTimeLeft(pomodoroWorkDuration);
    }
    setIsTimerRunning(false);
  };

  // Open timer editor
  const openTimerEditor = () => {
    if (timerMode === "pomodoro" && !isTimerRunning) {
      const currentDuration = pomodoroPhase === "work"
        ? pomodoroWorkDuration
        : pomodoroPhase === "shortBreak"
          ? pomodoroShortBreakDuration
          : pomodoroLongBreakDuration;
      setEditMinutes(Math.floor(currentDuration / 60));
      setIsEditingTimer(true);
    }
  };

  // Save timer duration
  const saveTimerDuration = () => {
    const newSeconds = editMinutes * 60;
    if (pomodoroPhase === "work") {
      setPomodoroWorkDuration(newSeconds);
      setPomodoroTimeLeft(newSeconds);
    } else if (pomodoroPhase === "shortBreak") {
      setPomodoroShortBreakDuration(newSeconds);
      setPomodoroTimeLeft(newSeconds);
    } else {
      setPomodoroLongBreakDuration(newSeconds);
      setPomodoroTimeLeft(newSeconds);
    }
    setIsEditingTimer(false);
  };

  // Adjust timer duration quickly
  const adjustTimerDuration = (delta: number) => {
    const newMinutes = Math.max(1, editMinutes + delta);
    setEditMinutes(newMinutes);
  };

  const handleTaskSelect = (taskId: string) => {
    setShowTaskSelector(false);
    onSelectTask?.(taskId);
  };

  const handleComplete = () => {
    if (task) {
      // Clear timer state when completing
      localStorage.removeItem(TIMER_STORAGE_KEY);
      setElapsedSeconds(0);
      setIsTimerRunning(false);
      onComplete?.(task.id);
    }
  };

  // Available tasks for selection (excluding current and completed)
  const selectableTasks = allTasks.filter(
    (t) => t.id !== task?.id && t.status !== "DONE" && t.status !== "CANCELLED"
  );

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
          Aucune tâche en cours
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Toutes vos tâches sont terminées ou planifiez-en une nouvelle
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
        {/* Header with badge and timer mode */}
        <div className="flex items-center justify-between">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            "bg-primary/10 text-primary"
          )}>
            <Zap className="h-3 w-3" />
            Tâche actuelle
          </div>
          <div className="flex items-center gap-2">
            {/* Timer mode toggle */}
            <button
              onClick={toggleTimerMode}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                timerMode === "pomodoro"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
              title={timerMode === "pomodoro" ? "Mode Pomodoro actif" : "Activer Pomodoro"}
            >
              <Timer className="h-3 w-3" />
              {timerMode === "pomodoro" ? "Pomodoro" : "Normal"}
            </button>
            {task.plannedDuration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {task.plannedDuration} min
              </div>
            )}
          </div>
        </div>

        {/* Task title with dropdown */}
        <div className="relative">
          <button
            onClick={() => selectableTasks.length > 0 && setShowTaskSelector(!showTaskSelector)}
            className="w-full text-left flex items-center gap-2 group"
          >
            <h2 className="text-xl md:text-2xl font-semibold leading-tight flex-1">
              {task.title}
            </h2>
            {selectableTasks.length > 0 && (
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                showTaskSelector && "rotate-180"
              )} />
            )}
          </button>

          {/* Task selector dropdown */}
          {showTaskSelector && selectableTasks.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-10 rounded-xl border bg-card shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b text-xs text-muted-foreground">
                Changer de tâche
              </div>
              {selectableTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTaskSelect(t.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    t.priority === "URGENT" && "bg-red-500",
                    t.priority === "HIGH" && "bg-orange-500",
                    t.priority === "MEDIUM" && "bg-yellow-500",
                    t.priority === "LOW" && "bg-green-500"
                  )} />
                  <span className="text-sm flex-1 truncate">{t.title}</span>
                  {t.plannedDuration && (
                    <span className="text-xs text-muted-foreground">
                      {t.plannedDuration}m
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description if exists */}
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Pomodoro phase indicator */}
        {timerMode === "pomodoro" && (
          <div className="flex items-center justify-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              pomodoroPhase === "work" && "bg-red-500/10 text-red-500",
              pomodoroPhase === "shortBreak" && "bg-green-500/10 text-green-500",
              pomodoroPhase === "longBreak" && "bg-blue-500/10 text-blue-500"
            )}>
              {pomodoroPhase === "work" && <Zap className="h-4 w-4" />}
              {pomodoroPhase !== "work" && <Coffee className="h-4 w-4" />}
              {pomodoroPhase === "work" && "Travail"}
              {pomodoroPhase === "shortBreak" && "Pause courte"}
              {pomodoroPhase === "longBreak" && "Pause longue"}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full",
                    i <= (pomodoroCount % 4 || (pomodoroCount > 0 && pomodoroCount % 4 === 0 ? 4 : 0))
                      ? "bg-red-500"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Timer display */}
        <div className="flex items-center justify-center py-4 md:py-6 relative">
          <div ref={timerEditRef} className="relative">
            <button
              onClick={openTimerEditor}
              disabled={timerMode !== "pomodoro" || isTimerRunning}
              className={cn(
                "text-4xl md:text-5xl font-mono font-bold tracking-wider px-4 py-2 rounded-lg transition-colors",
                isTimerRunning && timerMode === "normal" && "text-primary",
                isTimerRunning && timerMode === "pomodoro" && pomodoroPhase === "work" && "text-red-500",
                isTimerRunning && timerMode === "pomodoro" && pomodoroPhase !== "work" && "text-green-500",
                !isTimerRunning && "text-foreground",
                timerMode === "pomodoro" && !isTimerRunning && "hover:bg-muted/50 cursor-pointer",
                timerMode === "pomodoro" && !isTimerRunning && "border-2 border-dashed border-muted-foreground/20"
              )}
              title={timerMode === "pomodoro" && !isTimerRunning ? "Cliquez pour modifier la durée" : undefined}
            >
              {timerMode === "pomodoro" ? formatTimer(pomodoroTimeLeft) : formatTimer(elapsedSeconds)}
            </button>

            {/* Timer duration editor modal - fixed centered on screen */}
            {isEditingTimer && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/50 z-[100]"
                  onClick={() => setIsEditingTimer(false)}
                />
                {/* Modal */}
                <div
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-xl shadow-2xl p-6 z-[101] min-w-[320px]"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-lg font-semibold mb-4 text-center">
                    Modifier la durée
                  </div>
                  <div className="text-sm text-muted-foreground mb-4 text-center">
                    {pomodoroPhase === "work" ? "Phase de travail" : pomodoroPhase === "shortBreak" ? "Pause courte" : "Pause longue"}
                  </div>

                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => adjustTimerDuration(-5)}
                      className="h-12 w-12"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="120"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 h-14 text-center text-3xl font-mono font-bold"
                      />
                      <span className="text-lg text-muted-foreground">min</span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => adjustTimerDuration(5)}
                      className="h-12 w-12"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {[5, 10, 15, 20, 25, 30, 45, 60].map((mins) => (
                      <button
                        type="button"
                        key={mins}
                        onClick={() => setEditMinutes(mins)}
                        className={cn(
                          "px-4 py-2 text-sm rounded-full transition-colors",
                          editMinutes === mins
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingTimer(false)}
                      className="flex-1 h-12"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      onClick={saveTimerDuration}
                      className="flex-1 h-12"
                    >
                      Appliquer
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Total time in pomodoro mode */}
        {timerMode === "pomodoro" && elapsedSeconds > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Temps total: {formatTimer(elapsedSeconds)}
          </div>
        )}

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
                {elapsedSeconds > 0 ? "Reprendre" : "Démarrer"}
              </>
            )}
          </Button>

          <Button
            variant="default"
            size="lg"
            onClick={handleComplete}
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

          <Button
            variant="ghost"
            size="icon"
            onClick={resetTimer}
            title="Réinitialiser le timer"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Next task preview - now clickable */}
      {nextTask && (
        <button
          onClick={() => onSelectTask?.(nextTask.id)}
          className="w-full border-t bg-muted/30 px-4 md:px-6 py-3 hover:bg-muted/50 transition-colors text-left"
        >
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
        </button>
      )}
    </div>
  );
}
