"use client";

import { useMemo } from "react";
import { trpc as api } from "@/infrastructure/trpc/client";
import { cn } from "@/shared/lib/utils";

interface EnergyOverlayProps {
  /** Hour to display (0-23) */
  hour: number;
  /** Whether to show the numeric value */
  showValue?: boolean;
  /** Custom class name */
  className?: string;
  /** Overlay style: 'bar' (vertical) or 'background' (full cell) */
  variant?: "bar" | "background";
}

/**
 * EnergyOverlay displays a visual indicator of the user's predicted energy
 * level for a given hour based on their chronotype.
 */
export function EnergyOverlay({
  hour,
  showValue = false,
  className,
  variant = "bar",
}: EnergyOverlayProps) {
  const { data: chronoData } = api.chronotype.get.useQuery();

  const energyLevel = useMemo(() => {
    if (!chronoData?.energyCurve) return 1.0;
    return chronoData.energyCurve[hour] ?? 1.0;
  }, [chronoData, hour]);

  // Convert 0-1.5 to percentage (0-100)
  const percentage = Math.round((energyLevel / 1.5) * 100);

  // Color based on energy level
  const getColor = (level: number) => {
    if (level >= 1.3) return "bg-green-500/70";
    if (level >= 1.0) return "bg-emerald-400/60";
    if (level >= 0.7) return "bg-yellow-400/50";
    if (level >= 0.5) return "bg-orange-400/40";
    return "bg-red-400/30";
  };

  const getBackgroundColor = (level: number) => {
    if (level >= 1.3) return "bg-green-500/10";
    if (level >= 1.0) return "bg-emerald-400/10";
    if (level >= 0.7) return "bg-yellow-400/10";
    if (level >= 0.5) return "bg-orange-400/10";
    return "bg-red-400/10";
  };

  if (variant === "background") {
    return (
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-colors",
          getBackgroundColor(energyLevel),
          className
        )}
      >
        {showValue && (
          <span className="absolute top-1 right-1 text-[10px] text-muted-foreground">
            {Math.round(energyLevel * 100)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute left-0 top-0 bottom-0 w-1 transition-all",
        className
      )}
    >
      <div
        className={cn("absolute bottom-0 w-full rounded-full", getColor(energyLevel))}
        style={{ height: `${percentage}%` }}
      />
      {showValue && (
        <span className="absolute -right-6 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {Math.round(energyLevel * 100)}%
        </span>
      )}
    </div>
  );
}

/**
 * EnergyHeatmap displays a full-day view of energy levels.
 */
export function EnergyHeatmap({ className }: { className?: string }) {
  const { data: chronoData, isLoading } = api.chronotype.get.useQuery();

  if (isLoading || !chronoData) {
    return (
      <div className={cn("flex gap-0.5 h-8", className)}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-muted animate-pulse rounded-sm"
          />
        ))}
      </div>
    );
  }

  const { energyCurve, chronotype } = chronoData;

  const chronotypeLabels: Record<string, { name: string; emoji: string }> = {
    LARK: { name: "Alouette", emoji: "🌅" },
    OWL: { name: "Hibou", emoji: "🦉" },
    THIRD_BIRD: { name: "Colibri", emoji: "🐦" },
    UNKNOWN: { name: "Non défini", emoji: "❓" },
  };

  const info = chronotypeLabels[chronotype] || chronotypeLabels.UNKNOWN;

  const getBarColor = (level: number) => {
    if (level >= 1.3) return "bg-green-500";
    if (level >= 1.0) return "bg-emerald-400";
    if (level >= 0.7) return "bg-yellow-400";
    if (level >= 0.5) return "bg-orange-400";
    return "bg-red-400";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          {info.emoji} {info.name}
        </span>
        <span className="text-xs text-muted-foreground">Courbe d'énergie</span>
      </div>
      <div className="flex gap-0.5 h-12 items-end">
        {Array.from({ length: 24 }).map((_, hour) => {
          const level = energyCurve[hour] ?? 1.0;
          const height = (level / 1.5) * 100;
          return (
            <div
              key={hour}
              className="flex-1 flex flex-col items-center group relative"
            >
              <div
                className={cn(
                  "w-full rounded-t-sm transition-all",
                  getBarColor(level)
                )}
                style={{ height: `${height}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground px-2 py-1 rounded text-xs shadow-lg whitespace-nowrap z-10">
                {hour}h: {Math.round(level * 100)}%
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>24h</span>
      </div>
    </div>
  );
}

/**
 * Hook to get energy level for a specific hour.
 */
export function useEnergyLevel(hour: number): number {
  const { data: chronoData } = api.chronotype.get.useQuery();
  return chronoData?.energyCurve[hour] ?? 1.0;
}
