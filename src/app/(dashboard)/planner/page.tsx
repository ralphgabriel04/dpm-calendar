"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { format, addDays, subDays, startOfWeek, addHours, setHours, setMinutes, addMinutes } from "date-fns";
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

import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { WorkloadBarCompact } from "@/components/dashboard";
import { WeekView, DayView } from "@/components/calendar";
import { EventModal, type EventFormData } from "@/components/events";
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
function DraggableTask({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
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
      className={cn(
        "group flex items-center gap-2 p-2.5 rounded-lg border-l-4 bg-card border border-border/50",
        "hover:border-border hover:shadow-sm transition-all cursor-grab active:cursor-grabbing",
        getPriorityColor(task.priority),
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div {...listeners} {...attributes} className="touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <button
        onClick={() => onComplete(task.id)}
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
  const initialFocus = searchParams.get("focus") === "true";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"day" | "week">("day");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(initialFocus);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);

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
  const viewStart = viewType === "week" ? startOfWeek(currentDate, { locale: fr }) : currentDate;
  const viewEnd = viewType === "week" ? addDays(viewStart, 7) : addDays(currentDate, 1);

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
      toast.success("Tache planifiee");
    },
  });

  const createEventMutation = trpc.event.create.useMutation({
    onSuccess: () => {
      refetchEvents();
      closeEventModal();
      toast.success("Evenement cree");
    },
  });

  const updateEventMutation = trpc.event.update.useMutation({
    onSuccess: () => refetchEvents(),
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
    setCurrentDate((d) => (viewType === "week" ? subDays(d, 7) : subDays(d, 1)));
  };

  const navigateNext = () => {
    setCurrentDate((d) => (viewType === "week" ? addDays(d, 7) : addDays(d, 1)));
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

                {/* Workload */}
                <div className="p-3 border-b">
                  <WorkloadBarCompact
                    plannedMinutes={plannedMinutes}
                    completedMinutes={completedMinutes}
                    meetingMinutes={meetingMinutes}
                  />
                </div>

                {/* Tasks list */}
                <div className="flex-1 overflow-auto p-3 space-y-4">
                  {/* Today's tasks */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        A faire ({todayTasks.filter((t) => t.status !== "DONE").length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {todayTasks.map((task) => (
                        <DraggableTask
                          key={task.id}
                          task={task}
                          onComplete={handleCompleteTask}
                        />
                      ))}
                      {todayTasks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucune tache pour aujourd&apos;hui
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Backlog */}
                  {backlogTasks.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          A venir ({backlogTasks.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {backlogTasks.slice(0, 5).map((task) => (
                          <DraggableTask
                            key={task.id}
                            task={task}
                            onComplete={handleCompleteTask}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Add task button */}
                <div className="p-3 border-t">
                  <Button className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle tache
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
                {format(currentDate, viewType === "week" ? "MMMM yyyy" : "EEEE d MMMM", { locale: fr })}
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
                onClick={() => setIsFocusMode(!isFocusMode)}
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
            {viewType === "day" ? (
              <DayView
                date={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onSlotClick={handleSlotClick}
                onEventMove={handleEventMove}
                onEventResize={handleEventResize}
                onTaskDrop={handleTaskDrop}
              />
            ) : (
              <WeekView
                date={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onSlotClick={handleSlotClick}
                onEventMove={handleEventMove}
                onEventResize={handleEventResize}
                onTaskDrop={handleTaskDrop}
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
                    {selectedTask ? "Details" : "Focus Mode"}
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
                    <div className="space-y-4">
                      <h4 className="font-medium">{selectedTask.title}</h4>
                      {selectedTask.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedTask.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Selectionnez une tache pour voir les details ou demarrer le mode focus
                      </p>
                      <Button className="mt-4" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Demarrer Focus
                      </Button>
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
