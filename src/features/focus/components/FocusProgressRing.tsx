"use client";

import { Flame, Target } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { trpc } from "@/infrastructure/trpc/client";

interface FocusProgressRingProps {
  className?: string;
  size?: number;
}

export function FocusProgressRing({
  className,
  size = 128,
}: FocusProgressRingProps) {
  const { data, isLoading } = trpc.focusSession.todayStats.useQuery();

  const totalMins = data?.totalMins ?? 0;
  const goalMins = data?.goalMins ?? 120;
  const streak = data?.streak ?? 0;
  const progressPct = data?.progressPct ?? 0;

  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(100, progressPct) / 100);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 flex flex-col items-center gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-semibold self-start">
        <Target className="h-4 w-4 text-primary" />
        Focus aujourd&apos;hui
      </div>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isLoading ? (
            <span className="text-xs text-muted-foreground">...</span>
          ) : (
            <>
              <span className="text-2xl font-bold">{totalMins}</span>
              <span className="text-xs text-muted-foreground">
                / {goalMins} min
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm">
        <Flame
          className={cn(
            "h-4 w-4",
            streak > 0 ? "text-orange-500" : "text-muted-foreground"
          )}
        />
        <span className="font-medium">
          {streak === 1 ? "Série de 1 jour" : `Série de ${streak} jours`}
        </span>
      </div>
    </div>
  );
}
