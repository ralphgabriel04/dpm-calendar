"use client";

import { useState } from "react";
import {
  Sun,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { EnergyCheck } from "@/components/dashboard";
import { cn } from "@/shared/lib/utils";

interface Task {
  id: string;
  title: string;
  plannedDuration?: number | null;
  priority: string;
  status: string;
}

interface MorningRitualProps {
  yesterdayTasks: Task[];
  onKeepTask: (taskId: string) => void;
  onRescheduleTask: (taskId: string, date: Date) => void;
  onDeleteTask: (taskId: string) => void;
  onSetEnergyLevel: (level: number) => void;
  onSetDayFocus: (focus: string) => void;
  onComplete: () => void;
  onClose: () => void;
}

type Step = "energy" | "yesterday" | "focus";

export function MorningRitual({
  yesterdayTasks,
  onKeepTask,
  onRescheduleTask,
  onDeleteTask,
  onSetEnergyLevel,
  onSetDayFocus,
  onComplete,
  onClose,
}: MorningRitualProps) {
  const [step, setStep] = useState<Step>("energy");
  const [energyLevel, setEnergyLevel] = useState<number | undefined>();
  const [dayFocus, setDayFocus] = useState("");
  const [processedTasks, setProcessedTasks] = useState<Set<string>>(new Set());

  const steps: Step[] = ["energy", "yesterday", "focus"];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case "energy":
        return energyLevel !== undefined;
      case "yesterday":
        return processedTasks.size === yesterdayTasks.length || yesterdayTasks.length === 0;
      case "focus":
        return dayFocus.trim().length > 0;
    }
  };

  const handleNext = () => {
    if (step === "energy" && energyLevel) {
      onSetEnergyLevel(energyLevel);
    }
    if (step === "focus" && dayFocus) {
      onSetDayFocus(dayFocus);
      onComplete();
      return;
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handlePrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleTaskAction = (taskId: string, action: "keep" | "reschedule" | "delete") => {
    setProcessedTasks((prev) => {
      const newSet = new Set(prev);
      newSet.add(taskId);
      return newSet;
    });
    switch (action) {
      case "keep":
        onKeepTask(taskId);
        break;
      case "reschedule":
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        onRescheduleTask(taskId, tomorrow);
        break;
      case "delete":
        onDeleteTask(taskId);
        break;
    }
  };

  const renderStep = () => {
    switch (step) {
      case "energy":
        return (
          <div className="space-y-8 text-center">
            <div>
              <Sun className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Bonjour!</h2>
              <p className="text-muted-foreground">
                Comment te sens-tu ce matin?
              </p>
            </div>
            <EnergyCheck value={energyLevel} onChange={setEnergyLevel} />
          </div>
        );

      case "yesterday":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-violet-500 mb-4" />
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Taches d&apos;hier
              </h2>
              <p className="text-muted-foreground text-sm">
                {yesterdayTasks.length > 0
                  ? `${yesterdayTasks.length} tâche${yesterdayTasks.length > 1 ? "s" : ""} non terminée${yesterdayTasks.length > 1 ? "s" : ""}`
                  : "Toutes les tâches d'hier sont terminées!"}
              </p>
            </div>

            {yesterdayTasks.length === 0 ? (
              <div className="text-center py-8">
                <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium">Excellent travail!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-auto">
                {yesterdayTasks.map((task) => {
                  const isProcessed = processedTasks.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "p-4 rounded-xl border bg-card transition-all",
                        isProcessed && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.plannedDuration && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {task.plannedDuration} min
                            </p>
                          )}
                        </div>
                      </div>
                      {!isProcessed && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTaskAction(task.id, "keep")}
                            className="flex-1"
                          >
                            Aujourd&apos;hui
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTaskAction(task.id, "reschedule")}
                            className="flex-1"
                          >
                            Demain
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTaskAction(task.id, "delete")}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {isProcessed && (
                        <div className="flex items-center gap-2 text-green-500 text-sm">
                          <Check className="h-4 w-4" />
                          Traité
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "focus":
        return (
          <div className="space-y-6 text-center">
            <div>
              <Sparkles className="h-12 w-12 mx-auto text-violet-500 mb-4" />
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Focus du jour
              </h2>
              <p className="text-muted-foreground text-sm">
                Quelle est ta priorite principale aujourd&apos;hui?
              </p>
            </div>

            <Input
              value={dayFocus}
              onChange={(e) => setDayFocus(e.target.value)}
              placeholder="Ex: Finir la presentation pour le client"
              className="text-center text-lg py-6"
              autoFocus
            />

            <div className="text-sm text-muted-foreground">
              Concentre-toi sur une seule chose importante
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">Ritual du matin</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* Progress */}
      <div className="px-4 md:px-6">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= currentStepIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">{renderStep()}</div>
      </main>

      {/* Footer */}
      <footer className="p-4 md:p-6 border-t">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <Button onClick={handleNext} disabled={!canProceed()}>
            {step === "focus" ? (
              <>
                Commencer la journée
                <Sparkles className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
