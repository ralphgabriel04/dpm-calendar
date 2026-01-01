"use client";

import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Flag,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
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
  checklistItems: Array<{ id: string; isCompleted: boolean }>;
  subtasks: Array<{ id: string; status: string }>;
}

interface TaskRowProps {
  task: Task;
  onClick?: () => void;
  onToggleStatus?: (status: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  showCheckbox?: boolean;
  className?: string;
}

const priorityConfig = {
  LOW: { color: "text-slate-400", label: "Faible" },
  MEDIUM: { color: "text-blue-500", label: "Moyenne" },
  HIGH: { color: "text-orange-500", label: "Haute" },
  URGENT: { color: "text-red-500", label: "Urgente" },
};

export function TaskRow({
  task,
  onClick,
  onToggleStatus,
  onDelete,
  onEdit,
  isSelected,
  onSelect,
  showCheckbox = false,
  className,
}: TaskRowProps) {
  const isOverdue = task.dueAt && isPast(task.dueAt) && task.status !== "DONE";
  const isDone = task.status === "DONE";

  // Subtask/checklist counts
  const subtaskCount = task.subtasks?.length || 0;
  const subtaskDone = task.subtasks?.filter((s) => s.status === "DONE").length || 0;
  const checklistCount = task.checklistItems?.length || 0;
  const checklistDone = task.checklistItems?.filter((i) => i.isCompleted).length || 0;

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleStatus) {
      onToggleStatus(isDone ? "TODO" : "DONE");
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0",
        "hover:bg-accent/50 cursor-pointer transition-colors",
        isSelected && "bg-primary/5",
        isDone && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      {/* Selection checkbox */}
      {showCheckbox && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect?.()}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        />
      )}

      {/* Status toggle */}
      <button
        onClick={handleStatusClick}
        className={cn(
          "flex-shrink-0 transition-colors",
          isDone ? "text-green-500" : "text-muted-foreground hover:text-primary"
        )}
      >
        {isDone ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : task.status === "IN_PROGRESS" ? (
          <Clock className="h-5 w-5 text-blue-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Title and description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium text-sm truncate",
              isDone && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
          {(subtaskCount > 0 || checklistCount > 0) && (
            <span className="text-xs text-muted-foreground">
              {subtaskCount > 0
                ? `${subtaskDone}/${subtaskCount}`
                : `${checklistDone}/${checklistCount}`}
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {task.description}
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="hidden md:flex items-center gap-1 flex-shrink-0">
        {task.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Due date */}
      {task.dueAt && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs flex-shrink-0",
            isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {isToday(task.dueAt)
              ? "Aujourd'hui"
              : format(task.dueAt, "d MMM", { locale: fr })}
          </span>
          <span className="sm:hidden">
            {format(task.dueAt, "d/MM", { locale: fr })}
          </span>
        </div>
      )}

      {/* Priority */}
      <div
        className={cn(
          "flex-shrink-0",
          priorityConfig[task.priority].color
        )}
      >
        <Flag className="h-4 w-4" />
      </div>

      {/* Actions */}
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
          <DropdownMenuItem onClick={() => onToggleStatus?.(isDone ? "TODO" : "DONE")}>
            {isDone ? "Marquer non terminé" : "Marquer terminé"}
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

      {/* Arrow indicator */}
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
