"use client";

import { useState, useMemo } from "react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Plus,
  ChevronLeft,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Grip,
  Github,
  Check,
  AlertTriangle,
  Play,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/infrastructure/trpc/client";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { DayView } from "@/features/calendar/components/calendar";
import type { CalendarEvent } from "@/lib/calendar/utils";

// Step definitions
const STEPS = [
  { id: "add-task", label: "Ajouter une tâche" },
  { id: "estimate", label: "Estimer le temps" },
  { id: "fill-list", label: "Remplir la liste" },
  { id: "prioritize", label: "Prioriser" },
  { id: "schedule", label: "Planifier" },
  { id: "document", label: "Documenter" },
];

// Time presets in minutes
const TIME_PRESETS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "20 min", value: 20 },
  { label: "25 min", value: 25 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 h", value: 60 },
  { label: "1 h 30", value: 90 },
  { label: "2 h", value: 120 },
];

interface PlanningTask {
  id: string;
  title: string;
  plannedDuration: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  scheduledTime?: Date;
  isNew?: boolean;
}

// Step Progress Component
function StepProgress({ currentStep, steps }: { currentStep: number; steps: typeof STEPS }) {
  return (
    <div className="flex items-center justify-center gap-1 py-4 px-6 border-b bg-card">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  isCompleted && "bg-emerald-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="sr-only">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 whitespace-nowrap",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-16 h-0.5 mx-2 mt-[-12px]",
                  isCompleted ? "bg-emerald-500" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Time Picker Dropdown
function TimePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hrs} h`;
    return `${hrs}:${mins.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-md transition-colors",
          "bg-amber-100 text-amber-700 hover:bg-amber-200",
          "flex items-center gap-1"
        )}
      >
        {formatTime(value)}
        <AlertTriangle className="h-3 w-3" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-card border rounded-lg shadow-lg py-2 min-w-[120px]">
            <div className="px-3 py-1 text-xs text-muted-foreground">Planifié :</div>
            <div className="px-3 py-1 font-medium text-sm">{formatTime(value)}</div>
            <div className="border-t my-1" />
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  onChange(preset.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-sm hover:bg-accent flex items-center justify-between",
                  value === preset.value && "text-primary font-medium"
                )}
              >
                {preset.label}
                {value === preset.value && <Check className="h-4 w-4" />}
              </button>
            ))}
            <div className="border-t my-1" />
            <button
              onClick={() => {
                onChange(0);
                setIsOpen(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-emerald-600 hover:bg-accent"
            >
              Effacer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  showTimeEstimate,
  onUpdateDuration,
  onToggleComplete,
  isCompleted,
}: {
  task: PlanningTask;
  showTimeEstimate?: boolean;
  onUpdateDuration?: (duration: number) => void;
  onToggleComplete?: () => void;
  isCompleted?: boolean;
}) {
  const formatTime = (minutes: number) => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hrs}:00`;
    return `${hrs}:${mins.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-card border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleComplete}
          className={cn(
            "mt-0.5 h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
            isCompleted
              ? "bg-emerald-500 border-emerald-500"
              : "border-muted-foreground/30 hover:border-primary"
          )}
        >
          {isCompleted && <Check className="h-3 w-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              {task.scheduledTime && (
                <span className="text-xs text-muted-foreground">
                  {format(task.scheduledTime, "h:mm a")}
                </span>
              )}
              <h4
                className={cn(
                  "font-medium text-sm",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h4>
            </div>
            {showTimeEstimate && onUpdateDuration ? (
              <TimePicker
                value={task.plannedDuration}
                onChange={onUpdateDuration}
              />
            ) : task.plannedDuration > 0 ? (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                {formatTime(task.plannedDuration)}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Circle className="h-3 w-3 text-muted-foreground" />
            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground ml-auto"># work</span>
          </div>
        </div>
      </div>
      {task.plannedDuration > 0 && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <Play className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            PLANIFIÉ<br />
            {formatTime(task.plannedDuration)}
          </span>
        </div>
      )}
    </div>
  );
}

// Workload Bar Component
function WorkloadBar({ plannedMinutes, maxMinutes = 480 }: { plannedMinutes: number; maxMinutes?: number }) {
  const hours = Math.floor(plannedMinutes / 60);
  const mins = plannedMinutes % 60;
  const percentage = Math.min((plannedMinutes / maxMinutes) * 100, 100);

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">Temps total planifié</h3>
      <div className="flex items-center gap-2">
        <span className="bg-emerald-500 text-white px-3 py-1 rounded-md text-sm font-medium">
          {hours > 0 ? `${hours} h` : ""} {mins > 0 ? `${mins} min` : hours === 0 ? "0 min" : ""}
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span></span>
        <span>6 h</span>
        <span>8 h</span>
      </div>
    </div>
  );
}

export default function DailyPlanningPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [obstacles, setObstacles] = useState("");
  const tomorrow = addDays(new Date(), 1);

  // Fetch existing tasks
  const { data: existingTasks } = trpc.task.list.useQuery({
    includeCompleted: false,
  });

  // Fetch tomorrow's events
  const tomorrowStart = new Date(tomorrow);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const { data: eventsData } = trpc.event.list.useQuery({
    startDate: tomorrowStart,
    endDate: tomorrowEnd,
  });

  // Mutations
  const createTaskMutation = trpc.task.create.useMutation();
  const updateTaskMutation = trpc.task.update.useMutation();

  // Transform events for calendar
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

  // Calculate total planned time
  const totalPlannedMinutes = tasks.reduce((acc, t) => acc + (t.plannedDuration || 0), 0);

  // Add new task
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: PlanningTask = {
      id: `temp-${Date.now()}`,
      title: newTaskTitle.trim(),
      plannedDuration: 60, // Default 1 hour
      priority: "MEDIUM",
      isNew: true,
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
  };

  // Update task duration
  const handleUpdateDuration = (taskId: string, duration: number) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, plannedDuration: duration } : t)));
  };

  // Go to next step
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Go to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete planning
  const handleDone = async () => {
    // Save all new tasks
    for (const task of tasks.filter((t) => t.isNew)) {
      try {
        await createTaskMutation.mutateAsync({
          title: task.title,
          plannedDuration: task.plannedDuration,
          priority: task.priority,
          dueAt: tomorrow,
        });
      } catch {
        toast.error(`Échec de création de la tâche : ${task.title}`);
      }
    }

    toast.success("Plan quotidien sauvegardé !");
    window.location.href = "/planner";
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome / Add task
        return (
          <div className="flex h-full">
            {/* Left Panel */}
            <div className="w-80 p-6 border-r">
              <h1 className="text-2xl font-bold italic mb-2">
                Bienvenue dans votre nouvelle routine de planification quotidienne
              </h1>
              <p className="text-muted-foreground mb-8">
                Une fois par jour, nous vous aiderons à planifier votre journée.
              </p>
              <Button onClick={handleNext} className="w-full" size="lg">
                Planifier demain
              </Button>
            </div>
            {/* Main content area - empty for welcome */}
            <div className="flex-1" />
          </div>
        );

      case 1: // Add tasks
        return (
          <div className="flex h-full">
            {/* Left Panel */}
            <div className="w-80 p-6 border-r">
              <h1 className="text-xl font-bold mb-2">
                Que devez-vous faire demain ?
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                Ajoutez les tâches que vous souhaitez accomplir.
              </p>
              <Button onClick={handleNext} className="w-full" size="lg">
                Suivant
              </Button>
            </div>

            {/* Center - Task List */}
            <div className="flex-1 p-6 max-w-xl">
              <h2 className="text-xl font-semibold mb-1">Demain</h2>
              <p className="text-muted-foreground text-sm mb-4">
                {format(tomorrow, "EEEE d MMMM", { locale: fr })}
              </p>

              {/* Add task input */}
              <div className="flex items-center gap-2 mb-4 p-3 border rounded-lg bg-card">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ajouter une tâche"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  className="border-0 p-0 h-auto focus-visible:ring-0"
                />
                <span className="text-xs text-muted-foreground">Travail : 1:00</span>
              </div>

              {/* Task list */}
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={() => {}}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Estimate timing
        return (
          <div className="flex h-full">
            {/* Left Panel */}
            <div className="w-80 p-6 border-r space-y-6">
              <div>
                <h1 className="text-xl font-bold mb-2">
                  Combien de temps prévoyez-vous consacrer à cela ?
                </h1>
                <p className="text-muted-foreground text-sm">
                  Définissez le temps prévu pour chaque tâche.
                </p>
              </div>

              <WorkloadBar plannedMinutes={totalPlannedMinutes} />

              <Button onClick={handleNext} className="w-full" size="lg">
                Suivant
              </Button>
            </div>

            {/* Center - Task List with time estimates */}
            <div className="flex-1 p-6 max-w-xl">
              <h2 className="text-xl font-semibold mb-4">Demain</h2>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    showTimeEstimate
                    onUpdateDuration={(duration) => handleUpdateDuration(task.id, duration)}
                  />
                ))}
              </div>

              {tasks.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Aucune tâche ajoutée. Revenez en arrière pour ajouter des tâches.
                </p>
              )}
            </div>
          </div>
        );

      case 3: // Fill task list
        return (
          <div className="flex h-full">
            {/* Left Panel */}
            <div className="w-80 p-6 border-r">
              <h1 className="text-xl font-bold mb-2">Remplissez votre journée</h1>
              <p className="text-muted-foreground text-sm mb-6">
                Créez de nouvelles tâches ou importez-les depuis vos outils existants.
              </p>

              <div className="space-y-2 mb-6">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Github className="h-4 w-4" />
                  Ajouter depuis GitHub
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Ajouter depuis Google Tasks
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <span className="font-bold">N</span>
                  Ajouter depuis Notion
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                  Ajouter depuis Outlook
                </Button>
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                Suivant
              </Button>
            </div>

            {/* Center - Task List */}
            <div className="w-96 p-6 border-r">
              <h2 className="text-xl font-semibold mb-1">Demain</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Planifiez votre travail pour demain
              </p>

              {/* Add task */}
              <div className="flex items-center gap-2 mb-4 p-3 border rounded-lg bg-card">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ajouter une tâche"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  className="border-0 p-0 h-auto focus-visible:ring-0"
                />
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>

            {/* Right - Calendar */}
            <div className="flex-1 overflow-hidden">
              <DayView
                date={tomorrow}
                events={events}
                onEventClick={() => {}}
                onSlotClick={() => {}}
              />
            </div>
          </div>
        );

      case 4: // Prioritize
        return (
          <div className="flex h-full">
            {/* Left Panel */}
            <div className="w-80 p-6 border-r">
              <h1 className="text-xl font-bold mb-2">Priorisez vos tâches</h1>
              <p className="text-muted-foreground text-sm mb-6">
                Glissez pour réordonner les tâches par importance. Les plus importantes doivent être en haut.
              </p>

              <Button onClick={handleNext} className="w-full" size="lg">
                Suivant
              </Button>
            </div>

            {/* Center - Draggable Task List */}
            <div className="flex-1 p-6 max-w-xl">
              <h2 className="text-xl font-semibold mb-4">Demain</h2>

              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-3 bg-card border rounded-lg hover:shadow-sm cursor-grab"
                  >
                    <Grip className="h-4 w-4 text-muted-foreground" />
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-medium text-sm">{task.title}</span>
                    {task.plannedDuration > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {task.plannedDuration >= 60
                          ? `${Math.floor(task.plannedDuration / 60)}h`
                          : `${task.plannedDuration}m`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Schedule
        return (
          <div className="flex h-full">
            {/* Left Panel */}
            <div className="w-80 p-6 border-r">
              <h1 className="text-xl font-bold mb-2">Planifiez vos tâches</h1>
              <p className="text-muted-foreground text-sm mb-6">
                Glissez les tâches vers le calendrier pour les programmer à des heures spécifiques.
              </p>

              <div className="space-y-2 mb-6">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-2 bg-card border rounded-lg text-sm cursor-grab"
                  >
                    <Grip className="h-3 w-3 text-muted-foreground" />
                    <span className="flex-1 truncate">{task.title}</span>
                  </div>
                ))}
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                Suivant
              </Button>
            </div>

            {/* Calendar View */}
            <div className="flex-1 overflow-hidden">
              <DayView
                date={tomorrow}
                events={events}
                onEventClick={() => {}}
                onSlotClick={() => {}}
              />
            </div>
          </div>
        );

      case 6: // Document
        return (
          <div className="flex h-full">
            {/* Left Panel - Daily Plan Document */}
            <div className="flex-1 p-6 max-w-2xl">
              <h1 className="text-2xl font-bold mb-1">Plan quotidien</h1>
              <p className="text-muted-foreground mb-6">
                Documentez et partagez votre plan pour demain.
              </p>

              <div className="bg-card border rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Prévu pour demain</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {tasks.map((task) => (
                      <li key={task.id}>
                        {task.title} · {task.plannedDuration >= 60 ? `${Math.floor(task.plannedDuration / 60)} h` : `${task.plannedDuration} min`}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Obstacles à surmonter</h3>
                  <ul className="list-disc list-inside text-sm">
                    <li>
                      <Input
                        placeholder="Ajouter un obstacle..."
                        value={obstacles}
                        onChange={(e) => setObstacles(e.target.value)}
                        className="inline-block w-auto border-0 border-b rounded-none p-0 h-auto focus-visible:ring-0"
                      />
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2">
                  Publier
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </Button>
                <Button onClick={handleDone}>Terminé</Button>
              </div>
            </div>

            {/* Right - Task summary */}
            <div className="w-80 p-6 border-l">
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div>
          <h1 className="font-semibold">
            Planification de votre <span className="text-primary">première</span> journée
          </h1>
          <p className="text-xs text-muted-foreground">
            Étape {currentStep} / {STEPS.length}
          </p>
        </div>
      </div>

      {/* Step Progress */}
      <StepProgress currentStep={currentStep} steps={STEPS} />

      {/* Progress bar */}
      <div className="h-1 bg-emerald-500" style={{ width: `${((currentStep) / STEPS.length) * 100}%` }} />

      {/* Content */}
      <div className="flex-1 overflow-hidden">{renderStepContent()}</div>
    </div>
  );
}
