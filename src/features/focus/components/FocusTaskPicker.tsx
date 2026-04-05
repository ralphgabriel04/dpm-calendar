"use client";

import { useState } from "react";
import { X, Check, Clock, Zap } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";
import { trpc } from "@/infrastructure/trpc/client";

interface FocusTaskPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (taskId: string | null, taskTitle?: string) => void;
}

export function FocusTaskPicker({
  open,
  onClose,
  onSelect,
}: FocusTaskPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: tasks, isLoading } = trpc.task.list.useQuery(
    {
      status: ["TODO", "IN_PROGRESS"],
      includeCompleted: false,
    },
    { enabled: open }
  );

  if (!open) return null;

  const handleConfirm = () => {
    if (selectedId) {
      const task = tasks?.find((t) => t.id === selectedId);
      onSelect(selectedId, task?.title);
    } else {
      onSelect(null);
    }
    setSelectedId(null);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Choisir une tâche</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Chargement...
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Aucune tâche disponible
            </div>
          ) : (
            tasks.map((task) => {
              const isSelected = selectedId === task.id;
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedId(task.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    isSelected
                      ? "bg-primary/10 border-primary"
                      : "bg-background border-border hover:bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      {task.plannedDuration && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {task.plannedDuration} min
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelect(null);
              setSelectedId(null);
            }}
          >
            Focus sans tâche
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={!selectedId}>
              Sélectionner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
