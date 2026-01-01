"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "../TaskCard";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueAt: Date | null;
  plannedStartAt?: Date | null;
  plannedDuration?: number | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  tags: string[];
  checklistItems: Array<{ id: string; title: string; isCompleted: boolean }>;
  subtasks: Array<{ id: string; status: string }>;
}

interface DraggableTaskCardProps {
  task: Task;
  onClick?: () => void;
  onToggleStatus?: (status: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function DraggableTaskCard({
  task,
  onClick,
  onToggleStatus,
  onDelete,
  onEdit,
}: DraggableTaskCardProps) {
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
      className={isDragging ? "opacity-50" : ""}
    >
      <TaskCard
        task={task}
        onClick={onClick}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
        onEdit={onEdit}
        isDragging={isDragging}
      />
    </div>
  );
}
