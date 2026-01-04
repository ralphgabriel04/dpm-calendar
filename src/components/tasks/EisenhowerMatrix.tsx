"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import { AlertCircle, Target, Clock, Trash2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueAt: Date | null;
  plannedStartAt: Date | null;
  plannedDuration: number | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  tags: string[];
  subtasks: Array<{ id: string; status: string }>;
  checklistItems: Array<{ id: string; title: string; isCompleted: boolean }>;
  isUrgent?: boolean;
  isImportant?: boolean;
}

interface EisenhowerMatrixProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, status: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskEdit?: (taskId: string) => void;
  className?: string;
}

interface Quadrant {
  id: "do" | "schedule" | "delegate" | "eliminate";
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const QUADRANTS: Quadrant[] = [
  {
    id: "do",
    title: "Faire",
    subtitle: "Urgent & Important",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-900",
  },
  {
    id: "schedule",
    title: "Planifier",
    subtitle: "Important mais pas urgent",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900",
  },
  {
    id: "delegate",
    title: "Déléguer",
    subtitle: "Urgent mais pas important",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-900",
  },
  {
    id: "eliminate",
    title: "Éliminer",
    subtitle: "Ni urgent ni important",
    icon: Trash2,
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
  },
];

// Determine if a task is urgent based on due date and priority
function isTaskUrgent(task: Task): boolean {
  // If explicitly marked as urgent
  if (task.isUrgent !== undefined) return task.isUrgent;

  // Priority URGENT is always urgent
  if (task.priority === "URGENT") return true;

  // Due within 2 days is urgent
  if (task.dueAt) {
    const daysUntilDue = Math.ceil(
      (new Date(task.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDue <= 2) return true;
  }

  return false;
}

// Determine if a task is important based on priority and tags
function isTaskImportant(task: Task): boolean {
  // If explicitly marked as important
  if (task.isImportant !== undefined) return task.isImportant;

  // HIGH or URGENT priority is important
  if (task.priority === "HIGH" || task.priority === "URGENT") return true;

  // Check for important tags
  const importantTags = ["important", "priority", "goal", "key"];
  if (task.tags.some(tag => importantTags.includes(tag.toLowerCase()))) {
    return true;
  }

  // MEDIUM priority is moderately important
  if (task.priority === "MEDIUM") return true;

  return false;
}

// Get quadrant ID for a task
function getQuadrant(task: Task): Quadrant["id"] {
  const urgent = isTaskUrgent(task);
  const important = isTaskImportant(task);

  if (urgent && important) return "do";
  if (!urgent && important) return "schedule";
  if (urgent && !important) return "delegate";
  return "eliminate";
}

export function EisenhowerMatrix({
  tasks,
  onTaskClick,
  onTaskStatusChange,
  onTaskDelete,
  onTaskEdit,
  className,
}: EisenhowerMatrixProps) {
  // Filter out completed and cancelled tasks
  const activeTasks = useMemo(
    () => tasks.filter(t => t.status !== "DONE" && t.status !== "CANCELLED"),
    [tasks]
  );

  // Organize tasks into quadrants
  const quadrantTasks = useMemo(() => {
    const grouped: Record<Quadrant["id"], Task[]> = {
      do: [],
      schedule: [],
      delegate: [],
      eliminate: [],
    };

    activeTasks.forEach(task => {
      const quadrant = getQuadrant(task);
      grouped[quadrant].push(task);
    });

    // Sort each quadrant by due date then priority
    Object.values(grouped).forEach(tasks => {
      tasks.sort((a, b) => {
        // First by due date
        if (a.dueAt && b.dueAt) {
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        }
        if (a.dueAt) return -1;
        if (b.dueAt) return 1;

        // Then by priority
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    });

    return grouped;
  }, [activeTasks]);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {QUADRANTS.map((quadrant) => {
        const Icon = quadrant.icon;
        const tasks = quadrantTasks[quadrant.id];

        return (
          <div
            key={quadrant.id}
            className={cn(
              "rounded-xl border-2 p-4 min-h-[300px]",
              quadrant.bgColor,
              quadrant.borderColor
            )}
          >
            {/* Quadrant Header */}
            <div className="flex items-center gap-2 mb-4">
              <Icon className={cn("h-5 w-5", quadrant.color)} />
              <div>
                <h3 className={cn("font-semibold", quadrant.color)}>
                  {quadrant.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {quadrant.subtitle}
                </p>
              </div>
              <span className={cn(
                "ml-auto text-sm font-medium px-2 py-0.5 rounded-full",
                quadrant.color,
                quadrant.bgColor
              )}>
                {tasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune tâche dans ce quadrant
                </p>
              ) : (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                    onToggleStatus={(status) => onTaskStatusChange?.(task.id, status)}
                    onDelete={() => onTaskDelete?.(task.id)}
                    onEdit={() => onTaskEdit?.(task.id)}
                    className="bg-card"
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
