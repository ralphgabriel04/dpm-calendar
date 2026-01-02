"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, List, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight } from "lucide-react";
import { format, addHours, setHours, setMinutes, addMinutes } from "date-fns";
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
import { useCalendarStore } from "@/stores/calendar.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

// Calendar components
import { WeekView, DayView, MonthView, AgendaView, CalendarSidebar, UnscheduledTasksSidebar } from "@/components/calendar";
import { EventModal, type EventFormData } from "@/components/events";
import type { CalendarEvent } from "@/lib/calendar/utils";

// tRPC hooks
import { trpc } from "@/lib/trpc";

interface CalendarSection {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  position: number;
  isExpanded: boolean;
}

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

  // State for sidebar collapse
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTasksSidebarCollapsed, setIsTasksSidebarCollapsed] = useState(false);

  // State for drag overlay
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Track pointer position during drag for precise hour calculation
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Fetch calendars
  const { data: calendarsData, refetch: refetchCalendars } = trpc.calendar.list.useQuery();

  // Fetch sections
  const { data: sectionsData, refetch: refetchSections } = trpc.calendarSection.list.useQuery();

  // Calendar mutations
  const createCalendarMutation = trpc.calendar.create.useMutation({
    onSuccess: () => {
      refetchCalendars();
      toast.success("Calendrier cree avec succes");
    },
    onError: (error) => {
      toast.error("Erreur lors de la creation du calendrier", {
        description: error.message,
      });
    },
  });

  const updateCalendarMutation = trpc.calendar.update.useMutation({
    onSuccess: () => {
      refetchCalendars();
      toast.success("Calendrier modifie");
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification", {
        description: error.message,
      });
    },
  });

  const deleteCalendarMutation = trpc.calendar.delete.useMutation({
    onSuccess: () => {
      refetchCalendars();
      toast.success("Calendrier supprime");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression", {
        description: error.message,
      });
    },
  });

  // Section mutations
  const createSectionMutation = trpc.calendarSection.create.useMutation({
    onSuccess: () => {
      refetchSections();
      toast.success("Section creee");
    },
    onError: (error) => {
      toast.error("Erreur lors de la creation de la section", {
        description: error.message,
      });
    },
  });

  const updateSectionMutation = trpc.calendarSection.update.useMutation({
    onSuccess: () => {
      refetchSections();
      toast.success("Section modifiee");
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification", {
        description: error.message,
      });
    },
  });

  const deleteSectionMutation = trpc.calendarSection.delete.useMutation({
    onSuccess: () => {
      refetchSections();
      refetchCalendars();
      toast.success("Section supprimee");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression", {
        description: error.message,
      });
    },
  });

  const moveCalendarMutation = trpc.calendarSection.moveCalendar.useMutation({
    onSuccess: () => {
      refetchCalendars();
      toast.success("Calendrier deplace");
    },
    onError: (error) => {
      toast.error("Erreur lors du deplacement", {
        description: error.message,
      });
    },
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
      toast.success("Evenement cree");
    },
    onError: (error) => {
      toast.error("Erreur lors de la creation de l'evenement", {
        description: error.message,
      });
    },
  });

  // Update event mutation
  const updateEventMutation = trpc.event.update.useMutation({
    onSuccess: () => {
      refetchEvents();
      closeEventModal();
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification", {
        description: error.message,
      });
    },
  });

  // Schedule task mutation (time blocking)
  const scheduleTaskMutation = trpc.task.scheduleTask.useMutation({
    onSuccess: () => {
      refetchEvents();
      refetchTasks();
      toast.success("Tache planifiee");
    },
    onError: (error) => {
      toast.error("Erreur lors de la planification", {
        description: error.message,
      });
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
      sectionId: cal.sectionId,
    }));
  }, [calendarsData, visibleCalendarIds]);

  // Transform sections for sidebar
  const sections: CalendarSection[] = useMemo(() => {
    if (!sectionsData) return [];
    return sectionsData.map((section) => ({
      id: section.id,
      name: section.name,
      color: section.color,
      icon: section.icon,
      position: section.position,
      isExpanded: section.isExpanded,
    }));
  }, [sectionsData]);

  // Calendar CRUD handlers
  const handleCreateCalendar = useCallback((name: string, color: string, sectionId?: string) => {
    createCalendarMutation.mutate({ name, color, sectionId });
  }, [createCalendarMutation]);

  const handleUpdateCalendar = useCallback((id: string, name: string, color: string) => {
    updateCalendarMutation.mutate({ id, name, color });
  }, [updateCalendarMutation]);

  const handleDeleteCalendar = useCallback((id: string) => {
    deleteCalendarMutation.mutate({ id });
  }, [deleteCalendarMutation]);

  // Section CRUD handlers
  const handleCreateSection = useCallback((name: string, color?: string) => {
    createSectionMutation.mutate({ name, color });
  }, [createSectionMutation]);

  const handleUpdateSection = useCallback((id: string, name: string, color?: string) => {
    updateSectionMutation.mutate({ id, name, color });
  }, [updateSectionMutation]);

  const handleDeleteSection = useCallback((id: string) => {
    deleteSectionMutation.mutate({ id });
  }, [deleteSectionMutation]);

  const handleMoveCalendarToSection = useCallback((calendarId: string, sectionId: string | null) => {
    moveCalendarMutation.mutate({ calendarId, sectionId });
  }, [moveCalendarMutation]);

  const handleToggleSectionExpanded = useCallback((id: string, isExpanded: boolean) => {
    updateSectionMutation.mutate({ id, isExpanded });
  }, [updateSectionMutation]);

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
          sections={sections}
          onToggleCalendar={handleToggleCalendar}
          onCreateEvent={handleCreateEvent}
          onCreateCalendar={handleCreateCalendar}
          onUpdateCalendar={handleUpdateCalendar}
          onDeleteCalendar={handleDeleteCalendar}
          onMoveCalendarToSection={handleMoveCalendarToSection}
          onCreateSection={handleCreateSection}
          onUpdateSection={handleUpdateSection}
          onDeleteSection={handleDeleteSection}
          onToggleSectionExpanded={handleToggleSectionExpanded}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "hidden lg:flex flex-col border-r transition-all duration-300",
            isSidebarCollapsed ? "w-12" : "w-72"
          )}
        />

        {/* Main calendar area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Calendar Header */}
          <header className="flex items-center justify-between border-b bg-card px-3 py-2 md:px-4 md:py-3">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Left panel toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="h-8 w-8 p-0 hidden lg:flex"
              >
                {isSidebarCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>

              {/* Navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={navigatePrev}
                  className="p-1.5 md:p-2 rounded-md hover:bg-accent"
                >
                  <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={navigateToday}
                  className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded-md hover:bg-accent"
                >
                  Aujourd&apos;hui
                </button>
                <button
                  onClick={navigateNext}
                  className="p-1.5 md:p-2 rounded-md hover:bg-accent"
                >
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>

              {/* Current date */}
              <h2 className="text-sm md:text-lg font-semibold capitalize hidden sm:block">{formatTitle()}</h2>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* View toggle */}
              <div className="flex rounded-lg border bg-muted p-0.5">
                {(["day", "week", "month", "agenda"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setViewType(view)}
                    className={cn(
                      "px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm font-medium rounded-md transition-colors",
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

              {/* Right panel toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTasksSidebarCollapsed(!isTasksSidebarCollapsed)}
                className="h-8 w-8 p-0 hidden lg:flex"
              >
                {isTasksSidebarCollapsed ? (
                  <PanelRight className="h-4 w-4" />
                ) : (
                  <PanelRightClose className="h-4 w-4" />
                )}
              </Button>

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
        <UnscheduledTasksSidebar
          isCollapsed={isTasksSidebarCollapsed}
          className={cn(
            "hidden lg:flex flex-col transition-all duration-300",
            isTasksSidebarCollapsed ? "w-12" : "w-64"
          )}
        />

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
