"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";

interface EnergyCheckProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

const energyLevels = [
  { value: 1, emoji: "😴", label: "Epuise", color: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700" },
  { value: 2, emoji: "😐", label: "Fatigue", color: "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700" },
  { value: 3, emoji: "🙂", label: "Normal", color: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700" },
  { value: 4, emoji: "😊", label: "Bien", color: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700" },
  { value: 5, emoji: "🔥", label: "Energie", color: "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700" },
];

export function EnergyCheck({
  value,
  onChange,
  disabled = false,
  compact = false,
  className,
}: EnergyCheckProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const selectedLevel = energyLevels.find((l) => l.value === value);
  const displayValue = hoveredValue ?? value;
  const displayLevel = energyLevels.find((l) => l.value === displayValue);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {energyLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => !disabled && onChange?.(level.value)}
            onMouseEnter={() => setHoveredValue(level.value)}
            onMouseLeave={() => setHoveredValue(null)}
            disabled={disabled}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-lg",
              "transition-all duration-200 border-2",
              value === level.value
                ? level.color
                : "bg-muted/50 border-transparent hover:bg-muted",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            title={level.label}
          >
            {level.emoji}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Comment te sens-tu aujourd&apos;hui?
        </p>
        {displayLevel && (
          <p className="text-lg font-medium animate-in fade-in duration-200">
            {displayLevel.label}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {energyLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => !disabled && onChange?.(level.value)}
            onMouseEnter={() => setHoveredValue(level.value)}
            onMouseLeave={() => setHoveredValue(null)}
            disabled={disabled}
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl",
              "transition-all duration-200 border-2",
              value === level.value
                ? cn(level.color, "scale-110 shadow-lg")
                : "bg-muted/50 border-transparent hover:bg-muted hover:scale-105",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {level.emoji}
          </button>
        ))}
      </div>

      <div className="flex justify-between px-1 text-xs text-muted-foreground">
        <span>Epuise</span>
        <span>Plein d&apos;energie</span>
      </div>
    </div>
  );
}
