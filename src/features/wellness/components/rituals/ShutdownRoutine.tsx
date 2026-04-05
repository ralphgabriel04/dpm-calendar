"use client";

import { useState } from "react";
import {
  Moon,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Heart,
  Trophy,
  ListChecks,
  Calendar,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { cn } from "@/shared/lib/utils";

interface Task {
  id: string;
  title: string;
  plannedDuration?: number | null;
  priority: string;
  status: string;
}

interface ShutdownRoutineProps {
  completedTasks: Task[];
  tomorrowTopTasks: Task[];
  onComplete: (data: {
    gratitude: string[];
    wins: string[];
    loopClosed: boolean;
  }) => void;
  onClose: () => void;
}

type Step = "review" | "tomorrow" | "gratitude" | "closeLoop";

const CLOSE_LOOP_ITEMS = [
  { key: "emails", label: "Emails traités", icon: Mail },
  { key: "looseEnds", label: "Notes/fichiers rangés", icon: ListChecks },
  { key: "calendar", label: "Calendrier vérifié", icon: Calendar },
];

export function ShutdownRoutine({
  completedTasks,
  tomorrowTopTasks,
  onComplete,
  onClose,
}: ShutdownRoutineProps) {
  const [step, setStep] = useState<Step>("review");
  const [gratitude, setGratitude] = useState<string[]>(["", "", ""]);
  const [wins, setWins] = useState<string[]>(["", "", ""]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const steps: Step[] = ["review", "tomorrow", "gratitude", "closeLoop"];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    if (step === "gratitude") {
      return (
        gratitude.some((g) => g.trim().length > 0) ||
        wins.some((w) => w.trim().length > 0)
      );
    }
    return true;
  };

  const handleNext = () => {
    if (step === "closeLoop") {
      const loopClosed = CLOSE_LOOP_ITEMS.every((i) => checked[i.key]);
      onComplete({
        gratitude: gratitude.filter((g) => g.trim()),
        wins: wins.filter((w) => w.trim()),
        loopClosed,
      });
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

  const updateField = (
    arr: string[],
    setter: (v: string[]) => void,
    idx: number,
    value: string
  ) => {
    const next = [...arr];
    next[idx] = value;
    setter(next);
  };

  const toggleCheck = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderStep = () => {
    switch (step) {
      case "review":
        return (
          <div className="space-y-6 text-center">
            <div>
              <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Revue de la journée
              </h2>
              <p className="text-muted-foreground">
                {completedTasks.length} tâche
                {completedTasks.length > 1 ? "s" : ""} terminée
                {completedTasks.length > 1 ? "s" : ""} aujourd&apos;hui
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
                    <span className="font-medium text-sm">{task.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-muted-foreground text-sm">
                <p>Pas de tâches complétées aujourd&apos;hui.</p>
                <p className="mt-2">Demain est une nouvelle opportunité.</p>
              </div>
            )}
          </div>
        );

      case "tomorrow":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-violet-500 mb-4" />
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Aperçu de demain
              </h2>
              <p className="text-muted-foreground text-sm">
                {tomorrowTopTasks.length > 0
                  ? `${tomorrowTopTasks.length} priorité${tomorrowTopTasks.length > 1 ? "s" : ""} planifiée${tomorrowTopTasks.length > 1 ? "s" : ""}`
                  : "Aucune tâche planifiée pour demain"}
              </p>
            </div>
            {tomorrowTopTasks.length > 0 ? (
              <div className="space-y-2">
                {tomorrowTopTasks.slice(0, 3).map((task, idx) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30"
                  >
                    <span className="text-sm font-bold text-primary w-5">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Rien n&apos;est encore planifié. Demain matin fera l&apos;affaire.
              </div>
            )}
          </div>
        );

      case "gratitude":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="h-12 w-12 mx-auto text-pink-500 mb-4" />
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Gratitude & victoires
              </h2>
              <p className="text-muted-foreground text-sm">
                Trois choses pour lesquelles tu es reconnaissant(e)
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" /> Gratitude
              </div>
              {gratitude.map((value, idx) => (
                <Input
                  key={`g-${idx}`}
                  value={value}
                  onChange={(e) =>
                    updateField(gratitude, setGratitude, idx, e.target.value)
                  }
                  placeholder={`Reconnaissant(e) pour... (${idx + 1})`}
                />
              ))}
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 pt-2">
                <Sparkles className="h-3.5 w-3.5" /> Victoires
              </div>
              {wins.map((value, idx) => (
                <Input
                  key={`w-${idx}`}
                  value={value}
                  onChange={(e) =>
                    updateField(wins, setWins, idx, e.target.value)
                  }
                  placeholder={`Victoire du jour... (${idx + 1})`}
                />
              ))}
            </div>
          </div>
        );

      case "closeLoop":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <ListChecks className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Boucler la journée
              </h2>
              <p className="text-muted-foreground text-sm">
                Quelques dernières vérifications avant de déconnecter
              </p>
            </div>
            <div className="space-y-2">
              {CLOSE_LOOP_ITEMS.map((item) => {
                const Icon = item.icon;
                const isChecked = !!checked[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleCheck(item.key)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                      isChecked
                        ? "bg-green-500/10 border-green-500/40"
                        : "bg-card border-border hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded border flex items-center justify-center flex-shrink-0",
                        isChecked
                          ? "bg-green-500 border-green-500"
                          : "border-muted-foreground"
                      )}
                    >
                      {isChecked && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
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
          <span className="font-semibold">Routine de fermeture</span>
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
            {step === "closeLoop" ? (
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
