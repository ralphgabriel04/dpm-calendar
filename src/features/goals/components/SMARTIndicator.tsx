"use client";

import { useMemo } from "react";
import { Check, X, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  validateSMARTGoal,
  getSMARTLabel,
  SMART_TEMPLATES,
  type GoalInput,
  type SMARTCriteria,
} from "../lib/smart-validation";

interface SMARTIndicatorProps {
  goal: GoalInput;
  showSuggestions?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Visual indicator showing SMART criteria compliance
 */
export function SMARTIndicator({
  goal,
  showSuggestions = true,
  compact = false,
  className,
}: SMARTIndicatorProps) {
  const validation = useMemo(() => validateSMARTGoal(goal), [goal]);

  const criteriaKeys: (keyof SMARTCriteria)[] = [
    "specific",
    "measurable",
    "achievable",
    "relevant",
    "timeBound",
  ];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {criteriaKeys.map((key) => {
          const label = getSMARTLabel(key);
          const met = validation.criteria[key];
          return (
            <div
              key={key}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                met
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-muted text-muted-foreground"
              )}
              title={`${label.name}: ${met ? "✓" : "✗"}`}
            >
              {label.letter}
            </div>
          );
        })}
        <span className="ml-2 text-sm font-medium">
          {validation.score}%
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Score bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Score SMART</span>
          <span
            className={cn(
              "font-bold",
              validation.score === 100
                ? "text-green-600"
                : validation.score >= 60
                ? "text-yellow-600"
                : "text-red-600"
            )}
          >
            {validation.score}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              validation.score === 100
                ? "bg-green-500"
                : validation.score >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
            )}
            style={{ width: `${validation.score}%` }}
          />
        </div>
      </div>

      {/* Criteria list */}
      <div className="grid grid-cols-5 gap-1">
        {criteriaKeys.map((key) => {
          const label = getSMARTLabel(key);
          const met = validation.criteria[key];
          return (
            <div
              key={key}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-colors",
                met
                  ? "bg-green-50 dark:bg-green-950/30"
                  : "bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mb-1",
                  met
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {met ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-bold">{label.letter}</span>
                )}
              </div>
              <span className="text-[10px] text-center font-medium">
                {label.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Suggestions */}
      {showSuggestions && validation.suggestions.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Suggestions</span>
          </div>
          <ul className="space-y-1">
            {validation.suggestions.map((suggestion, i) => (
              <li
                key={i}
                className="text-xs text-amber-600 dark:text-amber-500 flex items-start gap-2"
              >
                <span>•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success message */}
      {validation.isValid && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 dark:text-green-400">
            Votre objectif respecte tous les critères SMART !
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Template picker for SMART goals
 */
export function SMARTTemplates({
  onSelect,
  className,
}: {
  onSelect: (template: typeof SMART_TEMPLATES[0]) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        <span>Modèles d'objectifs SMART</span>
      </div>
      <div className="grid gap-2">
        {SMART_TEMPLATES.map((template, i) => (
          <button
            key={i}
            onClick={() => onSelect(template)}
            className="text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {template.category}
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {template.targetValue} {template.unit}
              </span>
            </div>
            <p className="text-sm font-medium mt-1">{template.example}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
