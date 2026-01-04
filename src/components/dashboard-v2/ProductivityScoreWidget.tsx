"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Target, Clock, CheckCircle2, Zap } from "lucide-react";

interface ProductivityScoreWidgetProps {
  score: number; // 0-100
  previousScore?: number;
  breakdown?: {
    taskCompletion: number; // 0-100
    focusTime: number; // 0-100
    habitStreak: number; // 0-100
    timeBalance: number; // 0-100
  };
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-blue-500";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Très bien";
  if (score >= 60) return "Bien";
  if (score >= 40) return "Moyen";
  if (score >= 20) return "Faible";
  return "À améliorer";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

const BREAKDOWN_ITEMS = [
  { key: "taskCompletion", label: "Tâches", icon: CheckCircle2, weight: 30 },
  { key: "focusTime", label: "Focus", icon: Clock, weight: 30 },
  { key: "habitStreak", label: "Habitudes", icon: Target, weight: 20 },
  { key: "timeBalance", label: "Équilibre", icon: Zap, weight: 20 },
] as const;

export function ProductivityScoreWidget({
  score,
  previousScore,
  breakdown,
  className,
}: ProductivityScoreWidgetProps) {
  const trend = previousScore !== undefined ? score - previousScore : 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <h3 className="font-semibold mb-4">Score de productivité</h3>

      {/* Main Score */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          {/* Circle background */}
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
              strokeLinecap="round"
              className={cn("transition-all duration-1000", getScoreColor(score))}
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", getScoreColor(score))}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
      </div>

      {/* Label and trend */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className={cn("text-sm font-medium", getScoreColor(score))}>
          {getScoreLabel(score)}
        </span>
        {previousScore !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground"
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground mb-2">Répartition du score</div>
          {BREAKDOWN_ITEMS.map(({ key, label, icon: Icon, weight }) => {
            const value = breakdown[key as keyof typeof breakdown];
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span>{label}</span>
                    <span className="text-muted-foreground">({weight}%)</span>
                  </div>
                  <span className={getScoreColor(value)}>{value}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", getScoreBgColor(value))}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 pt-4 border-t">
        <div className="text-xs text-muted-foreground">
          {score < 40 && (
            <p>Conseil: Essayez de terminer au moins 3 tâches prioritaires par jour.</p>
          )}
          {score >= 40 && score < 60 && (
            <p>Conseil: Augmentez votre temps de focus en bloquant des créneaux dédiés.</p>
          )}
          {score >= 60 && score < 80 && (
            <p>Conseil: Maintenez vos habitudes pour améliorer votre score.</p>
          )}
          {score >= 80 && (
            <p>Excellent travail! Continuez sur cette lancée.</p>
          )}
        </div>
      </div>
    </div>
  );
}
