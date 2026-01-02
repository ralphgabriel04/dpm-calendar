"use client";

import { useState } from "react";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { trpc as api } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Lightbulb,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RecapType = "DAILY" | "WEEKLY" | "MONTHLY";

interface RecapWidgetProps {
  type?: RecapType;
  date?: Date;
  className?: string;
  compact?: boolean;
}

export function RecapWidget({
  type = "DAILY",
  date = new Date(),
  className,
  compact = false,
}: RecapWidgetProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  const utils = api.useUtils();

  const { data: recap, isLoading } = api.recap.get.useQuery(
    { type, date },
    { enabled: expanded }
  );

  const { data: comparison } = api.recap.compare.useQuery(
    { type, currentDate: date },
    { enabled: expanded }
  );

  const updateMutation = api.recap.update.useMutation({
    onSuccess: () => {
      utils.recap.get.invalidate({ type, date });
      setShowNotes(false);
    },
  });

  const handleSaveNotes = () => {
    if (!recap) return;
    updateMutation.mutate({
      id: recap.id,
      userNotes: notes,
      rating: rating ?? undefined,
    });
  };

  const getTypeLabel = () => {
    switch (type) {
      case "DAILY":
        return `Resume du ${format(date, "d MMMM", { locale: fr })}`;
      case "WEEKLY":
        return `Semaine du ${format(startOfWeek(date, { weekStartsOn: 1 }), "d MMM", { locale: fr })}`;
      case "MONTHLY":
        return format(startOfMonth(date), "MMMM yyyy", { locale: fr });
    }
  };

  const getPercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const summary = recap?.summary as {
    eventsCount?: number;
    tasksCompleted?: number;
    tasksPending?: number;
    habitsCompleted?: number;
    habitCompletionRate?: number;
  } | undefined;

  const prevSummary = comparison?.previous?.summary as typeof summary | undefined;

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br from-background to-muted/20",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="font-semibold">{getTypeLabel()}</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : recap ? (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={<Calendar className="h-4 w-4" />}
                  label="Evenements"
                  value={summary?.eventsCount ?? 0}
                  previousValue={prevSummary?.eventsCount}
                />
                <StatCard
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Taches faites"
                  value={summary?.tasksCompleted ?? 0}
                  previousValue={prevSummary?.tasksCompleted}
                />
                <StatCard
                  icon={<AlertCircle className="h-4 w-4" />}
                  label="En attente"
                  value={summary?.tasksPending ?? 0}
                  previousValue={prevSummary?.tasksPending}
                  inverseColor
                />
                <StatCard
                  icon={<Star className="h-4 w-4" />}
                  label="Habitudes"
                  value={`${Math.round(summary?.habitCompletionRate ?? 0)}%`}
                  previousValue={prevSummary?.habitCompletionRate ? `${Math.round(prevSummary.habitCompletionRate)}%` : undefined}
                />
              </div>

              {/* Highlights */}
              {recap.highlights && recap.highlights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Points forts
                  </h4>
                  <ul className="space-y-1">
                    {recap.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-green-500">+</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {recap.improvements && recap.improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    A ameliorer
                  </h4>
                  <ul className="space-y-1">
                    {recap.improvements.map((imp, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-yellow-500">!</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Insights */}
              {recap.insights && recap.insights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Insights
                  </h4>
                  <ul className="space-y-1">
                    {recap.insights.map((ins, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary">*</span>
                        {ins}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* User rating */}
              {recap.rating && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Votre note :</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-4 w-4",
                          s <= recap.rating!
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* User notes */}
              {recap.userNotes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm italic text-muted-foreground">
                    "{recap.userNotes}"
                  </p>
                </div>
              )}

              {/* Add notes button */}
              {!showNotes && !recap.userNotes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNotes(true);
                    setNotes(recap.userNotes || "");
                    setRating(recap.rating);
                  }}
                  className="w-full"
                >
                  Ajouter des notes
                </Button>
              )}

              {/* Notes form */}
              {showNotes && (
                <div className="space-y-3 p-3 border rounded-lg">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Votre ressenti
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={cn(
                              "h-6 w-6",
                              rating && s <= rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted hover:text-yellow-300"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes personnelles sur cette periode..."
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={updateMutation.isPending}
                    >
                      Enregistrer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowNotes(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Pas de donnees pour cette periode</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Stat card sub-component
function StatCard({
  icon,
  label,
  value,
  previousValue,
  inverseColor = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  previousValue?: number | string;
  inverseColor?: boolean;
}) {
  const currentNum = typeof value === "string" ? parseFloat(value) : value;
  const prevNum = typeof previousValue === "string" ? parseFloat(previousValue) : previousValue;

  let change: "up" | "down" | "same" | null = null;
  if (prevNum !== undefined && !isNaN(prevNum)) {
    if (currentNum > prevNum) change = "up";
    else if (currentNum < prevNum) change = "down";
    else change = "same";
  }

  const isPositive = inverseColor
    ? change === "down"
    : change === "up";
  const isNegative = inverseColor
    ? change === "up"
    : change === "down";

  return (
    <div className="p-3 rounded-lg bg-card border">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">{value}</span>
        {change && change !== "same" && (
          <span
            className={cn(
              "flex items-center text-xs",
              isPositive && "text-green-500",
              isNegative && "text-red-500"
            )}
          >
            {change === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
