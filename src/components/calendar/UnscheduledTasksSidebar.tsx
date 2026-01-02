"use client";

import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { DraggableTaskMini } from "./DraggableTaskMini";
import { trpc } from "@/lib/trpc";

interface UnscheduledTasksSidebarProps {
  className?: string;
  isCollapsed?: boolean;
}

export function UnscheduledTasksSidebar({
  className,
  isCollapsed = false,
}: UnscheduledTasksSidebarProps) {
  const { data: tasks, isLoading } = trpc.task.getUnscheduled.useQuery();

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "border-l bg-card flex flex-col items-center py-4",
          className
        )}
      />
    );
  }

  return (
    <div className={cn("border-l bg-card flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <ListTodo className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Taches a planifier</h3>
      </div>

      {/* Task count */}
      <div className="px-3 py-2 text-xs text-muted-foreground border-b">
        {tasks?.length || 0} tache{(tasks?.length || 0) > 1 ? "s" : ""} non
        planifiee{(tasks?.length || 0) > 1 ? "s" : ""}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
            Chargement...
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <DraggableTaskMini
                key={task.id}
                task={{
                  id: task.id,
                  title: task.title,
                  priority: task.priority,
                  status: task.status,
                  plannedDuration: task.plannedDuration,
                  dueAt: task.dueAt,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
            <ListTodo className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Aucune tache a planifier</p>
            <p className="text-xs mt-1">
              Glissez des taches ici depuis la page Taches
            </p>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Glissez une tache sur le calendrier pour la planifier
        </p>
      </div>
    </div>
  );
}
