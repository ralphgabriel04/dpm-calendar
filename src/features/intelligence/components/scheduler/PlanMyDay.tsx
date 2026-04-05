"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { trpc as api } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import {
  Sparkles,
  Clock,
  Calendar,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  AlertCircle,
  Play,
  CheckCircle,
  Target,
  Battery,
  BatteryMedium,
  BatteryLow,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

interface PlanMyDayProps {
  date?: Date;
  onPlanAccepted?: () => void;
  className?: string;
}

export function PlanMyDay({
  date = new Date(),
  onPlanAccepted,
  className,
}: PlanMyDayProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedProposals, setSelectedProposals] = useState<Set<string>>(new Set());

  const utils = api.useUtils();

  const {
    data: plan,
    isLoading,
    refetch,
  } = api.aiScheduler.planDay.useQuery(
    { date },
    {
      enabled: expanded,
      refetchOnWindowFocus: false,
    }
  );

  const acceptPlanMutation = api.aiScheduler.acceptPlan.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} tâches planifiées avec succès`);
      utils.aiScheduler.planDay.invalidate();
      onPlanAccepted?.();
    },
    onError: (error) => {
      toast.error("Erreur lors de la planification", {
        description: error.message,
      });
    },
  });

  // Initialize selected proposals when plan loads
  const initializeSelection = () => {
    if (plan?.proposals) {
      setSelectedProposals(new Set(plan.proposals.map((p) => p.taskId)));
    }
  };

  const toggleProposal = (taskId: string) => {
    const newSelected = new Set(selectedProposals);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedProposals(newSelected);
  };

  const handleAcceptPlan = () => {
    if (!plan) return;

    const proposalsToAccept = plan.proposals.filter((p) =>
      selectedProposals.has(p.taskId)
    );

    if (proposalsToAccept.length === 0) {
      toast.error("Sélectionnez au moins une tâche à planifier");
      return;
    }

    acceptPlanMutation.mutate({
      proposals: proposalsToAccept,
    });
  };

  const getEnergyIcon = (match: "optimal" | "good" | "acceptable") => {
    switch (match) {
      case "optimal":
        return <Battery className="h-4 w-4 text-green-500" />;
      case "good":
        return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
      case "acceptable":
        return <BatteryLow className="h-4 w-4 text-orange-500" />;
    }
  };

  const getEnergyBadge = (match: "optimal" | "good" | "acceptable") => {
    switch (match) {
      case "optimal":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Optimal
          </span>
        );
      case "good":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            Bon
          </span>
        );
      case "acceptable":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            Acceptable
          </span>
        );
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "text-green-500";
    if (confidence >= 0.4) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => {
          setExpanded(!expanded);
          if (!expanded && plan) {
            initializeSelection();
          }
        }}
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">Planifier ma journée</span>
          {plan && !isLoading && (
            <span className="text-xs text-muted-foreground">
              • {plan.proposals.length} tâches suggérées
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Stats bar */}
          {plan && !isLoading && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{plan.totalMinutesPlanned} min planifiées</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{plan.availableMinutes} min disponibles</span>
                </div>
              </div>
              <div
                className={cn(
                  "text-sm font-medium",
                  getConfidenceColor(plan.confidence)
                )}
              >
                Confiance: {Math.round(plan.confidence * 100)}%
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analyse de votre journée...
              </p>
            </div>
          )}

          {/* Proposals list */}
          {!isLoading && plan && plan.proposals.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Créneaux suggérés</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedProposals.size === plan.proposals.length) {
                      setSelectedProposals(new Set());
                    } else {
                      setSelectedProposals(
                        new Set(plan.proposals.map((p) => p.taskId))
                      );
                    }
                  }}
                >
                  {selectedProposals.size === plan.proposals.length
                    ? "Tout désélectionner"
                    : "Tout sélectionner"}
                </Button>
              </div>

              {plan.proposals.map((proposal, index) => (
                <div
                  key={proposal.taskId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all cursor-pointer",
                    selectedProposals.has(proposal.taskId)
                      ? "border-primary/50 ring-1 ring-primary/20"
                      : "hover:border-muted-foreground/30"
                  )}
                  onClick={() => toggleProposal(proposal.taskId)}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded border transition-colors",
                      selectedProposals.has(proposal.taskId)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {selectedProposals.has(proposal.taskId) && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>

                  {/* Time badge */}
                  <div className="flex flex-col items-center px-2 py-1 rounded bg-muted/50 min-w-[60px]">
                    <span className="text-xs font-medium">
                      {format(new Date(proposal.startAt), "HH:mm", {
                        locale: fr,
                      })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {proposal.duration} min
                    </span>
                  </div>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {proposal.taskTitle}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {proposal.reason}
                    </p>
                  </div>

                  {/* Energy match */}
                  <div className="flex items-center gap-2">
                    {getEnergyIcon(proposal.energyMatch)}
                    {getEnergyBadge(proposal.energyMatch)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unscheduled tasks */}
          {!isLoading && plan && plan.unscheduled.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Non planifiées ({plan.unscheduled.length})
              </h4>
              <div className="space-y-1">
                {plan.unscheduled.map((task) => (
                  <div
                    key={task.taskId}
                    className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{task.title}</span>
                    <span className="text-xs text-muted-foreground">
                      — {task.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && plan && plan.proposals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">Journée déjà planifiée!</p>
              <p className="text-xs">
                Toutes vos tâches ont un créneau ou aucune tâche à planifier.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!isLoading && plan && plan.proposals.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <Sparkles className="h-4 w-4 mr-2" />
                Recalculer
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptPlan}
                disabled={
                  acceptPlanMutation.isPending || selectedProposals.size === 0
                }
              >
                {acceptPlanMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Planification...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Planifier {selectedProposals.size} tâche
                    {selectedProposals.size > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
