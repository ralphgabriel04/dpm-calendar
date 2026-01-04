"use client";

import { useState, useRef, useEffect } from "react";
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
  Lightbulb,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Mic,
  MicOff,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RecapType = "DAILY" | "WEEKLY" | "MONTHLY";

// Mood emojis with labels
const MOOD_OPTIONS = [
  { value: 1, emoji: "😢", label: "Tres mauvais" },
  { value: 2, emoji: "😕", label: "Mauvais" },
  { value: 3, emoji: "😐", label: "Moyen" },
  { value: 4, emoji: "🙂", label: "Bon" },
  { value: 5, emoji: "😊", label: "Excellent" },
];

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
  const [notes, setNotes] = useState<string[]>([""]);
  const [rating, setRating] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

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

  // Initialize speech recognition
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = typeof window !== "undefined" ? (window as any) : null;
    if (win && (win.SpeechRecognition || win.webkitSpeechRecognition)) {
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "fr-FR";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((result: any) => result[0].transcript)
          .join("");

        setNotes((prev) => {
          const newNotes = [...prev];
          newNotes[currentNoteIndex] = transcript;
          return newNotes;
        });
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentNoteIndex]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est pas supportee par votre navigateur.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSaveNotes = () => {
    if (!recap) return;
    const combinedNotes = notes.filter((n) => n.trim()).join("\n\n---\n\n");
    updateMutation.mutate({
      id: recap.id,
      userNotes: combinedNotes,
      rating: rating ?? undefined,
    });
  };

  const addNote = () => {
    setNotes((prev) => [...prev, ""]);
    setCurrentNoteIndex(notes.length);
  };

  const removeNote = (index: number) => {
    if (notes.length > 1) {
      setNotes((prev) => prev.filter((_, i) => i !== index));
      if (currentNoteIndex >= index && currentNoteIndex > 0) {
        setCurrentNoteIndex(currentNoteIndex - 1);
      }
    }
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
        "rounded-xl border bg-gradient-to-br from-background to-muted/20 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="font-semibold truncate">{getTypeLabel()}</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
              <div className="grid grid-cols-2 gap-3">
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
                  icon={<span className="text-sm">🎯</span>}
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
                        <span className="text-green-500 flex-shrink-0">+</span>
                        <span className="break-words">{h}</span>
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
                        <span className="text-yellow-500 flex-shrink-0">!</span>
                        <span className="break-words">{imp}</span>
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
                        <span className="text-primary flex-shrink-0">*</span>
                        <span className="break-words">{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* User mood/rating display */}
              {recap.rating && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Votre humeur :</span>
                  <span className="text-2xl">
                    {MOOD_OPTIONS.find((m) => m.value === recap.rating)?.emoji || "😐"}
                  </span>
                </div>
              )}

              {/* User notes */}
              {recap.userNotes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {recap.userNotes}
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
                    setNotes(recap.userNotes ? recap.userNotes.split("\n\n---\n\n") : [""]);
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
                  {/* Mood selector */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Comment vous sentez-vous ?
                    </label>
                    <div className="flex gap-2 justify-center">
                      {MOOD_OPTIONS.map((mood) => (
                        <button
                          key={mood.value}
                          type="button"
                          onClick={() => setRating(mood.value)}
                          className={cn(
                            "p-2 rounded-lg transition-all hover:scale-110",
                            rating === mood.value
                              ? "bg-primary/20 ring-2 ring-primary"
                              : "hover:bg-muted"
                          )}
                          title={mood.label}
                        >
                          <span className="text-2xl">{mood.emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multiple notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>Notes</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addNote}
                        className="h-6 px-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                    </label>
                    {notes.map((note, index) => (
                      <div key={index} className="relative">
                        <div className="flex gap-2">
                          <Textarea
                            value={note}
                            onChange={(e) => {
                              setNotes((prev) => {
                                const newNotes = [...prev];
                                newNotes[index] = e.target.value;
                                return newNotes;
                              });
                            }}
                            onFocus={() => setCurrentNoteIndex(index)}
                            placeholder={`Note ${index + 1}...`}
                            className="min-h-[60px] flex-1"
                          />
                          <div className="flex flex-col gap-1">
                            {/* Voice dictation button */}
                            <Button
                              type="button"
                              variant={isRecording && currentNoteIndex === index ? "destructive" : "outline"}
                              size="icon"
                              onClick={() => {
                                setCurrentNoteIndex(index);
                                toggleRecording();
                              }}
                              className="h-8 w-8"
                              title={isRecording ? "Arreter l'enregistrement" : "Dicter"}
                            >
                              {isRecording && currentNoteIndex === index ? (
                                <MicOff className="h-4 w-4" />
                              ) : (
                                <Mic className="h-4 w-4" />
                              )}
                            </Button>
                            {notes.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeNote(index)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

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
        <span className="text-xs truncate">{label}</span>
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
