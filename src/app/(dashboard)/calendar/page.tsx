"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, List } from "lucide-react";
import { format, addHours, setHours, setMinutes, addMinutes } from "date-fns";
import { fr } from "date-fns/locale";
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
import { useCalendarStore } from "@/stores/calendar.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

// Calendar components
import { WeekView, DayView, MonthView, AgendaView, CalendarSidebar, UnscheduledTasksSidebar } from "@/components/calendar";
import { EventModal, type EventFormData } from "@/components/events";
import type { CalendarEvent } from "@/lib/calendar/utils";

// tRPC hooks
import { trpc } from "@/lib/trpc";

interface Task {
  id: string;
  title: string;
  plannedDuration?: number | null;
}

export default function CalendarPage() {
  const {
    currentDate,
    viewType,
    setCurrentDate,
    setViewType,
    navigatePrev,
    navigateNext,
    navigateToday,
    visibleCalendarIds,
    toggleCalendarVisibility,
    getViewRange,
  } = useCalendarStore();

  const { eventModalOpen, eventModalMode, openEventModal, closeEventModal } = useUIStore();

  // State for new event
  const [newEventData, setNewEventData] = useState<Partial<EventFormData>>({});

  // State for drag overlay
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Track pointer position during drag for precise hour calculation
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Fetch calendars
  const { data: calendarsData, refetch: refetchCalendars } = trpc.calendar.list.useQuery();

  // Calendar mutations
  const createCalendarMutation = trpc.calendar.create.useMutation({
    onSuccess: () => refetchCalendars(),
  });

  const updateCalendarMutation = trpc.calendar.update.useMutation({
    onSuccess: () => refetchCalendars(),
  });

  const deleteCalendarMutation = trpc.calendar.delete.useMutation({
    onSuccess: () => refetchCalendars(),
  });

  // Get date range for fetching events
  const viewRange = useMemo(() => getViewRange(), [currentDate, viewType, getViewRange]);

  // Fetch events
  const { data: eventsData, refetch: refetchEvents } = trpc.event.list.useQuery({
    startDate: viewRange.start,
    endDate: viewRange.end,
    calendarIds: visibleCalendarIds.length > 0 ? visibleCalendarIds : undefined,
  });

  // Fetch unscheduled tasks
  const { refetch: refetchTasks } = trpc.task.getUnscheduled.useQuery();

  // Create event mutation
  const createEventMutation = trpc.event.create.useMutation({
    onSuccess: () => {
      refetchEvents();
      closeEventModal();
    },
  });

  // Update event mutation
  const updateEventMutation = trpc.event.update.useMutation({
    onSuccess: () => {
      refetchEvents();
      closeEventModal();
    },
  });

  // Schedule task mutation (time blocking)
  const scheduleTaskMutation = trpc.task.scheduleTask.useMutation({
    onSuccess: () => {
      refetchEvents();
      refetchTasks();
    },
  });

  // DnD Sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Transform events to CalendarEvent format
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

  // Transform calendars for sidebar
  const calendars = useMemo(() => {
    if (!calendarsData) return [];
    return calendarsData.map((cal) => ({
      id: cal.id,
      name: cal.name,
      color: cal.color,
      isVisible: visibleCalendarIds.length === 0 || visibleCalendarIds.includes(cal.id),
      provider: cal.provider,
      isDefault: cal.isDefault,
    }));
  }, [calendarsData, visibleCalendarIds]);

  // Calendar CRUD handlers
  const handleCreateCalendar = useCallback((name: string, color: string) => {
    createCalendarMutation.mutate({ name, color });
  }, [createCalendarMutation]);

  const handleUpdateCalendar = useCallback((id: string, name: string, color: string) => {
    updateCalendarMutation.mutate({ id, name, color });
  }, [updateCalendarMutation]);

  const handleDeleteCalendar = useCallback((id: string) => {
    deleteCalendarMutation.mutate({ id });
  }, [deleteCalendarMutation]);

  // Calendar selector for event form
  const calendarOptions = useMemo(() => {
    if (!calendarsData) return [];
    return calendarsData.map((cal) => ({
      id: cal.id,
      name: cal.name,
      color: cal.color,
    }));
  }, [calendarsData]);

  const viewLabels = {
    day: "Jour",
    week: "Semaine",
    month: "Mois",
    agenda: "Agenda",
  };

  const formatTitle = () => {
    if (viewType === "day") {
      return format(currentDate, "EEEE d MMMM yyyy", { locale: fr });
    } else if (viewType === "week") {
      return format(currentDate, "MMMM yyyy", { locale: fr });
    } else {
      return format(currentDate, "MMMM yyyy", { locale: fr });
    }
  };

  // Handle slot click (create new event)
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

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    console.log("Event clicked:", event);
  };

  // Handle day click in month view
  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setViewType("day");
  };

  // Handle event move (drag & drop)
  const handleEventMove = (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    updateEventMutation.mutate({
      id: event.id,
      startAt: newStart,
      endAt: newEnd,
    });
  };

  // Handle event resize
  const handleEventResize = (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    updateEventMutation.mutate({
      id: event.id,
      startAt: newStart,
      endAt: newEnd,
    });
  };

  // Handle task drop on calendar (time blocking)
  const handleTaskDrop = useCallback((task: Task, startAt: Date, endAt: Date) => {
    scheduleTaskMutation.mutate({
      taskId: task.id,
      startAt,
      endAt,
      calendarId: calendarOptions[0]?.id,
      createEvent: true,
    });
  }, [scheduleTaskMutation, calendarOptions]);

  // Handle create event
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

  // Handle submit event form
  const handleSubmitEvent = (data: EventFormData) => {
    if (eventModalMode === "create") {
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
    }
  };

  // Handle toggle calendar visibility
  const handleToggleCalendar = (calendarId: string) => {
    toggleCalendarVisibility(calendarId);
  };

  // Global drag start handler
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "task") {
      setDraggedTask(active.data.current.task as Task);
    }
  }, []);

  // Track pointer position during drag
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    // Store the current pointer position from the activator event
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

  // Global drag end handler
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

    // Handle task drop on calendar
    if (dragData?.type === "task" && dropData.type === "dayColumn") {
      const task = dragData.task as Task;
      const duration = task.plannedDuration || 60;

      const newStart = new Date(dropData.date);

      // Calculate the hour from pointer position if available
      if (lastPointerPositionRef.current && over.rect && dropData.hourHeight) {
        const startHour = dropData.startHour || 0;
        const relativeY = lastPointerPositionRef.current.y - over.rect.top;
        const totalMinutes = (relativeY / dropData.hourHeight) * 60 + startHour * 60;
        const roundedMinutes = Math.round(totalMinutes / 15) * 15; // Round to 15-min intervals

        const hours = Math.floor(roundedMinutes / 60);
        const minutes = roundedMinutes % 60;

        // Clamp hours to valid range
        const clampedHours = Math.max(0, Math.min(23, hours));
        const clampedMinutes = clampedHours === 23 ? Math.min(45, minutes) : minutes;

        newStart.setHours(clampedHours, clampedMinutes, 0, 0);
      } else {
        newStart.setHours(9, 0, 0, 0); // Default to 9 AM
      }

      const newEnd = addMinutes(newStart, duration);
      handleTaskDrop(task, newStart, newEnd);
    }

    lastPointerPositionRef.current = null;
  }, [handleTaskDrop]);

  // Render the appropriate view
  const renderView = () => {
    const commonProps = {
      events,
      onEventClick: handleEventClick,
      onSlotClick: handleSlotClick,
      onEventMove: handleEventMove,
      onEventResize: handleEventResize,
      onTaskDrop: handleTaskDrop,
    };

    switch (viewType) {
      case "day":
        return <DayView date={currentDate} {...commonProps} />;
      case "week":
        return <WeekView date={currentDate} {...commonProps} />;
      case "month":
        return (
          <MonthView
            date={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        );
      case "agenda":
        return (
          <AgendaView
            date={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full">
        {/* Sidebar */}
        <CalendarSidebar
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          calendars={calendars}
          onToggleCalendar={handleToggleCalendar}
          onCreateEvent={handleCreateEvent}
          onCreateCalendar={handleCreateCalendar}
          onUpdateCalendar={handleUpdateCalendar}
          onDeleteCalendar={handleDeleteCalendar}
          className="w-72 hidden lg:flex flex-col border-r"
        />

        {/* Main calendar area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Calendar Header */}
          <header className="flex items-center justify-between border-b bg-card px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={navigatePrev}
                  className="p-2 rounded-md hover:bg-accent"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={navigateToday}
                  className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-accent"
                >
                  Aujourd&apos;hui
                </button>
                <button
                  onClick={navigateNext}
                  className="p-2 rounded-md hover:bg-accent"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Current date */}
              <h2 className="text-lg font-semibold capitalize">{formatTitle()}</h2>
            </div>

            <div className="flex items-center gap-4">
              {/* View toggle */}
              <div className="flex rounded-lg border bg-muted p-1">
                {(["day", "week", "month", "agenda"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setViewType(view)}
                    className={cn(
                      "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                      viewType === view
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {view === "agenda" ? (
                      <List className="h-4 w-4" />
                    ) : (
                      viewLabels[view]
                    )}
                  </button>
                ))}
              </div>

              {/* Add event button (mobile) */}
              <button
                onClick={handleCreateEvent}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 lg:hidden"
              >
                <Plus className="h-4 w-4" />
                Nouvel événement
              </button>
            </div>
          </header>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-hidden">
            {renderView()}
          </div>
        </div>

        {/* Unscheduled Tasks Sidebar */}
        <UnscheduledTasksSidebar className="hidden lg:flex" />

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

      {/* Global Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {draggedTask && (
          <div
            className="rounded-md px-3 py-2 shadow-xl bg-primary text-primary-foreground"
            style={{ width: 180 }}
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
