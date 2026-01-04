"use client";

import { useState, useEffect } from "react";
import { trpc as api } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import {
  Timer,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Rocket,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MicroCommitmentProps {
  className?: string;
  compact?: boolean;
}

export function MicroCommitment({ className, compact = false }: MicroCommitmentProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    taskId: string;
    taskTitle: string;
    duration: number;
    startTime: Date;
  } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const utils = api.useUtils();

  const { data: quickStarts, isLoading } = api.antiProcrastination.getQuickStarts.useQuery(
    undefined,
    { enabled: expanded }
  );

  const { data: patterns } = api.antiProcrastination.getPatterns.useQuery(undefined, {
    enabled: expanded,
  });

  const startMutation = api.antiProcrastination.startMicroSession.useMutation({
    onSuccess: (data) => {
      const task = quickStarts?.find((t) => t.taskId === data.taskId);
      setActiveSession({
        sessionId: data.sessionId,
        taskId: data.taskId,
        taskTitle: task?.taskTitle || "Tâche",
        duration: data.duration,
        startTime: new Date(),
      });
      setTimeRemaining(data.duration * 60);
      setIsPaused(false);
    },
  });

  const completeMutation = api.antiProcrastination.completeMicroSession.useMutation({
    onSuccess: () => {
      setActiveSession(null);
      setTimeRemaining(0);
      utils.antiProcrastination.getQuickStarts.invalidate();
    },
  });

  const reportAvoidanceMutation = api.antiProcrastination.reportAvoidance.useMutation({
    onSuccess: () => {
      utils.antiProcrastination.getQuickStarts.invalidate();
      utils.antiProcrastination.getPatterns.invalidate();
    },
  });

  useEffect(() => {
    if (!activeSession || isPaused || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, isPaused, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = (taskId: string, duration: number) => {
    startMutation.mutate({ taskId, duration });
  };

  const handleComplete = (continueWorking: boolean) => {
    if (!activeSession) return;
    completeMutation.mutate({
      sessionId: activeSession.sessionId,
      continueWorking,
    });
  };

  const handleSkip = (taskId: string, reason?: string) => {
    reportAvoidanceMutation.mutate({
      taskId,
      reason: reason,
    });
  };

  const progress = activeSession
    ? ((activeSession.duration * 60 - timeRemaining) / (activeSession.duration * 60)) * 100
    : 0;

  return (
    <div className={cn("rounded-xl border bg-gradient-to-br from-violet-500/5 to-purple-500/10", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-violet-500" />
          <span className="font-semibold">Micro-engagements</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {activeSession ? (
            <div className="space-y-4">
              <div className="text-center p-6 rounded-lg bg-card border">
                <h3 className="font-medium mb-2">{activeSession.taskTitle}</h3>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={352}
                      strokeDashoffset={352 - (352 * progress) / 100}
                      className="text-violet-500 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{formatTime(timeRemaining)}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleComplete(true)}
                    disabled={completeMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Terminé
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleComplete(false)}
                    disabled={completeMutation.isPending}
                    className="text-red-500 hover:text-red-600"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Abandonner
                  </Button>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Restez concentré pendant {activeSession.duration} minutes
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : quickStarts && quickStarts.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Commencez par un petit engagement:
              </p>
              {quickStarts.map((task) => (
                <div
                  key={task.taskId}
                  className="p-3 rounded-lg bg-card border hover:border-violet-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm truncate flex-1">
                      {task.taskTitle}
                    </span>
                    <button
                      onClick={() => handleSkip(task.taskId)}
                      className="text-muted-foreground hover:text-foreground p-1"
                      title="Ignorer"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStart(task.taskId, 5)}
                      disabled={startMutation.isPending}
                      className="flex-1"
                    >
                      <Timer className="h-3 w-3 mr-1" />
                      5 min
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStart(task.taskId, 15)}
                      disabled={startMutation.isPending}
                      className="flex-1"
                    >
                      <Timer className="h-3 w-3 mr-1" />
                      15 min
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleStart(task.taskId, 25)}
                      disabled={startMutation.isPending}
                      className="flex-1 bg-violet-600 hover:bg-violet-700"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      25 min
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune tâche à démarrer</p>
              <p className="text-xs">Ajoutez des tâches pour utiliser les micro-engagements</p>
            </div>
          )}

          {patterns && patterns.recommendations && patterns.recommendations.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Conseils personnalisés</span>
              </div>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                {patterns.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
