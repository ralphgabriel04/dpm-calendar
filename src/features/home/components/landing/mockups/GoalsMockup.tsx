"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

export function GoalsMockup() {
  const t = useTranslations("landing.mockups.goals");
  const [phases, setPhases] = useState([
    { id: 1, name: t("phase1"), completed: true },
    { id: 2, name: t("phase2"), completed: true },
    { id: 3, name: t("phase3"), completed: true },
    { id: 4, name: t("phase4"), completed: false },
  ]);

  const completedCount = phases.filter((p) => p.completed).length;
  const progress = Math.round((completedCount / phases.length) * 100);

  const togglePhase = (id: number) => {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id === id ? { ...phase, completed: !phase.completed } : phase
      )
    );
  };

  // Find the current phase (first incomplete one)
  const currentPhaseIndex = phases.findIndex((p) => !p.completed);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <h4 className="font-semibold mb-4">{t("title")}</h4>
      <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">{t("projectName")}</span>
          <span className="text-xs text-pink-500 font-semibold transition-all duration-300">
            {progress}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-pink-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="space-y-2">
        {phases.map((phase, index) => {
          const isCurrentPhase = index === currentPhaseIndex;

          return (
            <button
              key={phase.id}
              onClick={() => togglePhase(phase.id)}
              className="flex items-center gap-2 text-sm w-full text-left hover:bg-muted/50 rounded-lg p-1 -ml-1 transition-colors group"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  phase.completed
                    ? "bg-green-500 scale-100"
                    : isCurrentPhase
                    ? "bg-pink-500/20 border border-pink-500"
                    : "bg-muted group-hover:bg-muted/80"
                }`}
              >
                {phase.completed ? (
                  <Check className="h-3 w-3 text-white animate-in zoom-in duration-200" />
                ) : isCurrentPhase ? (
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                ) : null}
              </div>
              <span
                className={`transition-all duration-300 ${
                  phase.completed
                    ? "text-muted-foreground line-through"
                    : isCurrentPhase
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {phase.name}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        {t("clickToToggle")}
      </p>
    </div>
  );
}
