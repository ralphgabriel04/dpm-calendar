"use client";

import { format, isPast, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Flag,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

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
  subtasks: Array<{ id: string; status: string }>;
  checklistItems: Array<{ id: string; title: string; isCompleted: boolean }>;
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onToggleStatus?: (status: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
  isDragging?: boolean;
}

const priorityConfig = {
  LOW: { color: "text-slate-500", bg: "bg-slate-100", label: "Faible" },
  MEDIUM: { color: "text-blue-500", bg: "bg-blue-100", label: "Moyenne" },
  HIGH: { color: "text-orange-500", bg: "bg-orange-100", label: "Haute" },
  URGENT: { color: "text-red-500", bg: "bg-red-100", label: "Urgente" },
};

const statusConfig = {
  TODO: { icon: Circle, color: "text-muted-foreground" },
  IN_PROGRESS: { icon: Clock, color: "text-blue-500" },
  DONE: { icon: CheckCircle2, color: "text-green-500" },
  CANCELLED: { icon: AlertCircle, color: "text-muted-foreground" },
};

export function TaskCard({
  task,
  onClick,
  onToggleStatus,
  onDelete,
  onEdit,
  className,
  isDragging,
}: TaskCardProps) {
  const StatusIcon = statusConfig[task.status].icon;
  const priority = priorityConfig[task.priority];
  const isOverdue = task.dueAt && isPast(task.dueAt) && task.status !== "DONE";

  // Checklist progress
  const checklistTotal = task.checklistItems?.length || 0;
  const checklistCompleted = task.checklistItems?.filter((i) => i.isCompleted).length || 0;

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return "Demain";
    return format(date, "d MMM", { locale: fr });
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleStatus) {
      const newStatus = task.status === "DONE" ? "TODO" : "DONE";
      onToggleStatus(newStatus);
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-3 transition-all",
        "hover:shadow-md hover:border-primary/50",
        "cursor-pointer",
        isDragging && "opacity-50 shadow-lg",
        task.status === "DONE" && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={handleStatusClick}
          className={cn(
            "mt-0.5 flex-shrink-0 transition-colors hover:scale-110",
            statusConfig[task.status].color
          )}
        >
          <StatusIcon className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={cn(
              "font-medium text-sm leading-snug",
              task.status === "DONE" && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h3>

          {/* Description preview */}
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Due date */}
            {task.dueAt && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue
                    ? "text-red-500 font-medium"
                    : "text-muted-foreground"
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDueDate(task.dueAt)}
              </div>
            )}

            {/* Priority */}
            {task.priority !== "MEDIUM" && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  priority.color
                )}
              >
                <Flag className="h-3 w-3" />
                {priority.label}
              </div>
            )}

            {/* Checklist progress */}
            {checklistTotal > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3" />
                {checklistCompleted}/{checklistTotal}
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Modifier</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleStatus?.(task.status === "DONE" ? "TODO" : "DONE")}
            >
              {task.status === "DONE" ? "Marquer non terminé" : "Marquer terminé"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
