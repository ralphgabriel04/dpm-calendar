"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Heart, Lightbulb, Coffee, Dumbbell, Moon, MessageCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/Button";

interface MoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  energyLevel: number;
  onSaveNote?: (note: string) => void;
}

const moodData = {
  1: {
    emoji: "😴",
    label: "Épuisé",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    advice: [
      {
        icon: Moon,
        title: "Repos prioritaire",
        description: "Ton corps te dit quelque chose. Si possible, fais une sieste de 20 minutes ou va te coucher plus tôt ce soir.",
      },
      {
        icon: Coffee,
        title: "Attention au café",
        description: "Évite le café après 14h pour ne pas perturber ton sommeil. Préfère de l'eau ou une tisane.",
      },
      {
        icon: Lightbulb,
        title: "Tâches légères",
        description: "Concentre-toi sur des tâches administratives simples. Ce n'est pas le moment pour du travail créatif intense.",
      },
    ],
  },
  2: {
    emoji: "😐",
    label: "Fatigué",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    advice: [
      {
        icon: Coffee,
        title: "Pause active",
        description: "Fais une marche de 10 minutes à l'extérieur. L'air frais et le mouvement peuvent booster ton énergie.",
      },
      {
        icon: Dumbbell,
        title: "Mouvement léger",
        description: "Quelques étirements ou une courte séance de respiration peuvent t'aider à te reconcentrer.",
      },
      {
        icon: Lightbulb,
        title: "Une tâche à la fois",
        description: "Évite le multitâche. Choisis une seule tâche et finis-la avant de passer à la suivante.",
      },
    ],
  },
  3: {
    emoji: "🙂",
    label: "Normal",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    advice: [
      {
        icon: Lightbulb,
        title: "Bon moment pour planifier",
        description: "Tu es stable. C'est un bon moment pour organiser ta journée et prioriser tes tâches.",
      },
      {
        icon: Heart,
        title: "Maintiens l'équilibre",
        description: "Continue comme ça ! Prends des pauses régulières pour maintenir ton niveau d'énergie.",
      },
      {
        icon: Dumbbell,
        title: "Booste ton énergie",
        description: "Un peu d'exercice ou une marche rapide pourrait te faire passer au niveau supérieur.",
      },
    ],
  },
  4: {
    emoji: "😊",
    label: "Bien",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    advice: [
      {
        icon: Sparkles,
        title: "Travail créatif",
        description: "C'est le moment idéal pour t'attaquer à des tâches créatives ou complexes.",
      },
      {
        icon: Lightbulb,
        title: "Maximise ta productivité",
        description: "Profite de cet état pour avancer sur tes projets importants. Élimine les distractions.",
      },
      {
        icon: Heart,
        title: "Partage ton énergie",
        description: "Ton énergie positive peut inspirer les autres. C'est un bon moment pour les réunions d'équipe.",
      },
    ],
  },
  5: {
    emoji: "🔥",
    label: "Au top",
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-200 dark:border-violet-800",
    advice: [
      {
        icon: Sparkles,
        title: "Attaque le plus dur",
        description: "C'est le moment parfait pour t'attaquer à ta tâche la plus difficile ou importante de la journée.",
      },
      {
        icon: Lightbulb,
        title: "Résous les problèmes",
        description: "Profite de cette clarté mentale pour résoudre des problèmes complexes ou prendre des décisions importantes.",
      },
      {
        icon: Heart,
        title: "Préserve cette énergie",
        description: "Note ce qui t'a mis dans cet état (sommeil, alimentation, exercice) pour le reproduire.",
      },
    ],
  },
};

const reasonSuggestions = [
  "Bien dormi",
  "Mal dormi",
  "Stressé",
  "Motivé",
  "Exercice ce matin",
  "Fatigue accumulée",
  "Bonne nouvelle",
  "Préoccupé",
];

export function MoodModal({ isOpen, onClose, energyLevel, onSaveNote }: MoodModalProps) {
  const [note, setNote] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNote("");
      setSelectedReasons([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mood = moodData[energyLevel as keyof typeof moodData];
  if (!mood) return null;

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSave = () => {
    const fullNote = [...selectedReasons, note].filter(Boolean).join(", ");
    onSaveNote?.(fullNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl",
          "animate-in fade-in zoom-in-95 duration-200",
          mood.borderColor
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className={cn(
              "h-16 w-16 rounded-2xl flex items-center justify-center text-4xl",
              mood.bgColor
            )}
          >
            {mood.emoji}
          </div>
          <div>
            <h2 className={cn("text-xl font-bold", mood.color)}>
              Tu te sens {mood.label.toLowerCase()}
            </h2>
            <p className="text-sm text-muted-foreground">
              Voici quelques conseils pour toi
            </p>
          </div>
        </div>

        {/* Advice cards */}
        <div className="space-y-3 mb-6">
          {mood.advice.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl",
                mood.bgColor
              )}
            >
              <div className={cn("p-2 rounded-lg bg-background", mood.color)}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Reason section */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Qu'est-ce qui explique cet état ? (optionnel)
            </span>
          </div>

          {/* Quick reason chips */}
          <div className="flex flex-wrap gap-2">
            {reasonSuggestions.map((reason) => (
              <button
                key={reason}
                onClick={() => toggleReason(reason)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  selectedReasons.includes(reason)
                    ? cn(mood.bgColor, mood.color)
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {reason}
              </button>
            ))}
          </div>

          {/* Custom note */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ajoute une note personnelle..."
            className="w-full h-20 px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}
