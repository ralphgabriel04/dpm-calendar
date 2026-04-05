"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { trpc as api } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import {
  Sparkles,
  Clock,
  Calendar,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SlotSuggestionsProps {
  onSelectSlot?: (slot: { startAt: Date; endAt: Date }) => void;
  taskId?: string;
  className?: string;
}

export function SlotSuggestions({
  onSelectSlot,
  taskId,
  className,
}: SlotSuggestionsProps) {
  const [duration, setDuration] = useState(60);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [type, setType] = useState<"event" | "task" | "focus">("task");
  const [expanded, setExpanded] = useState(true);
  const [searchDays, setSearchDays] = useState(7);

  const { data: slots, isLoading, refetch } = api.suggestion.getOptimalSlots.useQuery(
    { duration, priority, type, searchDays },
    {
      enabled: expanded,
      // Auto-refresh every 30 seconds when expanded
      refetchInterval: expanded ? 30000 : false,
      // Refetch on window focus
      refetchOnWindowFocus: true,
    }
  );

  const handleSelectSlot = (slot: { startAt: Date; endAt: Date }) => {
    onSelectSlot?.(slot);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-orange-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "Optimal";
    if (score >= 50) return "Bon";
    return "Acceptable";
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">Suggestions de créneaux</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Durée
              </label>
              <Select
                value={duration.toString()}
                onValueChange={(v) => setDuration(parseInt(v, 10))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 heure</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2 heures</SelectItem>
                  <SelectItem value="180">3 heures</SelectItem>
                  <SelectItem value="240">4 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Type
              </label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as typeof type)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Tâche</SelectItem>
                  <SelectItem value="focus">Focus</SelectItem>
                  <SelectItem value="event">Événement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Priorité
              </label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as typeof priority)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Basse</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Haute</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Suggestions list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : slots && slots.length > 0 ? (
            <div className="space-y-2">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border bg-card",
                    "hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                  )}
                  onClick={() => handleSelectSlot({ startAt: new Date(slot.startAt), endAt: new Date(slot.endAt) })}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full",
                        slot.score >= 70 ? "bg-green-100 dark:bg-green-900/30" :
                        slot.score >= 50 ? "bg-yellow-100 dark:bg-yellow-900/30" :
                        "bg-orange-100 dark:bg-orange-900/30"
                      )}
                    >
                      {index === 0 ? (
                        <Zap className={cn("h-5 w-5", getScoreColor(slot.score))} />
                      ) : (
                        <Clock className={cn("h-5 w-5", getScoreColor(slot.score))} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{slot.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {slot.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        slot.score >= 70 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        slot.score >= 50 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      )}
                    >
                      {getScoreLabel(slot.score)}
                    </span>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun créneau disponible</p>
              <p className="text-xs">Essayez une durée plus courte</p>
            </div>
          )}

          {/* More suggestions button */}
          {searchDays < 14 && slots && slots.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchDays(14)}
              className="w-full"
              disabled={isLoading}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Plus de suggestions (2 semaines)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
