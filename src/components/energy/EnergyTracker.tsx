"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { trpc as api } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import { Textarea } from "@/shared/components/ui/Textarea";
import {
  Battery,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Smile,
  Meh,
  Frown,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sun,
  Moon,
  Sunset,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface EnergyTrackerProps {
  className?: string;
  compact?: boolean;
}

const ENERGY_LEVELS = [
  { value: 1, icon: BatteryWarning, label: "Epuise", color: "text-red-500" },
  { value: 2, icon: BatteryLow, label: "Fatigue", color: "text-orange-500" },
  { value: 3, icon: BatteryMedium, label: "Normal", color: "text-yellow-500" },
  { value: 4, icon: Battery, label: "Bien", color: "text-green-500" },
  { value: 5, icon: BatteryFull, label: "Plein d'energie", color: "text-emerald-500" },
];

const MOOD_LEVELS = [
  { value: 1, icon: Frown, label: "Mauvaise", color: "text-red-500" },
  { value: 2, icon: Frown, label: "Basse", color: "text-orange-500" },
  { value: 3, icon: Meh, label: "Neutre", color: "text-yellow-500" },
  { value: 4, icon: Smile, label: "Bonne", color: "text-green-500" },
  { value: 5, icon: Smile, label: "Excellente", color: "text-emerald-500" },
];

export function EnergyTracker({ className, compact = false }: EnergyTrackerProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [energy, setEnergy] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const utils = api.useUtils();

  const { data: todayLogs, isLoading: loadingToday } = api.energy.getToday.useQuery(undefined, {
    enabled: expanded,
  });

  const { data: weeklyAvg, isLoading: loadingWeekly } = api.energy.getWeeklyAverage.useQuery(undefined, {
    enabled: expanded,
  });

  const { data: patterns } = api.energy.getPatterns.useQuery({ days: 30 }, {
    enabled: expanded,
  });

  const todayLog = useMemo(() => {
    if (!todayLogs || todayLogs.length === 0) return null;
    return todayLogs[0]; // Most recent log today
  }, [todayLogs]);

  const logMutation = api.energy.log.useMutation({
    onSuccess: () => {
      utils.energy.getToday.invalidate();
      utils.energy.getWeeklyAverage.invalidate();
      setShowForm(false);
      setEnergy(null);
      setMood(null);
      setNotes("");
    },
  });

  const handleSubmit = () => {
    if (energy === null) return;
    logMutation.mutate({
      energyLevel: energy,
      mood: mood ?? undefined,
      notes: notes.trim() || undefined,
    });
  };

  const getTimeOfDayIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return Sun;
    if (hour < 18) return Sunset;
    return Moon;
  };

  const TimeIcon = getTimeOfDayIcon();

  const getTrendIcon = (trend: "improving" | "declining" | "stable") => {
    if (trend === "improving") return { icon: TrendingUp, color: "text-green-500" };
    if (trend === "declining") return { icon: TrendingDown, color: "text-red-500" };
    return { icon: Minus, color: "text-muted-foreground" };
  };

  return (
    <div className={cn("rounded-xl border bg-gradient-to-br from-amber-500/5 to-orange-500/10", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <span className="font-semibold">Energie & Humeur</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {loadingToday ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : todayLog ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-card border">
                <TimeIcon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const level = ENERGY_LEVELS.find((l) => l.value === todayLog.energyLevel);
                        const Icon = level?.icon || Battery;
                        return (
                          <>
                            <Icon className={cn("h-5 w-5", level?.color)} />
                            <span className="text-sm">{level?.label}</span>
                          </>
                        );
                      })()}
                    </div>
                    {todayLog.mood && (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const level = MOOD_LEVELS.find((l) => l.value === todayLog.mood);
                          const Icon = level?.icon || Meh;
                          return (
                            <>
                              <Icon className={cn("h-5 w-5", level?.color)} />
                              <span className="text-sm">{level?.label}</span>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  {todayLog.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{todayLog.notes}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(todayLog.timestamp), "HH:mm", { locale: fr })}
                </span>
              </div>

              {weeklyAvg && weeklyAvg.avgEnergy && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-card border">
                    <div className="text-xs text-muted-foreground mb-1">Energie moyenne</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {weeklyAvg.avgEnergy.toFixed(1)}/5
                      </span>
                      {patterns && (() => {
                        const trendInfo = getTrendIcon(patterns.trend);
                        const TrendIcon = trendInfo.icon;
                        return <TrendIcon className={cn("h-4 w-4", trendInfo.color)} />;
                      })()}
                    </div>
                  </div>
                  {weeklyAvg.avgMood && (
                    <div className="p-3 rounded-lg bg-card border">
                      <div className="text-xs text-muted-foreground mb-1">Humeur moyenne</div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {weeklyAvg.avgMood.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {patterns && patterns.bestTimeOfDay && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Votre meilleur moment: <strong>{patterns.bestTimeOfDay}</strong>
                </div>
              )}
            </div>
          ) : showForm ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Niveau d'energie</label>
                <div className="flex gap-2">
                  {ENERGY_LEVELS.map((level) => {
                    const Icon = level.icon;
                    return (
                      <button
                        key={level.value}
                        onClick={() => setEnergy(level.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                          energy === level.value
                            ? "border-primary bg-primary/10"
                            : "hover:border-muted-foreground/50"
                        )}
                      >
                        <Icon className={cn("h-6 w-6", level.color)} />
                        <span className="text-xs">{level.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Humeur (optionnel)</label>
                <div className="flex gap-2">
                  {MOOD_LEVELS.map((level) => {
                    const Icon = level.icon;
                    return (
                      <button
                        key={level.value}
                        onClick={() => setMood(level.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                          mood === level.value
                            ? "border-primary bg-primary/10"
                            : "hover:border-muted-foreground/50"
                        )}
                      >
                        <Icon className={cn("h-6 w-6", level.color)} />
                        <span className="text-xs">{level.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Notes (optionnel)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Comment vous sentez-vous?"
                  className="min-h-[60px]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={energy === null || logMutation.isPending}
                  className="flex-1"
                >
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowForm(true)}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              Enregistrer mon energie
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
