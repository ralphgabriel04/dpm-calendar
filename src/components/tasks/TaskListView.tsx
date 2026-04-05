"use client";

import { useMemo } from "react";
import { format, isToday, isTomorrow, isThisWeek, isPast, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { TaskRow } from "./TaskRow";
import { cn } from "@/shared/lib/utils";

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
  checklistItems: Array<{ id: string; title: string; isCompleted: boolean }>;
  subtasks: Array<{ id: string; status: string }>;
}

interface TaskListViewProps {
  tasks: Task[];
  groupBy?: "none" | "dueDate" | "priority" | "status";
  onTaskClick?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, newStatus: string) => void;
  onTaskDelete?: (taskId: string) => void;
  selectedTaskIds?: string[];
  onTaskSelect?: (taskId: string) => void;
  showCheckboxes?: boolean;
  emptyMessage?: string;
}

const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function TaskListView({
  tasks,
  groupBy = "none",
  onTaskClick,
  onTaskStatusChange,
  onTaskDelete,
  selectedTaskIds = [],
  onTaskSelect,
  showCheckboxes = false,
  emptyMessage = "Aucune tâche",
}: TaskListViewProps) {
  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === "none") {
      // Sort by priority then by due date
      const sorted = [...tasks].sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        if (a.dueAt && b.dueAt) {
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        }
        if (a.dueAt) return -1;
        if (b.dueAt) return 1;
        return 0;
      });
      return [{ key: "all", title: "", tasks: sorted }];
    }

    if (groupBy === "dueDate") {
      const groups: Record<string, { title: string; tasks: Task[]; order: number }> = {
        overdue: { title: "En retard", tasks: [], order: 0 },
        today: { title: "Aujourd'hui", tasks: [], order: 1 },
        tomorrow: { title: "Demain", tasks: [], order: 2 },
        thisWeek: { title: "Cette semaine", tasks: [], order: 3 },
        later: { title: "Plus tard", tasks: [], order: 4 },
        noDate: { title: "Sans date", tasks: [], order: 5 },
      };

      tasks.forEach((task) => {
        if (!task.dueAt) {
          groups.noDate.tasks.push(task);
        } else {
          const dueDate = new Date(task.dueAt);
          const today = startOfDay(new Date());

          if (isPast(dueDate) && !isToday(dueDate) && task.status !== "DONE") {
            groups.overdue.tasks.push(task);
          } else if (isToday(dueDate)) {
            groups.today.tasks.push(task);
          } else if (isTomorrow(dueDate)) {
            groups.tomorrow.tasks.push(task);
          } else if (isThisWeek(dueDate)) {
            groups.thisWeek.tasks.push(task);
          } else {
            groups.later.tasks.push(task);
          }
        }
      });

      return Object.entries(groups)
        .filter(([_, group]) => group.tasks.length > 0)
        .sort(([_, a], [__, b]) => a.order - b.order)
        .map(([key, group]) => ({
          key,
          title: group.title,
          tasks: group.tasks.sort(
            (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
          ),
        }));
    }

    if (groupBy === "priority") {
      const groups: Record<string, Task[]> = {
        URGENT: [],
        HIGH: [],
        MEDIUM: [],
        LOW: [],
      };

      tasks.forEach((task) => {
        groups[task.priority].push(task);
      });

      const priorityLabels = {
        URGENT: "🔴 Urgente",
        HIGH: "🟠 Haute",
        MEDIUM: "🔵 Moyenne",
        LOW: "⚪ Faible",
      };

      return Object.entries(groups)
        .filter(([_, taskList]) => taskList.length > 0)
        .map(([priority, taskList]) => ({
          key: priority,
          title: priorityLabels[priority as keyof typeof priorityLabels],
          tasks: taskList,
        }));
    }

    if (groupBy === "status") {
      const groups: Record<string, Task[]> = {
        IN_PROGRESS: [],
        TODO: [],
        DONE: [],
      };

      tasks.forEach((task) => {
        if (task.status !== "CANCELLED" && groups[task.status]) {
          groups[task.status].push(task);
        }
      });

      const statusLabels = {
        IN_PROGRESS: "En cours",
        TODO: "À faire",
        DONE: "Terminé",
      };

      return Object.entries(groups)
        .filter(([_, taskList]) => taskList.length > 0)
        .map(([status, taskList]) => ({
          key: status,
          title: statusLabels[status as keyof typeof statusLabels],
          tasks: taskList.sort(
            (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
          ),
        }));
    }

    return [{ key: "all", title: "", tasks }];
  }, [tasks, groupBy]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {groupedTasks.map((group) => (
        <div key={group.key}>
          {group.title && (
            <div className="px-4 py-2 bg-muted/50 sticky top-0 z-10">
              <h3 className="text-sm font-medium text-muted-foreground">
                {group.title}
                <span className="ml-2 text-xs">({group.tasks.length})</span>
              </h3>
            </div>
          )}
          <div>
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
                onToggleStatus={(status) => onTaskStatusChange?.(task.id, status)}
                onDelete={() => onTaskDelete?.(task.id)}
                onEdit={() => onTaskClick?.(task)}
                isSelected={selectedTaskIds.includes(task.id)}
                onSelect={() => onTaskSelect?.(task.id)}
                showCheckbox={showCheckboxes}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
