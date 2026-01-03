"use client";

import { useState } from "react";
import {
  Moon,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Calendar,
  Clock,
  Trophy,
  Star,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  plannedDuration?: number | null;
  priority: string;
  status: string;
}

interface DayStats {
  tasksCompleted: number;
  totalTasks: number;
  focusMinutes: number;
  habitsCompleted: number;
  habitsTotal: number;
}

interface EveningShutdownProps {
  completedTasks: Task[];
  incompleteTasks: Task[];
  dayStats: DayStats;
  onRescheduleTask: (taskId: string, date: Date) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTomorrowTask: (title: string) => void;
  onComplete: () => void;
  onClose: () => void;
}

type Step = "wins" | "incomplete" | "tomorrow" | "summary";

export function EveningShutdown({
  completedTasks,
  incompleteTasks,
  dayStats,
  onRescheduleTask,
  onDeleteTask,
  onAddTomorrowTask,
  onComplete,
  onClose,
}: EveningShutdownProps) {
  const [step, setStep] = useState<Step>("wins");
  const [processedTasks, setProcessedTasks] = useState<Set<string>>(new Set());
  const [tomorrowTask, setTomorrowTask] = useState("");
  const [tomorrowTasks, setTomorrowTasks] = useState<string[]>([]);

  const steps: Step[] = ["wins", "incomplete", "tomorrow", "summary"];
  const currentStepIndex = steps.indexOf(step);

  const productivityScore = Math.round(
    ((dayStats.tasksCompleted / Math.max(dayStats.totalTasks, 1)) * 0.6 +
      (dayStats.habitsCompleted / Math.max(dayStats.habitsTotal, 1)) * 0.4) *
      100
  );

  const canProceed = () => {
    switch (step) {
      case "incomplete":
        return processedTasks.size === incompleteTasks.length || incompleteTasks.length === 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step === "tomorrow" && tomorrowTask.trim()) {
      handleAddTomorrowTask();
    }
    if (step === "summary") {
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

  const handleTaskAction = (taskId: string, action: "tomorrow" | "delete") => {
    setProcessedTasks((prev) => {
      const newSet = new Set(prev);
      newSet.add(taskId);
      return newSet;
    });
    switch (action) {
      case "tomorrow":
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        onRescheduleTask(taskId, tomorrow);
        break;
      case "delete":
        onDeleteTask(taskId);
        break;
    }
  };

  const handleAddTomorrowTask = () => {
    if (tomorrowTask.trim()) {
      onAddTomorrowTask(tomorrowTask.trim());
      setTomorrowTasks((prev) => [...prev, tomorrowTask.trim()]);
      setTomorrowTask("");
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const getScoreMessage = () => {
    if (productivityScore >= 90) return "Journée exceptionnelle!";
    if (productivityScore >= 70) return "Très bonne journée!";
    if (productivityScore >= 50) return "Bonne progression!";
    return "Demain sera meilleur!";
  };

  const getScoreEmoji = () => {
    if (productivityScore >= 90) return "🏆";
    if (productivityScore >= 70) return "⭐";
    if (productivityScore >= 50) return "👍";
    return "💪";
  };

  const renderStep = () => {
    switch (step) {
      case "wins":
        return (
          <div className="space-y-6 text-center">
            <div>
              <PartyPopper className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Tes victoires du jour!
              </h2>
              <p className="text-muted-foreground">
                {completedTasks.length} tâche{completedTasks.length > 1 ? "s" : ""} terminée{completedTasks.length > 1 ? "s" : ""}
              </p>
            </div>

            {completedTasks.length > 0 ? (
              <div className="space-y-2 max-h-[40vh] overflow-auto text-left">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                  >
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="font-medium">{task.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-muted-foreground">
                <p>Pas de tâches complétées aujourd&apos;hui.</p>
                <p className="text-sm mt-2">Ce n&apos;est pas grave, demain est un nouveau jour!</p>
              </div>
            )}

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {dayStats.tasksCompleted}
                </div>
                <div className="text-xs text-muted-foreground">Taches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-500">
                  {formatTime(dayStats.focusMinutes)}
                </div>
                <div className="text-xs text-muted-foreground">Focus</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {dayStats.habitsCompleted}/{dayStats.habitsTotal}
                </div>
                <div className="text-xs text-muted-foreground">Habitudes</div>
              </div>
            </div>
          </div>
        );

      case "incomplete":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-violet-500 mb-4" />
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Taches restantes
              </h2>
              <p className="text-muted-foreground text-sm">
                {incompleteTasks.length > 0
                  ? `${incompleteTasks.length} tâche${incompleteTasks.length > 1 ? "s" : ""} à reporter`
                  : "Tout est terminé!"}
              </p>
            </div>

            {incompleteTasks.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                <p className="text-lg font-medium">Tout est fait!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-auto">
                {incompleteTasks.map((task) => {
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
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTaskAction(task.id, "tomorrow")}
                            className="flex-1"
                          >
                            Reporter à demain
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

      case "tomorrow":
        return (
          <div className="space-y-6 text-center">
            <div>
              <Star className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Planifier demain
              </h2>
              <p className="text-muted-foreground text-sm">
                Ajoute des tâches pour demain (optionnel)
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={tomorrowTask}
                onChange={(e) => setTomorrowTask(e.target.value)}
                placeholder="Nouvelle tâche pour demain..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTomorrowTask();
                }}
              />
              <Button onClick={handleAddTomorrowTask} disabled={!tomorrowTask.trim()}>
                Ajouter
              </Button>
            </div>

            {tomorrowTasks.length > 0 && (
              <div className="space-y-2 text-left">
                {tomorrowTasks.map((task, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">{task}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "summary":
        return (
          <div className="space-y-6 text-center">
            <div>
              <div className="text-6xl mb-4">{getScoreEmoji()}</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {getScoreMessage()}
              </h2>
              <p className="text-muted-foreground">
                Score de productivité: {productivityScore}%
              </p>
            </div>

            {/* Progress circle */}
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - productivityScore / 100)}`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{productivityScore}%</span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Bonne nuit! Repose-toi bien.</p>
              <p>Demain est une nouvelle opportunite.</p>
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
          <Moon className="h-5 w-5 text-violet-500" />
          <span className="font-semibold">Fin de journée</span>
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
            {step === "summary" ? (
              <>
                Terminer
                <Moon className="h-4 w-4 ml-2" />
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
