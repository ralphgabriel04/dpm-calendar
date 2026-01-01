"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
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

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, newStatus: string) => void;
  onTaskDelete?: (taskId: string) => void;
  showCancelled?: boolean;
}

const columns = [
  { id: "TODO", title: "À faire", color: "border-l-slate-400" },
  { id: "IN_PROGRESS", title: "En cours", color: "border-l-blue-500" },
  { id: "DONE", title: "Terminé", color: "border-l-green-500" },
];

export function KanbanBoard({
  tasks,
  onTaskClick,
  onTaskStatusChange,
  onTaskDelete,
  showCancelled = false,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configure sensors for better drag behavior
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    })
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      CANCELLED: [],
    };

    tasks.forEach((task) => {
      if (task.status === "CANCELLED" && !showCancelled) return;
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    // Sort by priority within each column
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    Object.keys(grouped).forEach((status) => {
      grouped[status].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    });

    return grouped;
  }, [tasks, showCancelled]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle visual feedback during drag if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    if (columns.some((col) => col.id === overId)) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== overId) {
        onTaskStatusChange?.(taskId, overId);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto p-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            tasks={tasksByStatus[column.id] || []}
            onTaskClick={onTaskClick}
            onTaskStatusChange={onTaskStatusChange}
            onTaskDelete={onTaskDelete}
          />
        ))}
      </div>

      {/* Drag overlay - shows the dragged item */}
      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            isDragging
            className="shadow-lg rotate-3"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
