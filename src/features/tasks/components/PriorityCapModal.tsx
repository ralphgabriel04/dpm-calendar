"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/Dialog";

interface PriorityCapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cap: number;
  conflictingTaskIds?: string[];
  onDeferred?: () => void;
}

export function PriorityCapModal({
  open,
  onOpenChange,
  cap,
  conflictingTaskIds,
  onDeferred,
}: PriorityCapModalProps) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.task.getTodayPriorities.useQuery(undefined, {
    enabled: open,
  });

  const deferMutation = trpc.task.deferTask.useMutation({
    onSuccess: () => {
      utils.task.getTodayPriorities.invalidate();
      utils.task.list.invalidate();
      toast.success("Task deferred to tomorrow");
      onDeferred?.();
    },
    onError: (error) => {
      toast.error("Failed to defer task", { description: error.message });
    },
  });

  const tasks = data?.tasks ?? [];
  const effectiveCap = data?.cap ?? cap;
  const shown = conflictingTaskIds
    ? tasks.filter((t) => conflictingTaskIds.includes(t.id))
    : tasks;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Daily priority cap reached</DialogTitle>
          </div>
          <DialogDescription>
            You already have {shown.length} priorities today (cap: {effectiveCap}).
            Which should be deferred?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-auto">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          {!isLoading && shown.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No priorities to defer.
            </p>
          )}
          {shown.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs rounded-full bg-orange-100 text-orange-700 px-2 py-0.5">
                    {task.priority}
                  </span>
                  {task.dueAt && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(task.dueAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deferMutation.mutate({ id: task.id })}
                disabled={deferMutation.isPending}
              >
                Defer
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
