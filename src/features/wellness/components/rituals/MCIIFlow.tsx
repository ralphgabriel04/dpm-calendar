"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Star,
  Sun,
  Shield,
  Route,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Target,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Textarea } from "@/shared/components/ui/Textarea";
import { cn } from "@/shared/lib/utils";
import { trpc } from "@/infrastructure/trpc/client";
import { toast } from "sonner";

interface Goal {
  id: string;
  title: string;
  category?: string | null;
}

interface MCIIData {
  wish: string;
  goalId?: string;
  outcome: string;
  obstacle: string;
  plan: {
    if: string;
    then: string;
  };
}

interface MCIIFlowProps {
  onComplete: (data: MCIIData) => void;
  onClose: () => void;
}

type Step = "wish" | "outcome" | "obstacle" | "plan";

const stepConfig = {
  wish: {
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  outcome: {
    icon: Sun,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  obstacle: {
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  plan: {
    icon: Route,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
};

export function MCIIFlow({ onComplete, onClose }: MCIIFlowProps) {
  const t = useTranslations("mcii");

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>("wish");
  const steps: Step[] = ["wish", "outcome", "obstacle", "plan"];
  const currentIndex = steps.indexOf(currentStep);

  // MCII data
  const [wish, setWish] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();
  const [outcome, setOutcome] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [ifCondition, setIfCondition] = useState("");
  const [thenAction, setThenAction] = useState("");

  // Fetch user's goals
  const { data: goals } = trpc.goal.list.useQuery({ status: "ACTIVE" });

  // Journal mutation to save MCII
  const journalMutation = trpc.journal.upsert.useMutation();

  // Navigation validation
  const canProceed = () => {
    switch (currentStep) {
      case "wish":
        return wish.trim().length > 0;
      case "outcome":
        return outcome.trim().length > 0;
      case "obstacle":
        return obstacle.trim().length > 0;
      case "plan":
        return ifCondition.trim().length > 0 && thenAction.trim().length > 0;
    }
  };

  // Handle next step
  const handleNext = async () => {
    if (currentStep === "plan") {
      // Complete the MCII flow
      const mciiData: MCIIData = {
        wish,
        goalId: selectedGoalId,
        outcome,
        obstacle,
        plan: {
          if: ifCondition,
          then: thenAction,
        },
      };

      // Save to journal
      try {
        const content = formatMCIIContent(mciiData);
        await journalMutation.mutateAsync({
          date: new Date(),
          content,
          prompt: "MCII Morning Intention",
          tags: ["mcii", "morning-ritual", "intention"],
        });

        toast.success(t("complete.success"));
        onComplete(mciiData);
      } catch {
        toast.error(t("errors.save"));
      }
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  // Handle previous step
  const handlePrev = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  // Format MCII data for journal storage
  const formatMCIIContent = (data: MCIIData): string => {
    const selectedGoal = goals?.find((g: Goal) => g.id === data.goalId);
    return `## MCII Morning Intention

### Wish (Souhait)
${data.wish}
${selectedGoal ? `\n**Linked Goal:** ${selectedGoal.title}` : ""}

### Outcome (Résultat)
${data.outcome}

### Obstacle
${data.obstacle}

### Implementation Plan
**If** ${data.plan.if}
**Then** ${data.plan.then}
`;
  };

  // Render current step
  const renderStep = () => {
    const config = stepConfig[currentStep];
    const Icon = config.icon;

    switch (currentStep) {
      case "wish":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-4">
              <div className={cn("w-16 h-16 rounded-full mx-auto flex items-center justify-center", config.bgColor)}>
                <Icon className={cn("w-8 h-8", config.color)} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{t("wish.title")}</h2>
                <p className="text-muted-foreground">{t("wish.subtitle")}</p>
              </div>
            </div>

            <Textarea
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder={t("wish.placeholder")}
              className="min-h-[120px] text-lg"
              autoFocus
            />

            {goals && goals.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("wish.linkGoal")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {goals.slice(0, 5).map((goal: Goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoalId(
                        selectedGoalId === goal.id ? undefined : goal.id
                      )}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-all",
                        selectedGoalId === goal.id
                          ? "bg-violet-500 text-white border-violet-500"
                          : "bg-card border-border hover:border-violet-500/50"
                      )}
                    >
                      <Target className="w-3 h-3 inline-block mr-1" />
                      {goal.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              {t("wish.tip")}
            </p>
          </div>
        );

      case "outcome":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-4">
              <div className={cn("w-16 h-16 rounded-full mx-auto flex items-center justify-center", config.bgColor)}>
                <Icon className={cn("w-8 h-8", config.color)} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{t("outcome.title")}</h2>
                <p className="text-muted-foreground">{t("outcome.subtitle")}</p>
              </div>
            </div>

            {/* Show the wish for context */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground font-medium">{t("outcome.yourWish")}</p>
              <p className="mt-1">{wish}</p>
            </div>

            <Textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder={t("outcome.placeholder")}
              className="min-h-[120px] text-lg"
              autoFocus
            />

            <p className="text-xs text-center text-muted-foreground">
              {t("outcome.tip")}
            </p>
          </div>
        );

      case "obstacle":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-4">
              <div className={cn("w-16 h-16 rounded-full mx-auto flex items-center justify-center", config.bgColor)}>
                <Icon className={cn("w-8 h-8", config.color)} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{t("obstacle.title")}</h2>
                <p className="text-muted-foreground">{t("obstacle.subtitle")}</p>
              </div>
            </div>

            <Textarea
              value={obstacle}
              onChange={(e) => setObstacle(e.target.value)}
              placeholder={t("obstacle.placeholder")}
              className="min-h-[120px] text-lg"
              autoFocus
            />

            <p className="text-xs text-center text-muted-foreground">
              {t("obstacle.tip")}
            </p>
          </div>
        );

      case "plan":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-4">
              <div className={cn("w-16 h-16 rounded-full mx-auto flex items-center justify-center", config.bgColor)}>
                <Icon className={cn("w-8 h-8", config.color)} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{t("plan.title")}</h2>
                <p className="text-muted-foreground">{t("plan.subtitle")}</p>
              </div>
            </div>

            {/* Show the obstacle for context */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground font-medium">{t("plan.yourObstacle")}</p>
              <p className="mt-1">{obstacle}</p>
            </div>

            <div className="space-y-4">
              {/* IF condition */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span className="text-violet-500 font-bold">{t("plan.if")}</span>
                  {t("plan.ifLabel")}
                </label>
                <Textarea
                  value={ifCondition}
                  onChange={(e) => setIfCondition(e.target.value)}
                  placeholder={t("plan.ifPlaceholder")}
                  className="min-h-[80px]"
                  autoFocus
                />
              </div>

              {/* THEN action */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span className="text-violet-500 font-bold">{t("plan.then")}</span>
                  {t("plan.thenLabel")}
                </label>
                <Textarea
                  value={thenAction}
                  onChange={(e) => setThenAction(e.target.value)}
                  placeholder={t("plan.thenPlaceholder")}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {t("plan.tip")}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <span className="font-semibold">{t("header")}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* Progress indicators */}
      <div className="px-4 md:px-6">
        <div className="max-w-md mx-auto flex items-center justify-center gap-2">
          {steps.map((step, index) => {
            const config = stepConfig[step];
            const Icon = config.icon;
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive && cn(config.bgColor, config.color, "scale-110 ring-2 ring-offset-2 ring-offset-background"),
                    isCompleted && "bg-green-500/20 text-green-500",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 md:w-12 h-0.5 mx-1 transition-colors duration-300",
                      index < currentIndex ? "bg-green-500" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-lg">{renderStep()}</div>
      </main>

      {/* Footer */}
      <footer className="p-4 md:p-6 border-t">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={cn(currentIndex === 0 && "invisible")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("previous")}
          </Button>

          <span className="text-sm text-muted-foreground">
            {t("step", { current: currentIndex + 1, total: steps.length })}
          </span>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || journalMutation.isPending}
          >
            {journalMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : currentStep === "plan" ? (
              <>
                {t("complete.button")}
                <Sparkles className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                {t("next")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
