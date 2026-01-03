"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, addDays } from "date-fns";
import {
  X,
  Play,
  Pause,
  Plus,
  Check,
  Calendar as CalendarIcon,
  Clock,
  Timer,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Tag,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DayView } from "@/components/calendar";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { trpc as api } from "@/lib/trpc";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string;
    tags?: string[];
    plannedDuration?: number; // in minutes
    actualDuration?: number; // in minutes
    dueAt?: Date;
    startAt?: Date;
  };
  events?: CalendarEvent[];
  onUpdate?: (taskId: string, data: Record<string, unknown>) => void;
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
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(task.startAt || new Date());

  // Subtasks state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [sessionActualTime, setSessionActualTime] = useState(0); // Track time added this session
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pomodoro state
  const [pomodoroSession, setPomodoroSession] = useState(25); // minutes
  const [pomodoroRemaining, setPomodoroRemaining] = useState(25 * 60); // seconds
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);

  // tRPC queries and mutations
  const utils = api.useUtils();

  const { data: checklistItems = [], isLoading: loadingChecklist } = api.task.getChecklistItems.useQuery(
    { taskId: task.id },
    { enabled: isOpen }
  );

  const { data: allTags = [] } = api.task.getTags.useQuery(undefined, { enabled: isOpen });

  const addChecklistItemMutation = api.task.addChecklistItem.useMutation({
    onSuccess: () => {
      utils.task.getChecklistItems.invalidate({ taskId: task.id });
    },
  });

  const toggleChecklistItemMutation = api.task.toggleChecklistItem.useMutation({
    onSuccess: () => {
      utils.task.getChecklistItems.invalidate({ taskId: task.id });
    },
  });

  const deleteChecklistItemMutation = api.task.deleteChecklistItem.useMutation({
    onSuccess: () => {
      utils.task.getChecklistItems.invalidate({ taskId: task.id });
    },
  });

  const updateActualDurationMutation = api.task.updateActualDuration.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
    },
  });

  const updateTaskMutation = api.task.update.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
    },
  });

  // Calculate totals
  const totalPlanned = (task.plannedDuration || 0) * 60; // convert to seconds
  const totalActual = ((task.actualDuration || 0) + sessionActualTime) * 60 + elapsedTime;

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

  // Start focus timer
  const startTimer = useCallback(() => {
    setIsTimerRunning(true);
    setElapsedTime(0);
  }, []);

  // Stop timer and save elapsed time to database
  const stopTimer = useCallback(() => {
    setIsTimerRunning(false);

    if (elapsedTime > 0) {
      const minutesToAdd = Math.ceil(elapsedTime / 60);

      // Update in database
      updateActualDurationMutation.mutate({
        taskId: task.id,
        additionalMinutes: minutesToAdd,
      });

      // Track locally for display
      setSessionActualTime((prev) => prev + minutesToAdd);
    }

    setElapsedTime(0);
  }, [elapsedTime, task.id, updateActualDurationMutation]);

  // Add subtask
  const addSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim()) return;

    addChecklistItemMutation.mutate({
      taskId: task.id,
      title: newSubtaskTitle.trim(),
    });

    setNewSubtaskTitle("");
  }, [newSubtaskTitle, task.id, addChecklistItemMutation]);

  // Toggle subtask completion
  const toggleSubtask = useCallback((itemId: string) => {
    toggleChecklistItemMutation.mutate({ id: itemId });
  }, [toggleChecklistItemMutation]);

  // Delete subtask
  const deleteSubtask = useCallback((itemId: string) => {
    deleteChecklistItemMutation.mutate({ id: itemId });
  }, [deleteChecklistItemMutation]);

  // Handle tag selection
  const handleTagSelect = useCallback((tag: string) => {
    const currentTags = task.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    updateTaskMutation.mutate({
      id: task.id,
      tags: newTags,
    });

    onUpdate?.(task.id, { tags: newTags });
    setShowTagSelector(false);
  }, [task.id, task.tags, updateTaskMutation, onUpdate]);

  // Add new tag
  const [newTagInput, setNewTagInput] = useState("");
  const handleAddNewTag = useCallback(() => {
    if (!newTagInput.trim()) return;

    const currentTags = task.tags || [];
    const newTags = [...currentTags, newTagInput.trim()];

    updateTaskMutation.mutate({
      id: task.id,
      tags: newTags,
    });

    onUpdate?.(task.id, { tags: newTags });
    setNewTagInput("");
    setShowTagSelector(false);
  }, [newTagInput, task.id, task.tags, updateTaskMutation, onUpdate]);

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

  const currentTags = task.tags || [];

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
            <div className="flex items-center gap-2 relative">
              <span className="text-xs text-muted-foreground uppercase">Tags</span>
              <button
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="flex items-center gap-1 text-sm hover:bg-accent px-2 py-1 rounded"
              >
                <Tag className="h-3 w-3" />
                {currentTags.length > 0 ? currentTags.join(", ") : "Ajouter un tag"}
              </button>

              {/* Tag Selector Dropdown */}
              {showTagSelector && (
                <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-lg py-2 min-w-[200px] z-20">
                  <div className="px-3 py-1 text-xs text-muted-foreground">Tags existants</div>
                  {allTags.length > 0 ? (
                    allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagSelect(tag)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between",
                          currentTags.includes(tag) && "bg-primary/10"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                        {currentTags.includes(tag) && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Aucun tag</div>
                  )}
                  <div className="border-t my-2" />
                  <div className="px-3 py-1">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nouveau tag..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddNewTag()}
                        className="h-8 text-sm"
                      />
                      <Button size="sm" onClick={handleAddNewTag} className="h-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">START</span>
                <button
                  onClick={() => setShowMoveMenu(!showMoveMenu)}
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

            {/* Subtasks / Checklist Items */}
            <div className="space-y-2 mb-6">
              {loadingChecklist ? (
                <div className="text-sm text-muted-foreground">Chargement...</div>
              ) : (
                checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2 group"
                  >
                    <button
                      onClick={() => toggleSubtask(item.id)}
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                        item.isCompleted
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-muted-foreground/30 hover:border-primary"
                      )}
                    >
                      {item.isCompleted && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        item.isCompleted && "line-through text-muted-foreground"
                      )}
                    >
                      {item.title}
                    </span>
                    <button
                      onClick={() => deleteSubtask(item.id)}
                      className="p-1 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))
              )}

              {/* Add Subtask */}
              <div className="flex items-center gap-3 py-2">
                <button className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 flex-shrink-0 flex items-center justify-center">
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </button>
                <Input
                  placeholder="Ajouter une sous-tâche"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                  className="flex-1 border-0 p-0 h-auto focus-visible:ring-0 text-sm text-muted-foreground"
                  disabled={addChecklistItemMutation.isPending}
                />
                {newSubtaskTitle && (
                  <Button
                    size="sm"
                    onClick={addSubtask}
                    disabled={addChecklistItemMutation.isPending}
                    className="h-7"
                  >
                    {addChecklistItemMutation.isPending ? "..." : "Ajouter"}
                  </Button>
                )}
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
                <h3 className="font-semibold mb-2">Ajouter une tâche:</h3>
                <p className="text-muted-foreground">
                  Vous avez déjà créé votre première tâche. Vous pouvez en ajouter d&apos;autres avec le raccourci
                  clavier <kbd className="px-1 py-0.5 bg-muted rounded text-red-500">A</kbd> ou en
                  cliquant sur le bouton &quot;Ajouter une tâche&quot;.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Planification quotidienne:</h3>
                <p className="text-muted-foreground">
                  Avant de pouvoir utiliser le reste de l&apos;application, vous devez terminer la planification d&apos;une journée.
                  Consultez ce <a href="/daily-planning" className="text-primary hover:underline">guide</a> pour
                  planifier votre journée.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Ajouter des intégrations:</h3>
                <p className="text-muted-foreground">
                  DPM Calendar peut se connecter à plusieurs outils. Ces intégrations sont utiles pour
                  importer des éléments dans votre plan quotidien. Consultez les{" "}
                  <a href="/settings" className="text-primary hover:underline">paramètres</a> pour ajouter
                  des intégrations.
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
