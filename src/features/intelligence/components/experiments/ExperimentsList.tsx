"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ExperimentResult } from "@prisma/client";
import { trpc as api } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Textarea } from "@/shared/components/ui/Textarea";
import { FlaskConical, CheckCircle2, XCircle, HelpCircle, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const RESULT_BADGE: Record<ExperimentResult, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-muted text-muted-foreground" },
  SUCCESS: { label: "Success", className: "bg-green-500/10 text-green-600" },
  FAILURE: { label: "Failure", className: "bg-red-500/10 text-red-600" },
  INCONCLUSIVE: { label: "Inconclusive", className: "bg-amber-500/10 text-amber-600" },
};

export function ExperimentsList({ className }: { className?: string }) {
  const t = useTranslations("experiments");
  const utils = api.useUtils();
  const { data: experiments, isLoading } = api.experiment.list.useQuery();
  const createMutation = api.experiment.create.useMutation({
    onSuccess: () => {
      void utils.experiment.list.invalidate();
      setShowForm(false);
      setHypothesis("");
      setMetric("");
      setBaseline("");
    },
  });
  const completeMutation = api.experiment.complete.useMutation({
    onSuccess: () => void utils.experiment.list.invalidate(),
  });
  const deleteMutation = api.experiment.delete.useMutation({
    onSuccess: () => void utils.experiment.list.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [hypothesis, setHypothesis] = useState("");
  const [metric, setMetric] = useState("");
  const [baseline, setBaseline] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hypothesis.trim() || !metric.trim()) return;
    createMutation.mutate({
      hypothesis: hypothesis.trim(),
      metric: metric.trim(),
      baselineValue: baseline ? Number(baseline) : undefined,
    });
  };

  const handleComplete = (id: string, result: ExperimentResult) => {
    const inputStr = window.prompt(t("interventionValuePrompt")) ?? "";
    const parsed = inputStr === "" ? undefined : Number(inputStr);
    completeMutation.mutate({
      id,
      result,
      interventionValue: parsed !== undefined && !Number.isNaN(parsed) ? parsed : undefined,
    });
  };

  return (
    <div className={cn("rounded-xl border p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t("title")}</h3>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? t("cancel") : t("newExperiment")}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{t("description")}</p>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-2 p-3 rounded-md bg-muted/30 border">
          <Textarea
            placeholder={t("hypothesisPlaceholder")}
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            rows={2}
            required
          />
          <Input
            placeholder={t("metricPlaceholder")}
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            required
          />
          <Input
            type="number"
            step="0.01"
            placeholder={t("baselinePlaceholder")}
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
          />
          <Button
            type="submit"
            size="sm"
            disabled={createMutation.isPending || !hypothesis.trim() || !metric.trim()}
            className="w-full"
          >
            {createMutation.isPending ? t("creating") : t("create")}
          </Button>
        </form>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-4">{t("loading")}</p>
      ) : !experiments || experiments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {experiments.map((exp) => {
            const badge = RESULT_BADGE[exp.result];
            return (
              <li key={exp.id} className="p-3 rounded-md border bg-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exp.hypothesis}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("metricLabel")}: {exp.metric}
                      {exp.baselineValue !== null && (
                        <> · {t("baselineLabel")}: {exp.baselineValue}</>
                      )}
                      {exp.interventionValue !== null && (
                        <> → {exp.interventionValue}</>
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded shrink-0",
                      badge.className
                    )}
                  >
                    {badge.label}
                  </span>
                </div>

                {exp.result === ExperimentResult.PENDING && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleComplete(exp.id, ExperimentResult.SUCCESS)}
                      disabled={completeMutation.isPending}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      {t("markSuccess")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleComplete(exp.id, ExperimentResult.FAILURE)}
                      disabled={completeMutation.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      {t("markFailure")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleComplete(exp.id, ExperimentResult.INCONCLUSIVE)}
                      disabled={completeMutation.isPending}
                    >
                      <HelpCircle className="h-3.5 w-3.5 mr-1" />
                      {t("markInconclusive")}
                    </Button>
                  </div>
                )}

                <button
                  onClick={() => deleteMutation.mutate({ id: exp.id })}
                  className="text-xs text-muted-foreground hover:text-destructive mt-2 inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  {t("delete")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
