"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { EisenhowerMatrix } from "@/components/tasks/EisenhowerMatrix";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TaskForm, TaskFormData } from "@/components/tasks/TaskForm";
import { Plus, Grid3X3, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

// Loading skeleton
function MatrixSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-80 bg-muted rounded-xl" />
      ))}
    </div>
  );
}

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
}

export default function MatrixPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Fetch all active tasks
  const { data: tasks, isLoading } = trpc.task.list.useQuery({
    status: ["TODO", "IN_PROGRESS"],
  });

  // Get task for editing
  const { data: editingTask } = trpc.task.get.useQuery(
    { id: editingTaskId! },
    { enabled: !!editingTaskId }
  );

  // Mutations
  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      setIsCreateOpen(false);
    },
  });

  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      setEditingTaskId(null);
    },
  });

  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
    },
  });

  const handleCreate = async (data: TaskFormData) => {
    await createTask.mutateAsync({
      title: data.title,
      description: data.description,
      notes: data.notes,
      url: data.url,
      dueAt: data.dueAt,
      plannedStartAt: data.plannedStartAt,
      plannedDuration: data.plannedDuration,
      priority: data.priority,
      tags: data.tags,
      estimatedEnergy: data.estimatedEnergy,
    });
  };

  const handleUpdate = async (data: TaskFormData) => {
    if (!editingTaskId) return;
    await updateTask.mutateAsync({
      id: editingTaskId,
      title: data.title,
      description: data.description,
      notes: data.notes,
      url: data.url,
      dueAt: data.dueAt,
      plannedStartAt: data.plannedStartAt,
      plannedDuration: data.plannedDuration,
      priority: data.priority,
      status: data.status,
      tags: data.tags,
      estimatedEnergy: data.estimatedEnergy,
    });
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    await updateTask.mutateAsync({
      id: taskId,
      status: status as "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED",
    });
  };

  const handleDelete = async (taskId: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette tâche?")) {
      await deleteTask.mutateAsync({ id: taskId });
    }
  };

  // Transform tasks to match EisenhowerMatrix interface
  const transformedTasks: Task[] = (tasks || []).map((t) => ({
    ...t,
    subtasks: t.subtasks?.map((s) => ({ id: s.id, status: s.status })) || [],
    checklistItems: t.checklistItems || [],
  }));

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Grid3X3 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Matrice Eisenhower</h1>
              <p className="text-sm text-muted-foreground">
                Organisez vos tâches par urgence et importance
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-accent">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <div className="space-y-2 text-sm">
                    <p><strong>Quadrant 1 - Faire:</strong> Tâches urgentes et importantes. À faire immédiatement.</p>
                    <p><strong>Quadrant 2 - Planifier:</strong> Tâches importantes mais pas urgentes. À planifier.</p>
                    <p><strong>Quadrant 3 - Déléguer:</strong> Tâches urgentes mais pas importantes. À déléguer si possible.</p>
                    <p><strong>Quadrant 4 - Éliminer:</strong> Tâches ni urgentes ni importantes. À éliminer.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>

        {/* Matrix */}
        {isLoading ? (
          <MatrixSkeleton />
        ) : (
          <EisenhowerMatrix
            tasks={transformedTasks}
            onTaskClick={(task) => setEditingTaskId(task.id)}
            onTaskStatusChange={handleStatusChange}
            onTaskDelete={handleDelete}
            onTaskEdit={(id) => setEditingTaskId(id)}
          />
        )}

        {/* Legend */}
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold mb-3">Comment ça fonctionne</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 mt-1 rounded-full bg-red-500" />
              <div>
                <p className="font-medium">Urgent</p>
                <p className="text-muted-foreground text-xs">
                  Priorité URGENTE ou échéance dans 2 jours
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 mt-1 rounded-full bg-blue-500" />
              <div>
                <p className="font-medium">Important</p>
                <p className="text-muted-foreground text-xs">
                  Priorité HAUTE ou URGENTE
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 mt-1 rounded-full bg-yellow-500" />
              <div>
                <p className="font-medium">Moyen</p>
                <p className="text-muted-foreground text-xs">
                  Priorité MOYENNE
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 mt-1 rounded-full bg-gray-500" />
              <div>
                <p className="font-medium">Faible</p>
                <p className="text-muted-foreground text-xs">
                  Priorité FAIBLE, pas d'échéance proche
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Nouvelle tâche"
        className="max-w-2xl max-h-[90vh] overflow-auto"
      >
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isLoading={createTask.isPending}
          mode="create"
        />
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        open={!!editingTaskId}
        onOpenChange={() => setEditingTaskId(null)}
        title="Modifier la tâche"
        className="max-w-2xl max-h-[90vh] overflow-auto"
      >
        {editingTask && (
          <TaskForm
            initialData={{
              title: editingTask.title,
              description: editingTask.description || undefined,
              notes: editingTask.notes || undefined,
              url: editingTask.url || undefined,
              dueAt: editingTask.dueAt ? new Date(editingTask.dueAt) : undefined,
              plannedStartAt: editingTask.plannedStartAt
                ? new Date(editingTask.plannedStartAt)
                : undefined,
              plannedDuration: editingTask.plannedDuration || undefined,
              priority: editingTask.priority as TaskFormData["priority"],
              status: editingTask.status as TaskFormData["status"],
              tags: editingTask.tags,
              estimatedEnergy: editingTask.estimatedEnergy as
                | TaskFormData["estimatedEnergy"]
                | undefined,
              checklistItems: [],
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTaskId(null)}
            onDelete={() => {
              handleDelete(editingTaskId!);
              setEditingTaskId(null);
            }}
            isLoading={updateTask.isPending}
            mode="edit"
          />
        )}
      </Modal>
    </div>
  );
}
