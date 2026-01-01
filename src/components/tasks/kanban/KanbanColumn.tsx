"use client";

import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { DraggableTaskCard } from "./DraggableTaskCard";
import { cn } from "@/lib/utils";

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

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, newStatus: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onAddTask?: () => void;
}

export function KanbanColumn({
  id,
  title,
  color,
  tasks,
  onTaskClick,
  onTaskStatusChange,
  onTaskDelete,
  onAddTask,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-80 min-w-[320px] bg-muted/30 rounded-lg border-l-4 transition-colors",
        color,
        isOver && "bg-primary/10 ring-2 ring-primary/20"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tasks.length === 0 ? (
          <div
            className={cn(
              "text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg transition-colors",
              isOver && "border-primary/50 bg-primary/5"
            )}
          >
            {isOver ? "Déposer ici" : "Aucune tâche"}
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
              onToggleStatus={(status) => onTaskStatusChange?.(task.id, status)}
              onDelete={() => onTaskDelete?.(task.id)}
              onEdit={() => onTaskClick?.(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}
