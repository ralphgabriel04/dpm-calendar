"use client";

import { useState, useMemo } from "react";
import { X, Check, Clock, Zap, Flag, Search, Battery, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { cn } from "@/shared/lib/utils";
import { trpc } from "@/infrastructure/trpc/client";

interface FocusTaskPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (taskId: string | null, taskTitle?: string) => void;
}

type SortOption = "priority" | "duration" | "energy" | "dueDate";
type FilterOption = "all" | "quick" | "deep" | "lowEnergy";

const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const PRIORITY_COLORS = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-blue-500",
  LOW: "text-slate-400",
};

export function FocusTaskPicker({
  open,
  onClose,
  onSelect,
}: FocusTaskPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  const { data: tasks, isLoading } = trpc.task.list.useQuery(
    {
      status: ["TODO", "IN_PROGRESS"],
      includeCompleted: false,
    },
    { enabled: open }
  );

  const { data: chronoData } = trpc.chronotype.get.useQuery(undefined, {
    enabled: open,
  });

  // Get current hour energy level
  const currentHour = new Date().getHours();
  const currentEnergy = chronoData?.energyCurve?.[currentHour] ?? 1.0;

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    let result = [...tasks];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    switch (filterBy) {
      case "quick":
        result = result.filter((t) => !t.plannedDuration || t.plannedDuration <= 30);
        break;
      case "deep":
        result = result.filter((t) => t.plannedDuration && t.plannedDuration >= 60);
        break;
      case "lowEnergy":
        result = result.filter(
          (t) => t.estimatedEnergy === "LOW" || t.priority === "LOW"
        );
        break;
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return (
            (PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 2) -
            (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 2)
          );
        case "duration":
          return (a.plannedDuration ?? 999) - (b.plannedDuration ?? 999);
        case "energy":
          const energyOrder = { LOW: 0, MEDIUM: 1, HIGH: 2 };
          return (
            (energyOrder[a.estimatedEnergy as keyof typeof energyOrder] ?? 1) -
            (energyOrder[b.estimatedEnergy as keyof typeof energyOrder] ?? 1)
          );
        case "dueDate":
          if (!a.dueAt && !b.dueAt) return 0;
          if (!a.dueAt) return 1;
          if (!b.dueAt) return -1;
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, search, sortBy, filterBy]);

  // AI recommendation: match task energy to current energy level
  const recommendedTaskId = useMemo(() => {
    if (!filteredTasks.length || currentEnergy === 1.0) return null;

    // High energy hour -> recommend high priority/energy tasks
    if (currentEnergy >= 1.2) {
      const highPriorityTask = filteredTasks.find(
        (t) => t.priority === "URGENT" || t.priority === "HIGH" || t.estimatedEnergy === "HIGH"
      );
      return highPriorityTask?.id ?? null;
    }

    // Low energy hour -> recommend low energy tasks
    if (currentEnergy <= 0.7) {
      const lowEnergyTask = filteredTasks.find(
        (t) => t.estimatedEnergy === "LOW" || t.priority === "LOW"
      );
      return lowEnergyTask?.id ?? null;
    }

    return null;
  }, [filteredTasks, currentEnergy]);

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

        {/* Search and filters */}
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {[
              { key: "all", label: "Toutes" },
              { key: "quick", label: "Rapides (<30m)" },
              { key: "deep", label: "Deep Work (>1h)" },
              { key: "lowEnergy", label: "Faible énergie" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterBy(f.key as FilterOption)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  filterBy === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Energy indicator */}
        {chronoData && (
          <div className="px-4 py-2 bg-muted/50 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Énergie actuelle ({currentHour}h):
            </span>
            <span className={cn(
              "font-medium",
              currentEnergy >= 1.2 ? "text-green-600" :
              currentEnergy >= 0.8 ? "text-yellow-600" :
              "text-orange-600"
            )}>
              {Math.round(currentEnergy * 100)}%
              {currentEnergy >= 1.2 && " — Idéal pour le travail complexe"}
              {currentEnergy <= 0.7 && " — Privilégiez les tâches légères"}
            </span>
          </div>
        )}

        {/* Task list */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Chargement...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              {search ? "Aucun résultat" : "Aucune tâche disponible"}
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isSelected = selectedId === task.id;
              const isRecommended = task.id === recommendedTaskId;
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedId(task.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors relative",
                    isSelected
                      ? "bg-primary/10 border-primary"
                      : isRecommended
                      ? "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700"
                      : "bg-background border-border hover:bg-muted"
                  )}
                >
                  {isRecommended && (
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Sparkles className="h-3 w-3" />
                      Recommandé
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Flag className={cn("h-3 w-3", PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS])} />
                        <p className="font-medium text-sm truncate">{task.title}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {task.plannedDuration && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.plannedDuration} min
                          </span>
                        )}
                        {task.estimatedEnergy && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Battery className="h-3 w-3" />
                            {task.estimatedEnergy === "LOW" ? "Faible" : task.estimatedEnergy === "HIGH" ? "Haute" : "Moyenne"}
                          </span>
                        )}
                      </div>
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
