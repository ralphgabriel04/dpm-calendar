"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Chronotype } from "@prisma/client";
import { trpc as api } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/Dialog";
import { cn } from "@/shared/lib/utils";

const QUESTION_KEYS = [
  "q1_wakeEasily",
  "q2_morningAlert",
  "q3_earlyExercise",
  "q4_breakfastHungry",
  "q5_morningProductive",
  "q6_earlyBed",
  "q7_nightEnergy",
  "q8_lateCreative",
  "q9_afterDinnerFocus",
  "q10_sleepInWeekends",
  "q11_eveningSocial",
  "q12_hateMornings",
] as const;

const LIKERT_LABELS = [
  "likert.stronglyDisagree",
  "likert.disagree",
  "likert.neutral",
  "likert.agree",
  "likert.stronglyAgree",
] as const;

interface ChronotypeQuizProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (result: {
    chronotype: Chronotype;
    energyCurve: Record<number, number>;
  }) => void;
}

export function ChronotypeQuiz({
  open,
  onOpenChange,
  onComplete,
}: ChronotypeQuizProps) {
  const t = useTranslations("chronotype");
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => new Array(12).fill(null)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<{
    chronotype: Chronotype;
    energyCurve: Record<number, number>;
  } | null>(null);

  const utils = api.useUtils();
  const submitQuiz = api.chronotype.submitQuiz.useMutation({
    onSuccess: (data) => {
      setResult(data);
      onComplete?.(data);
      void utils.chronotype.get.invalidate();
    },
  });

  const allAnswered = answers.every((a) => a !== null);
  const progress = Math.round(
    (answers.filter((a) => a !== null).length / 12) * 100
  );

  const handleAnswer = (value: number) => {
    const next = [...answers];
    next[currentIndex] = value;
    setAnswers(next);
    if (currentIndex < 11) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    submitQuiz.mutate({ answers: answers as number[] });
  };

  const handleReset = () => {
    setAnswers(new Array(12).fill(null));
    setCurrentIndex(0);
    setResult(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleReset();
    }
    onOpenChange(nextOpen);
  };

  const currentQuestion = QUESTION_KEYS[currentIndex];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("quiz.title")}</DialogTitle>
          <DialogDescription>{t("quiz.description")}</DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t("quiz.progress", {
                current: currentIndex + 1,
                total: 12,
              })}
            </p>

            <div className="py-4">
              <p className="text-base font-medium mb-4 min-h-[3rem]">
                {t(`questions.${currentQuestion}`)}
              </p>

              <div className="grid grid-cols-5 gap-2">
                {LIKERT_LABELS.map((labelKey, idx) => {
                  const value = idx + 1;
                  const selected = answers[currentIndex] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleAnswer(value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input hover:bg-accent"
                      )}
                    >
                      <span className="text-lg font-semibold">{value}</span>
                      <span className="text-center leading-tight">
                        {t(labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                {t("quiz.previous")}
              </Button>
              {currentIndex < 11 ? (
                <Button
                  onClick={() =>
                    setCurrentIndex(Math.min(11, currentIndex + 1))
                  }
                  disabled={answers[currentIndex] === null}
                >
                  {t("quiz.next")}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitQuiz.isPending}
                >
                  {submitQuiz.isPending
                    ? t("quiz.submitting")
                    : t("quiz.submit")}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="py-4 space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {t("result.yourChronotype")}
              </p>
              <p className="text-3xl font-bold text-primary">
                {t(`types.${result.chronotype}.name`)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t(`types.${result.chronotype}.description`)}
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleReset}>
                {t("result.retake")}
              </Button>
              <Button onClick={() => handleClose(false)}>
                {t("result.done")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
