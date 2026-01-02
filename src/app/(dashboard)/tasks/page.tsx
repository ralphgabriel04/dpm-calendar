"use client";

import { useState, useMemo } from "react";
import { addDays, addWeeks } from "date-fns";
import {
  Plus,
  Filter,
  List,
  LayoutGrid,
  Calendar,
  SortAsc,
  Search,
  X,
  Check,
} from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import { useTaskStore } from "@/stores/task.store";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Components
import { TaskListView, KanbanBoard, TaskModal, TaskCalendarView, TaskDetailModal, type TaskFormData } from "@/components/tasks";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/DropdownMenu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";

export default function TasksPage() {
  const { taskModalOpen, openTaskModal, closeTaskModal } = useUIStore();
  const {
    viewType,
    setViewType,
    filters,
    setFilter,
    sortBy,
    setSortBy,
    selectedTaskIds,
    toggleTaskSelection,
    clearSelection,
  } = useTaskStore();

  // Task form state
  const [editingTask, setEditingTask] = useState<{
    id: string;
    data: Partial<TaskFormData>;
  } | null>(null);

  // Task detail modal state (for Focus/Pomodoro mode)
  const [detailTask, setDetailTask] = useState<{
    id: string;
    title: string;
    description?: string;
    channel?: string;
    plannedDuration?: number;
    actualDuration?: number;
    dueAt?: Date;
    startAt?: Date;
  } | null>(null);

  // Fetch tasks
  const { data: tasksData, refetch: refetchTasks } = trpc.task.list.useQuery({
    status: filters.status.length > 0
      ? filters.status as ("TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED")[]
      : undefined,
    priority: filters.priority.length > 0
      ? filters.priority as ("LOW" | "MEDIUM" | "HIGH" | "URGENT")[]
      : undefined,
    search: filters.search || undefined,
    includeCompleted: filters.showCompleted,
  });

  // Mutations
  const createTaskMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      refetchTasks();
      closeTaskModal();
    },
  });

  const updateTaskMutation = trpc.task.update.useMutation({
    onSuccess: () => {
      refetchTasks();
      closeTaskModal();
      setEditingTask(null);
    },
  });

  const toggleTaskMutation = trpc.task.toggle.useMutation({
    onSuccess: () => refetchTasks(),
  });

  const deleteTaskMutation = trpc.task.delete.useMutation({
    onSuccess: () => refetchTasks(),
  });

  // Transform tasks
  const tasks = useMemo(() => {
    if (!tasksData) return [];
    return tasksData.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueAt: task.dueAt ? new Date(task.dueAt) : null,
      plannedStartAt: task.plannedStartAt ? new Date(task.plannedStartAt) : null,
      plannedDuration: task.plannedDuration,
      priority: task.priority,
      status: task.status,
      tags: task.tags || [],
      checklistItems: task.checklistItems.map((item) => ({
        id: item.id,
        title: item.title,
        isCompleted: item.isCompleted,
      })),
      subtasks: task.subtasks.map((s) => ({ id: s.id, status: s.status as string })),
    }));
  }, [tasksData]);

  // Handlers
  const handleCreateTask = () => {
    setEditingTask(null);
    openTaskModal();
  };

  const handleTaskClick = (task: (typeof tasks)[0]) => {
    // Open detail modal for focus/pomodoro mode
    setDetailTask({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      channel: task.tags?.[0] || "work",
      plannedDuration: task.plannedDuration || undefined,
      dueAt: task.dueAt || undefined,
      startAt: task.plannedStartAt || undefined,
    });
  };

  const handleTaskEdit = (task: (typeof tasks)[0]) => {
    setEditingTask({
      id: task.id,
      data: {
        title: task.title,
        description: task.description || undefined,
        dueAt: task.dueAt || undefined,
        plannedStartAt: task.plannedStartAt || undefined,
        plannedDuration: task.plannedDuration || undefined,
        priority: task.priority,
        status: task.status === "CANCELLED" ? "TODO" : task.status,
        tags: task.tags,
      },
    });
    openTaskModal();
  };

  const handleTaskSnooze = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTaskMutation.mutate({
        id: taskId,
        dueAt: addDays(task.dueAt || new Date(), 1),
      });
    }
    setDetailTask(null);
  };

  const handleTaskMoveToNextWeek = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTaskMutation.mutate({
        id: taskId,
        dueAt: addWeeks(task.dueAt || new Date(), 1),
      });
    }
    setDetailTask(null);
  };

  const handleTaskMoveToBacklog = (taskId: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      dueAt: null,
    });
    setDetailTask(null);
  };

  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    // Update task status directly instead of just toggling
    updateTaskMutation.mutate({
      id: taskId,
      status: newStatus as "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED",
    });
  };

  const handleTaskDelete = (taskId: string) => {
    deleteTaskMutation.mutate({ id: taskId });
  };

  const handleSubmitTask = (data: TaskFormData) => {
    if (editingTask) {
      updateTaskMutation.mutate({
        id: editingTask.id,
        title: data.title,
        description: data.description,
        dueAt: data.dueAt,
        plannedStartAt: data.plannedStartAt,
        priority: data.priority,
        status: data.status,
        tags: data.tags,
        plannedDuration: data.plannedDuration,
        estimatedEnergy: data.estimatedEnergy,
      });
    } else {
      createTaskMutation.mutate({
        title: data.title,
        description: data.description,
        dueAt: data.dueAt,
        plannedStartAt: data.plannedStartAt,
        priority: data.priority,
        tags: data.tags,
        plannedDuration: data.plannedDuration,
        estimatedEnergy: data.estimatedEnergy,
      });
    }
  };

  const handleDeleteTask = () => {
    if (editingTask) {
      deleteTaskMutation.mutate({ id: editingTask.id });
      closeTaskModal();
      setEditingTask(null);
    }
  };

  const viewLabels = {
    list: { icon: List, label: "Liste" },
    kanban: { icon: LayoutGrid, label: "Kanban" },
    calendar: { icon: Calendar, label: "Calendrier" },
  };

  const sortOptions = [
    { value: "dueAt", label: "Date d'échéance" },
    { value: "priority", label: "Priorité" },
    { value: "createdAt", label: "Date de création" },
    { value: "title", label: "Titre" },
  ];

  const priorityFilters = [
    { value: "URGENT", label: "Urgente" },
    { value: "HIGH", label: "Haute" },
    { value: "MEDIUM", label: "Moyenne" },
    { value: "LOW", label: "Faible" },
  ];

  const statusFilters = [
    { value: "TODO", label: "À faire" },
    { value: "IN_PROGRESS", label: "En cours" },
    { value: "DONE", label: "Terminé" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Tasks Header */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Tâches</h1>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="pl-9 w-64"
            />
            {filters.search && (
              <button
                onClick={() => setFilter("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border bg-muted p-1">
            {(Object.keys(viewLabels) as Array<keyof typeof viewLabels>).map((view) => {
              const ViewIcon = viewLabels[view].icon;
              return (
                <button
                  key={view}
                  onClick={() => setViewType(view as "list" | "kanban" | "calendar")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewType === view
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={viewLabels[view].label}
                >
                  <ViewIcon className="h-4 w-4" />
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <SortAsc className="h-4 w-4" />
                <span className="hidden sm:inline">Trier</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value as typeof sortBy)}
                >
                  {sortBy === option.value && <Check className="h-4 w-4 mr-2" />}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtres</span>
                {(filters.priority.length > 0 || filters.status.length > 0) && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
                    {filters.priority.length + filters.status.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
                {/* Priority filter */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Priorité</h4>
                  <div className="space-y-1">
                    {priorityFilters.map((filter) => (
                      <label
                        key={filter.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.priority.includes(filter.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilter("priority", [...filters.priority, filter.value]);
                            } else {
                              setFilter(
                                "priority",
                                filters.priority.filter((p) => p !== filter.value)
                              );
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{filter.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status filter */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Statut</h4>
                  <div className="space-y-1">
                    {statusFilters.map((filter) => (
                      <label
                        key={filter.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.status.includes(filter.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilter("status", [...filters.status, filter.value]);
                            } else {
                              setFilter(
                                "status",
                                filters.status.filter((s) => s !== filter.value)
                              );
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{filter.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Show completed toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showCompleted}
                    onChange={(e) => setFilter("showCompleted", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Afficher terminées</span>
                </label>

                {/* Clear filters */}
                {(filters.priority.length > 0 || filters.status.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFilter("priority", []);
                      setFilter("status", []);
                    }}
                  >
                    Effacer les filtres
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Add task button */}
          <Button onClick={handleCreateTask} className="gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle tâche</span>
          </Button>
        </div>
      </header>

      {/* Tasks Content */}
      <div className="flex-1 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-4 mb-4 inline-block">
                <Plus className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">Aucune tâche</p>
              <p className="text-sm mt-1">
                Créez votre première tâche pour commencer
              </p>
              <Button onClick={handleCreateTask} className="mt-4">
                Créer une tâche
              </Button>
            </div>
          </div>
        ) : viewType === "kanban" ? (
          <KanbanBoard
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskDelete={handleTaskDelete}
          />
        ) : viewType === "list" ? (
          <div className="h-full overflow-auto">
            <TaskListView
              tasks={tasks}
              groupBy="dueDate"
              onTaskClick={handleTaskClick}
              onTaskStatusChange={handleTaskStatusChange}
              onTaskDelete={handleTaskDelete}
              selectedTaskIds={selectedTaskIds}
              onTaskSelect={toggleTaskSelection}
            />
          </div>
        ) : (
          <TaskCalendarView
            tasks={tasks}
            onTaskClick={handleTaskClick}
          />
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeTaskModal();
            setEditingTask(null);
          }
        }}
        initialData={editingTask?.data}
        onSubmit={handleSubmitTask}
        onDelete={editingTask ? handleDeleteTask : undefined}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
        mode={editingTask ? "edit" : "create"}
      />

      {/* Task Detail Modal (Focus/Pomodoro mode) */}
      {detailTask && (
        <TaskDetailModal
          isOpen={!!detailTask}
          onClose={() => setDetailTask(null)}
          task={detailTask}
          onSnooze={handleTaskSnooze}
          onMoveToNextWeek={handleTaskMoveToNextWeek}
          onMoveToBacklog={handleTaskMoveToBacklog}
          onUpdate={(taskId, data) => {
            updateTaskMutation.mutate({
              id: taskId,
              ...data,
            });
          }}
        />
      )}
    </div>
  );
}
