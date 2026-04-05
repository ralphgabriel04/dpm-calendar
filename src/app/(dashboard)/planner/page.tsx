"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  PanelLeftClose,
  PanelRightClose,
  PanelLeft,
  PanelRight,
  Target,
  Calendar as CalendarIcon,
  GripVertical,
  Clock,
  Check,
  Play,
  Sparkles,
  Pause,
  RotateCcw,
  Timer,
} from "lucide-react";
import { format, addDays, subDays, startOfWeek, startOfMonth, addHours, setHours, setMinutes, addMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

import { trpc } from "@/infrastructure/trpc/client";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/Button";
import { WeekView, DayView, MonthView } from "@/features/calendar/components/calendar";
import { EventModal, type EventFormData } from "@/features/calendar/components/events";
import { TaskModal } from "@/features/tasks/components/tasks/TaskModal";
import { type TaskFormData } from "@/features/tasks/components/tasks/TaskForm";
import { useUIStore } from "@/stores/ui.store";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  plannedDuration?: number | null;
  priority: string;
  status: string;
  dueAt?: Date | null;
}

// Simpler task type for calendar drop
interface SimpleTask {
  id: string;
  title: string;
  plannedDuration?: number | null;
}

// Draggable task item component
function DraggableTask({
  task,
  onComplete,
  onSelect,
  isSelected,
}: {
  task: Task;
  onComplete: (id: string) => void;
  onSelect?: (task: Task) => void;
  isSelected?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "border-l-red-500";
      case "HIGH": return "border-l-orange-500";
      case "MEDIUM": return "border-l-yellow-500";
      default: return "border-l-green-500";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect?.(task)}
      className={cn(
        "group flex items-center gap-2 p-2.5 rounded-lg border-l-4 bg-card border border-border/50",
        "hover:border-border hover:shadow-sm transition-all cursor-pointer",
        getPriorityColor(task.priority),
        isDragging && "opacity-50 shadow-lg",
        isSelected && "ring-2 ring-primary border-primary bg-primary/5"
      )}
    >
      <div {...listeners} {...attributes} className="touch-none cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete(task.id);
        }}
        className={cn(
          "h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
          "transition-colors hover:border-primary hover:bg-primary/10",
          task.status === "DONE"
            ? "bg-primary border-primary"
            : "border-muted-foreground/30"
        )}
      >
        {task.status === "DONE" && (
          <Check className="h-3 w-3 text-primary-foreground" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          task.status === "DONE" && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
      </div>
      {task.plannedDuration && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {task.plannedDuration}m
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialFocus = searchParams.get("focus") === "true";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"day" | "week" | "month">("day");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(initialFocus);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Focus timer state
  const [focusTimerRunning, setFocusTimerRunning] = useState(false);
  const [focusElapsedSeconds, setFocusElapsedSeconds] = useState(0);

  const { eventModalOpen, eventModalMode, openEventModal, closeEventModal } = useUIStore();
  const [newEventData, setNewEventData] = useState<Partial<EventFormData>>({});

  // DnD Sensors
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Fetch today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: tasksData, refetch: refetchTasks } = trpc.task.list.useQuery({
    includeCompleted: true,
  });

  // Fetch calendars
  const { data: calendarsData } = trpc.calendar.list.useQuery();

  // Get date range for events
  const viewStart = viewType === "month"
    ? startOfMonth(currentDate)
    : viewType === "week"
      ? startOfWeek(currentDate, { locale: fr })
      : currentDate;
  const viewEnd = viewType === "month"
    ? addDays(startOfMonth(currentDate), 42) // 6 weeks max
    : viewType === "week"
      ? addDays(viewStart, 7)
      : addDays(currentDate, 1);

  // Fetch events
  const { data: eventsData, refetch: refetchEvents } = trpc.event.list.useQuery({
    startDate: viewStart,
    endDate: viewEnd,
  });

  // Mutations
  const updateTaskMutation = trpc.task.update.useMutation({
    onSuccess: () => refetchTasks(),
  });

  const scheduleTaskMutation = trpc.task.scheduleTask.useMutation({
    onSuccess: () => {
      refetchTasks();
      refetchEvents();
      toast.success("Tâche planifiée");
    },
  });

  const createEventMutation = trpc.event.create.useMutation({
    onSuccess: () => {
      refetchEvents();
      closeEventModal();
      toast.success("Événement créé");
    },
  });

  const updateEventMutation = trpc.event.update.useMutation({
    onSuccess: () => refetchEvents(),
  });

  const createTaskMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      refetchTasks();
      setTaskModalOpen(false);
      toast.success("Tâche créée");
    },
  });

  // Transform tasks
  const tasks = useMemo(() => {
    if (!tasksData) return [];
    return tasksData
      .filter((task) => {
        if (task.status === "CANCELLED") return false;
        // Show all non-done tasks and tasks due today
        if (task.status === "DONE") {
          if (!task.dueAt) return false;
          const dueDate = new Date(task.dueAt);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        }
        return true;
      })
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        plannedDuration: task.plannedDuration,
        priority: task.priority,
        status: task.status,
        dueAt: task.dueAt ? new Date(task.dueAt) : null,
      }));
  }, [tasksData, today]);

  // Split tasks into today and backlog
  const todayTasks = tasks.filter((t) => {
    if (!t.dueAt) return t.status === "IN_PROGRESS";
    const dueDate = new Date(t.dueAt);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() <= today.getTime();
  });

  const backlogTasks = tasks.filter((t) => {
    if (!t.dueAt) return t.status !== "IN_PROGRESS";
    const dueDate = new Date(t.dueAt);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() > today.getTime();
  });

  // Calculate workload
  const plannedMinutes = todayTasks
    .filter((t) => t.status !== "DONE")
    .reduce((acc, t) => acc + (t.plannedDuration || 30), 0);
  const completedMinutes = todayTasks
    .filter((t) => t.status === "DONE")
    .reduce((acc, t) => acc + (t.plannedDuration || 30), 0);
  const meetingMinutes = (eventsData || []).reduce((acc, e) => {
    const start = new Date(e.startAt);
    const end = new Date(e.endAt);
    if (start.toDateString() !== today.toDateString()) return acc;
    return acc + Math.round((end.getTime() - start.getTime()) / 60000);
  }, 0);

  // Transform events
  const events: CalendarEvent[] = useMemo(() => {
    if (!eventsData) return [];
    return eventsData.map((event) => ({
      id: event.id,
      title: event.title,
      startAt: new Date(event.startAt),
      endAt: new Date(event.endAt),
      isAllDay: event.isAllDay,
      color: event.color || undefined,
      calendarId: event.calendarId,
      calendar: event.calendar
        ? { color: event.calendar.color, name: event.calendar.name }
        : undefined,
    }));
  }, [eventsData]);

  // Calendar options
  const calendarOptions = useMemo(() => {
    if (!calendarsData) return [];
    return calendarsData.map((cal) => ({
      id: cal.id,
      name: cal.name,
      color: cal.color,
    }));
  }, [calendarsData]);

  // Handlers
  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    updateTaskMutation.mutate({
      id: taskId,
      status: task?.status === "DONE" ? "TODO" : "DONE",
    });
  };

  const handleSlotClick = (date: Date, time: Date) => {
    const startAt = new Date(date);
    startAt.setHours(time.getHours(), time.getMinutes(), 0, 0);
    setNewEventData({
      startAt,
      endAt: addHours(startAt, 1),
      calendarId: calendarOptions[0]?.id,
    });
    openEventModal("create");
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedTask(null);
    // Could open event details
  };

  const handleEventMove = (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    updateEventMutation.mutate({
      id: event.id,
      startAt: newStart,
      endAt: newEnd,
    });
  };

  const handleEventResize = (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    updateEventMutation.mutate({
      id: event.id,
      startAt: newStart,
      endAt: newEnd,
    });
  };

  const handleTaskDrop = useCallback((task: SimpleTask, startAt: Date, endAt: Date) => {
    scheduleTaskMutation.mutate({
      taskId: task.id,
      startAt,
      endAt,
      calendarId: calendarOptions[0]?.id,
      createEvent: true,
    });
  }, [scheduleTaskMutation, calendarOptions]);

  const handleCreateEvent = () => {
    const now = new Date();
    const startAt = setMinutes(setHours(now, now.getHours() + 1), 0);
    setNewEventData({
      startAt,
      endAt: addHours(startAt, 1),
      calendarId: calendarOptions[0]?.id,
    });
    openEventModal("create");
  };

  const handleSubmitEvent = (data: EventFormData) => {
    createEventMutation.mutate({
      title: data.title,
      description: data.description,
      location: data.location,
      startAt: data.startAt,
      endAt: data.endAt,
      isAllDay: data.isAllDay,
      calendarId: data.calendarId,
      color: data.color,
      reminderMinutes: data.reminderMinutes,
      rrule: data.rrule,
    });
  };

  // Task creation
  const handleCreateTask = (data: TaskFormData) => {
    createTaskMutation.mutate({
      title: data.title,
      description: data.description,
      notes: data.notes,
      url: data.url || undefined,
      dueAt: data.dueAt,
      plannedStartAt: data.plannedStartAt,
      plannedDuration: data.plannedDuration,
      priority: data.priority,
      tags: data.tags,
      estimatedEnergy: data.estimatedEnergy,
    });
  };

  // Task selection for focus mode
  const handleSelectTaskForFocus = (task: Task) => {
    setSelectedTask(task);
    setRightPanelOpen(true);
    setFocusElapsedSeconds(0);
    setFocusTimerRunning(false);
  };

  // Toggle focus mode with selected task
  const handleStartFocus = () => {
    if (!selectedTask) {
      toast.error("Sélectionnez une tâche d'abord");
      return;
    }
    setIsFocusMode(true);
    setFocusTimerRunning(true);
    // Set task to IN_PROGRESS
    updateTaskMutation.mutate({
      id: selectedTask.id,
      status: "IN_PROGRESS",
    });
  };

  const handlePauseFocus = () => {
    setFocusTimerRunning(false);
  };

  const handleResetFocus = () => {
    setFocusElapsedSeconds(0);
    setFocusTimerRunning(false);
  };

  const handleCompleteFocusTask = () => {
    if (selectedTask) {
      updateTaskMutation.mutate({
        id: selectedTask.id,
        status: "DONE",
      });
      setSelectedTask(null);
      setIsFocusMode(false);
      setFocusTimerRunning(false);
      setFocusElapsedSeconds(0);
      toast.success("Tâche terminée !");
    }
  };

  // Focus timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (focusTimerRunning) {
      interval = setInterval(() => {
        setFocusElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [focusTimerRunning]);

  // Format timer
  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "task") {
      setDraggedTask(active.data.current.task as Task);
    }
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const activatorEvent = event.activatorEvent as PointerEvent | MouseEvent | TouchEvent;
    if (activatorEvent) {
      if ('clientX' in activatorEvent) {
        lastPointerPositionRef.current = {
          x: activatorEvent.clientX + (event.delta?.x || 0),
          y: activatorEvent.clientY + (event.delta?.y || 0),
        };
      } else if ('touches' in activatorEvent && activatorEvent.touches[0]) {
        lastPointerPositionRef.current = {
          x: activatorEvent.touches[0].clientX + (event.delta?.x || 0),
          y: activatorEvent.touches[0].clientY + (event.delta?.y || 0),
        };
      }
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over) {
      lastPointerPositionRef.current = null;
      return;
    }

    const dragData = active.data.current;
    const dropData = over.data.current as {
      type: string;
      date: Date;
      startHour?: number;
      hourHeight?: number;
    } | undefined;

    if (!dropData) {
      lastPointerPositionRef.current = null;
      return;
    }

    if (dragData?.type === "task" && dropData.type === "dayColumn") {
      const task = dragData.task as Task;
      const duration = task.plannedDuration || 60;
      const newStart = new Date(dropData.date);

      if (lastPointerPositionRef.current && over.rect && dropData.hourHeight) {
        const startHour = dropData.startHour || 0;
        const relativeY = lastPointerPositionRef.current.y - over.rect.top;
        const totalMinutes = (relativeY / dropData.hourHeight) * 60 + startHour * 60;
        const roundedMinutes = Math.round(totalMinutes / 15) * 15;
        const hours = Math.floor(roundedMinutes / 60);
        const minutes = roundedMinutes % 60;
        const clampedHours = Math.max(0, Math.min(23, hours));
        const clampedMinutes = clampedHours === 23 ? Math.min(45, minutes) : minutes;
        newStart.setHours(clampedHours, clampedMinutes, 0, 0);
      } else {
        newStart.setHours(9, 0, 0, 0);
      }

      const newEnd = addMinutes(newStart, duration);
      handleTaskDrop(task, newStart, newEnd);
    }

    lastPointerPositionRef.current = null;
  }, [handleTaskDrop]);

  // Navigation
  const navigatePrev = () => {
    setCurrentDate((d) => {
      if (viewType === "month") {
        const newDate = new Date(d);
        newDate.setMonth(newDate.getMonth() - 1);
        return newDate;
      }
      return viewType === "week" ? subDays(d, 7) : subDays(d, 1);
    });
  };

  const navigateNext = () => {
    setCurrentDate((d) => {
      if (viewType === "month") {
        const newDate = new Date(d);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
      }
      return viewType === "week" ? addDays(d, 7) : addDays(d, 1);
    });
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full overflow-hidden">
        {/* Left panel - Tasks */}
        <div
          className={cn(
            "flex-shrink-0 border-r bg-card/50 transition-all duration-300 overflow-hidden",
            leftPanelOpen ? "w-72 lg:w-80" : "w-0",
            // Mobile: overlay
            leftPanelOpen && "fixed inset-y-0 left-0 z-40 lg:relative lg:z-0"
          )}
        >
          {leftPanelOpen && (
            <>
              {/* Mobile overlay */}
              <div
                className="fixed inset-0 bg-black/50 lg:hidden"
                onClick={() => setLeftPanelOpen(false)}
              />
              <div className="relative h-full flex flex-col bg-card lg:bg-transparent z-50">
                {/* Panel header */}
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold text-sm">Aujourd&apos;hui</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLeftPanelOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>

                {/* Workload with task breakdown */}
                <div className="p-3 border-b space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Charge du jour</span>
                    <span className="font-medium">
                      {Math.floor((plannedMinutes + meetingMinutes) / 60)}h{(plannedMinutes + meetingMinutes) % 60 > 0 ? (plannedMinutes + meetingMinutes) % 60 : ''}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {todayTasks.filter(t => t.status !== "DONE").slice(0, 4).map((task) => (
                      <div key={task.id} className="flex items-center justify-between text-xs">
                        <span className="truncate flex-1 text-muted-foreground">{task.title}</span>
                        <span className="ml-2 font-medium text-violet-500">
                          {task.plannedDuration || 30}m
                        </span>
                      </div>
                    ))}
                    {meetingMinutes > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Réunions</span>
                        <span className="font-medium text-blue-500">{meetingMinutes}m</span>
                      </div>
                    )}
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 via-violet-500 to-blue-500 transition-all"
                      style={{ width: `${Math.min(100, ((completedMinutes + plannedMinutes + meetingMinutes) / 480) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Tasks list */}
                <div className="flex-1 overflow-auto p-3 space-y-4">
                  {/* Today's tasks */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        À faire ({todayTasks.filter((t) => t.status !== "DONE").length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {todayTasks.map((task) => (
                        <DraggableTask
                          key={task.id}
                          task={task}
                          onComplete={handleCompleteTask}
                          onSelect={handleSelectTaskForFocus}
                          isSelected={selectedTask?.id === task.id}
                        />
                      ))}
                      {todayTasks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucune tâche pour aujourd&apos;hui
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Backlog */}
                  {backlogTasks.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          À venir ({backlogTasks.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {backlogTasks.slice(0, 5).map((task) => (
                          <DraggableTask
                            key={task.id}
                            task={task}
                            onComplete={handleCompleteTask}
                            onSelect={handleSelectTaskForFocus}
                            isSelected={selectedTask?.id === task.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Add task button */}
                <div className="p-3 border-t">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => setTaskModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle tâche
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Center panel - Calendar */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between border-b bg-card px-3 py-2 md:px-4 md:py-3">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Left panel toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="h-8 w-8 p-0"
              >
                {leftPanelOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>

              {/* Navigation */}
              <div className="flex items-center gap-1">
                <button onClick={navigatePrev} className="p-1.5 md:p-2 rounded-md hover:bg-accent">
                  <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={navigateToday}
                  className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded-md hover:bg-accent"
                >
                  Aujourd&apos;hui
                </button>
                <button onClick={navigateNext} className="p-1.5 md:p-2 rounded-md hover:bg-accent">
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>

              {/* Date title */}
              <h2 className="text-sm md:text-lg font-semibold capitalize hidden sm:block">
                {format(currentDate, viewType === "month" ? "MMMM yyyy" : viewType === "week" ? "MMMM yyyy" : "EEEE d MMMM", { locale: fr })}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex rounded-lg border bg-muted p-0.5">
                <button
                  onClick={() => setViewType("day")}
                  className={cn(
                    "px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm font-medium rounded-md transition-colors",
                    viewType === "day"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Jour
                </button>
                <button
                  onClick={() => setViewType("week")}
                  className={cn(
                    "px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm font-medium rounded-md transition-colors",
                    viewType === "week"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Semaine
                </button>
                <button
                  onClick={() => setViewType("month")}
                  className={cn(
                    "px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm font-medium rounded-md transition-colors",
                    viewType === "month"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Mois
                </button>
              </div>

              {/* Plan Tomorrow button */}
              <Link href="/daily-planning" className="hidden md:flex">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Plan Tomorrow
                </Button>
              </Link>

              {/* Focus mode toggle */}
              <Button
                variant={isFocusMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (!isFocusMode) {
                    // Entering focus mode - open right panel
                    setRightPanelOpen(true);
                    if (!selectedTask && todayTasks.length > 0) {
                      // Auto-select first task if none selected
                      const firstPendingTask = todayTasks.find(t => t.status !== "DONE");
                      if (firstPendingTask) {
                        setSelectedTask(firstPendingTask);
                      }
                    }
                  }
                  setIsFocusMode(!isFocusMode);
                }}
                className="hidden md:flex"
              >
                <Target className="h-4 w-4 mr-1" />
                Focus
              </Button>

              {/* Right panel toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className="h-8 w-8 p-0"
              >
                {rightPanelOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </header>

          {/* Calendar view */}
          <div className="flex-1 overflow-hidden">
            {viewType === "day" && (
              <DayView
                date={currentDate}
                events={events}
                startHour={0}
                endHour={24}
                onEventClick={handleEventClick}
                onSlotClick={handleSlotClick}
                onEventMove={handleEventMove}
                onEventResize={handleEventResize}
                onTaskDrop={handleTaskDrop}
              />
            )}
            {viewType === "week" && (
              <WeekView
                date={currentDate}
                events={events}
                startHour={0}
                endHour={24}
                onEventClick={handleEventClick}
                onSlotClick={handleSlotClick}
                onEventMove={handleEventMove}
                onEventResize={handleEventResize}
                onTaskDrop={handleTaskDrop}
              />
            )}
            {viewType === "month" && (
              <MonthView
                date={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onDayClick={(date) => {
                  setCurrentDate(date);
                  setViewType("day");
                }}
              />
            )}
          </div>
        </div>

        {/* Right panel - Task details / Focus */}
        <div
          className={cn(
            "flex-shrink-0 border-l bg-card/50 transition-all duration-300 overflow-hidden",
            rightPanelOpen ? "w-72 lg:w-80" : "w-0",
            // Mobile: overlay
            rightPanelOpen && "fixed inset-y-0 right-0 z-40 lg:relative lg:z-0"
          )}
        >
          {rightPanelOpen && (
            <>
              {/* Mobile overlay */}
              <div
                className="fixed inset-0 bg-black/50 lg:hidden"
                onClick={() => setRightPanelOpen(false)}
              />
              <div className="relative h-full flex flex-col bg-card lg:bg-transparent z-50">
                {/* Panel header */}
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold text-sm">
                    {selectedTask ? "Détails" : "Focus Mode"}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRightPanelOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                  {selectedTask ? (
                    <div className="space-y-6">
                      {/* Task info */}
                      <div className="space-y-2">
                        <div className={cn(
                          "inline-flex px-2 py-0.5 rounded text-xs font-medium",
                          selectedTask.priority === "URGENT" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          selectedTask.priority === "HIGH" && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                          selectedTask.priority === "MEDIUM" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                          selectedTask.priority === "LOW" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        )}>
                          {selectedTask.priority}
                        </div>
                        <h4 className="font-medium text-lg">{selectedTask.title}</h4>
                        {selectedTask.description && (
                          <p className="text-sm text-muted-foreground">
                            {selectedTask.description}
                          </p>
                        )}
                        {selectedTask.plannedDuration && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Durée estimée: {selectedTask.plannedDuration} min</span>
                          </div>
                        )}
                      </div>

                      {/* Focus Timer */}
                      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-violet-500/5 p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <Timer className="h-5 w-5 text-primary" />
                          <span className="font-medium">Mode Focus</span>
                        </div>

                        {/* Timer display */}
                        <div className="text-center">
                          <div className="text-4xl font-mono font-bold tracking-wider">
                            {formatTimer(focusElapsedSeconds)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {focusTimerRunning ? "En cours..." : "Chronomètre"}
                          </p>
                        </div>

                        {/* Timer controls */}
                        <div className="flex items-center justify-center gap-2">
                          {!focusTimerRunning ? (
                            <Button
                              onClick={handleStartFocus}
                              className="flex-1"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Démarrer
                            </Button>
                          ) : (
                            <Button
                              onClick={handlePauseFocus}
                              variant="outline"
                              className="flex-1"
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleResetFocus}
                            disabled={focusElapsedSeconds === 0}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Complete button */}
                        <Button
                          onClick={handleCompleteFocusTask}
                          variant="outline"
                          className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Marquer comme terminé
                        </Button>
                      </div>

                      {/* Deselect button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(null);
                          setFocusTimerRunning(false);
                          setFocusElapsedSeconds(0);
                        }}
                        className="w-full text-muted-foreground"
                      >
                        Changer de tâche
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Sélectionnez une tâche dans la liste pour démarrer le mode focus
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cliquez sur une tâche dans le panneau de gauche pour la sélectionner
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Event Modal */}
        <EventModal
          open={eventModalOpen}
          onOpenChange={(open) => {
            if (!open) closeEventModal();
          }}
          initialData={newEventData}
          calendars={calendarOptions}
          onSubmit={handleSubmitEvent}
          isLoading={createEventMutation.isPending}
          mode={eventModalMode}
        />

        {/* Task Modal */}
        <TaskModal
          open={taskModalOpen}
          onOpenChange={setTaskModalOpen}
          onSubmit={handleCreateTask}
          isLoading={createTaskMutation.isPending}
          mode="create"
        />
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {draggedTask && (
          <div
            className="rounded-lg px-3 py-2 shadow-xl bg-primary text-primary-foreground"
            style={{ width: 200 }}
          >
            <div className="font-medium text-sm truncate">{draggedTask.title}</div>
            <div className="text-xs opacity-80">
              {draggedTask.plannedDuration || 60} min
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
