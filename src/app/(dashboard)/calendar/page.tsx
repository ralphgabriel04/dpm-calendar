"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, List } from "lucide-react";
import { format, addHours, setHours, setMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { useCalendarStore } from "@/stores/calendar.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

// Calendar components
import { WeekView, DayView, MonthView, AgendaView, CalendarSidebar, UnscheduledTasksSidebar } from "@/components/calendar";
import { EventModal, type EventFormData } from "@/components/events";
import type { CalendarEvent } from "@/lib/calendar/utils";

// tRPC hooks
import { trpc } from "@/lib/trpc";

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

  // Fetch calendars
  const { data: calendarsData, refetch: refetchCalendars } = trpc.calendar.list.useQuery();

  // Get date range for fetching events
  const viewRange = useMemo(() => getViewRange(), [currentDate, viewType]);

  // Fetch events
  const { data: eventsData, refetch: refetchEvents } = trpc.event.list.useQuery({
    startDate: viewRange.start,
    endDate: viewRange.end,
    calendarIds: visibleCalendarIds.length > 0 ? visibleCalendarIds : undefined,
  });

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

  // Delete event mutation
  const deleteEventMutation = trpc.event.delete.useMutation({
    onSuccess: () => {
      refetchEvents();
    },
  });

  // Schedule task mutation (time blocking)
  const scheduleTaskMutation = trpc.task.scheduleTask.useMutation({
    onSuccess: () => {
      refetchEvents();
    },
  });

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
    }));
  }, [calendarsData, visibleCalendarIds]);

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
    // For now, just log the event. In future, open edit modal
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
  const handleTaskDrop = (task: { id: string; title: string }, startAt: Date, endAt: Date) => {
    scheduleTaskMutation.mutate({
      taskId: task.id,
      startAt,
      endAt,
      calendarId: calendarOptions[0]?.id,
      createEvent: true,
    });
  };

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
    } else {
      // Handle edit - would need event ID
    }
  };

  // Handle toggle calendar visibility
  const handleToggleCalendar = (calendarId: string) => {
    toggleCalendarVisibility(calendarId);
  };

  // Render the appropriate view
  const renderView = () => {
    switch (viewType) {
      case "day":
        return (
          <DayView
            date={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
            onEventMove={handleEventMove}
            onEventResize={handleEventResize}
            onTaskDrop={handleTaskDrop}
          />
        );
      case "week":
        return (
          <WeekView
            date={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
            onEventMove={handleEventMove}
            onEventResize={handleEventResize}
            onTaskDrop={handleTaskDrop}
          />
        );
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
    <div className="flex h-full">
      {/* Sidebar */}
      <CalendarSidebar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        calendars={calendars}
        onToggleCalendar={handleToggleCalendar}
        onCreateEvent={handleCreateEvent}
        className="w-64 hidden lg:flex flex-col"
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
      <UnscheduledTasksSidebar className="hidden xl:flex" />

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
  );
}
