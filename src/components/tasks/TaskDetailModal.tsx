"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, addDays, addWeeks, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import {
  X,
  Play,
  Pause,
  Square,
  Plus,
  Check,
  Circle,
  Calendar as CalendarIcon,
  Clock,
  Timer,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Hash,
  Archive,
  CalendarPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DayView } from "@/components/calendar";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  actualTime: number; // in seconds
  plannedTime: number; // in seconds
  isRunning: boolean;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string;
    channel?: string;
    plannedDuration?: number; // in minutes
    actualDuration?: number; // in minutes
    dueAt?: Date;
    startAt?: Date;
    subtasks?: SubTask[];
  };
  events?: CalendarEvent[];
  onUpdate?: (taskId: string, data: Partial<TaskDetailModalProps["task"]>) => void;
  onSnooze?: (taskId: string) => void;
  onMoveToNextWeek?: (taskId: string) => void;
  onMoveToBacklog?: (taskId: string) => void;
}

// Format time from seconds to MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Format minutes to display format
function formatMinutes(minutes: number): string {
  if (minutes < 60) return `0:${minutes.toString().padStart(2, "0")}`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}:${mins.toString().padStart(2, "0")}`;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  events = [],
  onUpdate,
  onSnooze,
  onMoveToNextWeek,
  onMoveToBacklog,
}: TaskDetailModalProps) {
  // View state
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<"focus" | "pomodoro">("focus");
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(task.startAt || new Date());

  // Subtasks state
  const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Timer state
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pomodoro state
  const [pomodoroSession, setPomodoroSession] = useState(25); // minutes
  const [pomodoroRemaining, setPomodoroRemaining] = useState(25 * 60); // seconds
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);

  // Calculate totals
  const totalPlanned = (task.plannedDuration || 0) * 60; // convert to seconds
  const totalActual = subtasks.reduce((acc, st) => acc + st.actualTime, 0) + elapsedTime;

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // Pomodoro timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPomodoroRunning && pomodoroRemaining > 0) {
      interval = setInterval(() => {
        setPomodoroRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroRemaining]);

  // Start timer for a subtask
  const startTimer = useCallback((subtaskId?: string) => {
    setActiveSubtaskId(subtaskId || null);
    setIsTimerRunning(true);
    setElapsedTime(0);
  }, []);

  // Stop timer and save elapsed time
  const stopTimer = useCallback(() => {
    setIsTimerRunning(false);
    if (activeSubtaskId) {
      setSubtasks((prev) =>
        prev.map((st) =>
          st.id === activeSubtaskId
            ? { ...st, actualTime: st.actualTime + elapsedTime }
            : st
        )
      );
    }
    setElapsedTime(0);
    setActiveSubtaskId(null);
  }, [activeSubtaskId, elapsedTime]);

  // Add subtask
  const addSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: SubTask = {
      id: `subtask-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      actualTime: 0,
      plannedTime: 0,
      isRunning: false,
    };
    setSubtasks((prev) => [...prev, newSubtask]);
    setNewSubtaskTitle("");
  }, [newSubtaskTitle]);

  // Toggle subtask completion
  const toggleSubtask = useCallback((subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    );
  }, []);

  // Adjust pomodoro session time
  const adjustPomodoroSession = useCallback((delta: number) => {
    setPomodoroSession((prev) => Math.max(5, prev + delta));
    setPomodoroRemaining((prev) => Math.max(5 * 60, prev + delta * 60));
  }, []);

  // Date picker navigation
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  if (!isOpen) return null;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of month
    const startDay = firstDay.getDay() || 7; // Convert Sunday (0) to 7
    for (let i = 1; i < startDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-card rounded-lg shadow-2xl transition-all duration-300 flex",
          isExpanded ? "w-[90vw] h-[80vh]" : "w-[600px] max-h-[80vh]"
        )}
      >
        {/* Main Content */}
        <div className={cn("flex-1 flex flex-col overflow-hidden", isExpanded && "max-w-[600px]")}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase">Channel</span>
              <span className="flex items-center gap-1 text-sm">
                <Hash className="h-3 w-3" />
                {task.channel || "work"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">START</span>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="hover:text-primary"
                >
                  Today
                </button>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  Due
                </button>
                <button className="text-muted-foreground hover:text-foreground">
                  + Subtasks
                </button>
              </div>

              <button
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                className="p-1 hover:bg-accent rounded"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-accent rounded"
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>

              <button onClick={onClose} className="p-1 hover:bg-accent rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Move Menu Dropdown */}
            {showMoveMenu && (
              <div className="absolute right-16 top-12 bg-card border rounded-lg shadow-lg py-2 min-w-[200px] z-10">
                <div className="px-3 py-1 text-xs text-muted-foreground">Move:</div>
                <button
                  onClick={() => {
                    onSnooze?.(task.id);
                    setShowMoveMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                >
                  Snooze one day
                  <span className="text-muted-foreground">D</span>
                </button>
                <button
                  onClick={() => {
                    onMoveToNextWeek?.(task.id);
                    setShowMoveMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                >
                  Move to next week
                  <span className="text-muted-foreground">⇧ Z</span>
                </button>
                <button
                  onClick={() => {
                    onMoveToBacklog?.(task.id);
                    setShowMoveMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                >
                  Move to backlog
                  <span className="text-muted-foreground">Z</span>
                </button>

                <div className="border-t my-2" />

                <div className="px-3 py-1 text-xs text-muted-foreground">Start date:</div>
                {/* Mini Calendar */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setCalendarMonth(addDays(calendarMonth, -30))}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium">
                      {format(calendarMonth, "MMMM yyyy")}
                    </span>
                    <button
                      onClick={() => setCalendarMonth(addDays(calendarMonth, 30))}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                      <div key={i} className="text-center text-muted-foreground py-1">
                        {day}
                      </div>
                    ))}
                    {getDaysInMonth(calendarMonth).map((day, i) => (
                      <button
                        key={i}
                        onClick={() => day && setSelectedDate(day)}
                        disabled={!day}
                        className={cn(
                          "text-center py-1 rounded hover:bg-accent",
                          !day && "invisible",
                          day && selectedDate && day.toDateString() === selectedDate.toDateString() &&
                            "bg-primary text-primary-foreground"
                        )}
                      >
                        {day?.getDate()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2 px-4 py-2 border-b">
            <button
              onClick={() => setMode("focus")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md border transition-colors",
                mode === "focus"
                  ? "bg-card border-border"
                  : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-4 w-4 inline mr-1" />
              Focus
            </button>
            <button
              onClick={() => setMode("pomodoro")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md border transition-colors",
                mode === "pomodoro"
                  ? "bg-card border-border"
                  : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Timer className="h-4 w-4 inline mr-1" />
              Pomodoro
            </button>
          </div>

          {/* Task Content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Task Title */}
            <div className="flex items-start gap-3 mb-6">
              <button className="mt-1 h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex-shrink-0 hover:border-primary transition-colors" />
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{task.title}</h2>
              </div>

              {/* Timer Display */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase">
                    {mode === "focus" ? "ACTUAL" : "REMAINING"}
                  </div>
                  <div className="text-2xl font-mono">
                    {mode === "focus"
                      ? formatMinutes(Math.floor(totalActual / 60))
                      : formatTime(pomodoroRemaining)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase">
                    {mode === "focus" ? "PLANNED" : "SESSION"}
                  </div>
                  <div className="text-2xl font-mono">
                    {mode === "focus"
                      ? formatMinutes(task.plannedDuration || 0)
                      : formatMinutes(pomodoroSession)}
                  </div>
                  {mode === "pomodoro" && (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => adjustPomodoroSession(5)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        ↑5
                      </button>
                      <button
                        onClick={() => adjustPomodoroSession(-5)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        ↓5
                      </button>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => {
                    if (mode === "focus") {
                      isTimerRunning ? stopTimer() : startTimer();
                    } else {
                      setIsPomodoroRunning(!isPomodoroRunning);
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                >
                  {(mode === "focus" ? isTimerRunning : isPomodoroRunning) ? (
                    <>
                      <Pause className="h-4 w-4" />
                      PAUSE
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      START
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Subtasks */}
            <div className="space-y-2 mb-6">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-3 py-2 group"
                >
                  <button
                    onClick={() => toggleSubtask(subtask.id)}
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                      subtask.completed
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-muted-foreground/30 hover:border-primary"
                    )}
                  >
                    {subtask.completed && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      subtask.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {subtask.title}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(subtask.actualTime)}
                    </span>
                    <span className="text-xs text-muted-foreground">--:--</span>
                    {!subtask.completed && (
                      <button
                        onClick={() => startTimer(subtask.id)}
                        className="p-1 hover:bg-accent rounded"
                        title="Start timer for this subtask"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Subtask */}
              <div className="flex items-center gap-3 py-2">
                <button className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 flex-shrink-0 flex items-center justify-center">
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </button>
                <Input
                  placeholder="Add subtask"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                  className="flex-1 border-0 p-0 h-auto focus-visible:ring-0 text-sm text-muted-foreground"
                />
              </div>
            </div>

            {/* Task Description */}
            {task.description && (
              <div className="mb-6 p-4 rounded-lg bg-muted/30 border">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Description</h3>
                <MarkdownRenderer content={task.description} />
              </div>
            )}

            {/* Help Text */}
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Add a task:</h3>
                <p className="text-muted-foreground">
                  You&apos;ve already created your first task. You can add more with the keyboard
                  shortcut <kbd className="px-1 py-0.5 bg-muted rounded text-red-500">A</kbd> or by
                  clicking the &quot;Add Task&quot; button.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Complete daily planning:</h3>
                <p className="text-muted-foreground">
                  Before you can use the rest of the app, you must finish planning one day. Check out
                  this <a href="/daily-planning" className="text-primary hover:underline">guide</a> on
                  how to plan your day.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Add integrations:</h3>
                <p className="text-muted-foreground">
                  DPM Calendar can connect with multiple tools. These integrations are useful for
                  importing items into your daily plan. Check out the{" "}
                  <a href="/settings" className="text-primary hover:underline">settings</a> to add
                  integrations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Side Panel (Expanded View) */}
        {isExpanded && (
          <div className="flex-1 border-l overflow-hidden">
            <DayView
              date={selectedDate}
              events={events}
              onEventClick={() => {}}
              onSlotClick={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
