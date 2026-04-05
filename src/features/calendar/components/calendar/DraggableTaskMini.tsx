"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clock, Flag } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface Task {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  plannedDuration?: number | null;
  dueAt?: Date | null;
}

interface DraggableTaskMiniProps {
  task: Task;
  className?: string;
}

const priorityColors = {
  LOW: "border-l-slate-400",
  MEDIUM: "border-l-blue-500",
  HIGH: "border-l-orange-500",
  URGENT: "border-l-red-500",
};

const priorityLabels = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

export function DraggableTaskMini({ task, className }: DraggableTaskMiniProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `task-${task.id}`,
      data: {
        type: "task",
        task,
      },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-2 rounded border bg-card cursor-grab border-l-4",
        "hover:border-primary hover:shadow-sm transition-all",
        priorityColors[task.priority],
        isDragging && "opacity-50 shadow-lg",
        className
      )}
    >
      <div className="font-medium text-sm truncate">{task.title}</div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
        {task.plannedDuration && (
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {task.plannedDuration}min
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <Flag className="h-3 w-3" />
          {priorityLabels[task.priority]}
        </span>
      </div>
    </div>
  );
}
