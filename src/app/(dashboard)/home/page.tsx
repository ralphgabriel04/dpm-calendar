"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Plus,
  Calendar,
  Target,
  ArrowRight,
  Sun,
  Moon,
  CloudSun,
  Flame,
  BarChart3,
  ListChecks,
  Clock,
} from "lucide-react";
import { trpc } from "@/infrastructure/trpc/client";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/Button";
import {
  WorkloadBar,
  CurrentTaskCard,
  EnergyCheck,
  DailyOverview,
  MiniTimeline,
  QuickActions,
  SmartTipsCard,
  MoodModal,
} from "@/features/home/components";

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [energyLevel, setEnergyLevel] = useState<number | undefined>();
  const [moodModalOpen, setMoodModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [availableMinutes, setAvailableMinutes] = useState(480);

  // Handle energy level change - show modal
  const handleEnergyChange = (value: number) => {
    setEnergyLevel(value);
    setMoodModalOpen(true);
  };

  // Save mood note (could be saved to database later)
  const handleSaveMoodNote = (_note: string) => {
    // TODO: Save to database via API when mood tracking is implemented
  };

  // Load available minutes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dpm-available-minutes");
    if (saved) {
      setAvailableMinutes(parseInt(saved));
    }
  }, []);

  // Save available minutes to localStorage
  const handleAvailableMinutesChange = (minutes: number) => {
    setAvailableMinutes(minutes);
    localStorage.setItem("dpm-available-minutes", minutes.toString());
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get current time for greeting
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: "Bonjour", icon: Sun };
    if (hour < 18) return { text: "Bon après-midi", icon: CloudSun };
    return { text: "Bonsoir", icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Get user's first name
  const userName = session?.user?.name?.split(" ")[0] || "";

  // Fetch today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const utils = trpc.useUtils();

  const { data: tasksData } = trpc.task.list.useQuery({
    includeCompleted: true,
  });

  // Fetch upcoming events (next 7 days)
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const { data: eventsData } = trpc.event.list.useQuery({
    startDate: today,
    endDate: nextWeek,
  });

  // Fetch habits
  const { data: habitsData } = trpc.habit.list.useQuery({});

  // Transform and filter tasks
  const tasks = useMemo(() => {
    if (!tasksData) return [];
    return tasksData
      .filter((task) => {
        // Include tasks due today or with no due date but in progress
        if (task.status === "DONE" || task.status === "CANCELLED") return true;
        if (!task.dueAt) return task.status === "IN_PROGRESS";
        const dueDate = new Date(task.dueAt);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() <= today.getTime();
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

  // Get current and next task
  const pendingTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const currentTask = pendingTasks.find((t) => t.status === "IN_PROGRESS") || pendingTasks[0] || null;
  const nextTask = pendingTasks.find((t) => t.id !== currentTask?.id) || null;

  // Calculate stats
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const totalTasks = tasks.length;

  // Calculate workload
  const plannedMinutes = tasks
    .filter((t) => t.status !== "DONE")
    .reduce((acc, t) => acc + (t.plannedDuration || 30), 0);
  const completedMinutes = tasks
    .filter((t) => t.status === "DONE")
    .reduce((acc, t) => acc + (t.plannedDuration || 30), 0);

  // Calculate meeting minutes from events
  const meetings = eventsData?.filter((e) => !e.isAllDay) || [];
  const meetingMinutes = meetings.reduce((acc, e) => {
    const start = new Date(e.startAt);
    const end = new Date(e.endAt);
    return acc + Math.round((end.getTime() - start.getTime()) / 60000);
  }, 0);

  // Transform events for timeline
  const timelineEvents = useMemo(() => {
    if (!eventsData) return [];
    const now = new Date();
    return eventsData
      .filter((e) => new Date(e.endAt) > now)
      .map((e) => ({
        id: e.id,
        title: e.title,
        startAt: new Date(e.startAt),
        endAt: new Date(e.endAt),
        type: "event" as const,
      }))
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }, [eventsData]);

  // Calculate habits progress
  const habitsCompleted = habitsData?.filter((h) => {
    // Check if habit was completed today by looking at logs
    if (!h.logs || h.logs.length === 0) return false;
    const todayLog = h.logs.find((log) => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime() && log.completed;
    });
    return !!todayLog;
  }).length || 0;
  const habitsTotal = habitsData?.filter((h) => h.isActive !== false).length || 0;

  // Focus time (from tasks with plannedDuration that are time-blocked)
  const focusTimeMinutes = plannedMinutes;

  // Task mutations with cache invalidation
  const updateTaskMutation = trpc.task.update.useMutation({
    onSuccess: () => {
      // Invalidate task list to refresh data immediately
      utils.task.list.invalidate();
    },
  });

  const handleCompleteTask = (taskId: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      status: "DONE",
    });
  };

  const handleSkipTask = (taskId: string) => {
    // Move to next task by setting current one to TODO
    updateTaskMutation.mutate({
      id: taskId,
      status: "TODO",
    });
  };

  // Handle task selection (switch current task)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    // Set the selected task to IN_PROGRESS
    updateTaskMutation.mutate({
      id: taskId,
      status: "IN_PROGRESS",
    });
  };

  // Quick actions - expanded list
  const quickActions = [
    {
      label: "Nouvelle tâche",
      icon: Plus,
      onClick: () => router.push("/tasks"),
      variant: "primary" as const,
    },
    {
      label: "Calendrier",
      icon: Calendar,
      onClick: () => router.push("/calendar"),
    },
    {
      label: "Focus",
      icon: Target,
      onClick: () => router.push("/planner?focus=true"),
    },
    {
      label: "Habitudes",
      icon: Flame,
      onClick: () => router.push("/habits"),
    },
    {
      label: "Analytics",
      icon: BarChart3,
      onClick: () => router.push("/analytics"),
    },
    {
      label: "Toutes les tâches",
      icon: ListChecks,
      onClick: () => router.push("/tasks"),
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <header className="border-b bg-card px-4 py-4 md:px-6 md:py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <GreetingIcon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {greeting.text}{userName ? `, ${userName}` : ""} !
                </h1>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {format(currentTime, "HH:mm", { locale: fr })}
                  </span>
                  {" · "}
                  {format(currentTime, "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>

            {/* Energy check - compact on mobile */}
            <div className="hidden sm:block">
              <EnergyCheck
                value={energyLevel}
                onChange={handleEnergyChange}
                compact
              />
            </div>
          </div>

          {/* Energy check - full on mobile */}
          <div className="sm:hidden mt-4">
            <EnergyCheck value={energyLevel} onChange={handleEnergyChange} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          {/* Workload bar */}
          <div className="rounded-xl border bg-card p-4 md:p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Charge de travail aujourd&apos;hui
            </h3>
            <WorkloadBar
              plannedMinutes={plannedMinutes}
              completedMinutes={completedMinutes}
              meetingMinutes={meetingMinutes}
              availableMinutes={availableMinutes}
              onAvailableMinutesChange={handleAvailableMinutesChange}
              editable
            />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Current task */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current task card */}
              <CurrentTaskCard
                task={selectedTaskId ? pendingTasks.find(t => t.id === selectedTaskId) || currentTask : currentTask}
                nextTask={nextTask}
                allTasks={pendingTasks}
                onComplete={handleCompleteTask}
                onSkip={handleSkipTask}
                onSelectTask={handleSelectTask}
              />

              {/* Daily overview */}
              <DailyOverview
                totalTasks={totalTasks}
                completedTasks={completedTasks}
                meetings={meetings.length}
                focusTimeMinutes={focusTimeMinutes}
                habitsCompleted={habitsCompleted}
                habitsTotal={habitsTotal}
              />

              {/* Quick actions */}
              <div className="rounded-xl border bg-card p-4 md:p-5">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Actions rapides
                </h3>
                <QuickActions actions={quickActions} />
              </div>
            </div>

            {/* Right column - Timeline */}
            <div className="space-y-6">
              {/* Upcoming events */}
              <div className="rounded-xl border bg-card p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    À venir
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/calendar")}
                    className="text-xs"
                  >
                    Voir tout
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <MiniTimeline events={timelineEvents} />
              </div>

              {/* Pending tasks list */}
              {pendingTasks.length > 0 && (
                <div className="rounded-xl border bg-card p-4 md:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Tâches du jour ({pendingTasks.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/tasks")}
                      className="text-xs"
                    >
                      Gérer
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {pendingTasks.slice(0, 5).map((task) => {
                      const isCurrentTask = (selectedTaskId ? selectedTaskId === task.id : task.id === currentTask?.id);
                      return (
                        <button
                          key={task.id}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg text-left",
                            "hover:bg-muted/50 transition-colors",
                            isCurrentTask && "bg-primary/5 border border-primary/20"
                          )}
                          onClick={() => handleSelectTask(task.id)}
                        >
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              task.priority === "URGENT" && "bg-red-500",
                              task.priority === "HIGH" && "bg-orange-500",
                              task.priority === "MEDIUM" && "bg-yellow-500",
                              task.priority === "LOW" && "bg-green-500"
                            )}
                          />
                          <span className="text-sm flex-1 truncate">
                            {task.title}
                          </span>
                          {task.plannedDuration && (
                            <span className="text-xs text-muted-foreground">
                              {task.plannedDuration}m
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Smart Tips Card */}
              <SmartTipsCard
                completedTasks={completedTasks}
                totalTasks={totalTasks}
                meetingsCount={meetings.length}
                meetingMinutes={meetingMinutes}
                energyLevel={energyLevel}
                habitsCompleted={habitsCompleted}
                habitsTotal={habitsTotal}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mood Modal */}
      {energyLevel && (
        <MoodModal
          isOpen={moodModalOpen}
          onClose={() => setMoodModalOpen(false)}
          energyLevel={energyLevel}
          onSaveNote={handleSaveMoodNote}
        />
      )}
    </div>
  );
}
