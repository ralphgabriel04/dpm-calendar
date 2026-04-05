"use client";

import { useMemo, useState, useEffect } from "react";
import { Sparkles, Lightbulb, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SmartTipsCardProps {
  completedTasks: number;
  totalTasks: number;
  meetingsCount: number;
  meetingMinutes: number;
  energyLevel?: number;
  habitsCompleted: number;
  habitsTotal: number;
}

// Productivity tips from books and articles
const productivityTips = [
  {
    tip: "Mangez la grenouille en premier - commencez par la tâche la plus difficile.",
    source: "Eat That Frog - Brian Tracy",
  },
  {
    tip: "Travaillez en blocs de 25 minutes avec 5 minutes de pause (technique Pomodoro).",
    source: "Francesco Cirillo",
  },
  {
    tip: "Planifiez demain ce soir - vous dormirez mieux et serez plus productif.",
    source: "Deep Work - Cal Newport",
  },
  {
    tip: "Limitez vos tâches quotidiennes à 3 priorités principales.",
    source: "The ONE Thing - Gary Keller",
  },
  {
    tip: "Regroupez les tâches similaires pour minimiser le changement de contexte.",
    source: "Make Time - Jake Knapp",
  },
  {
    tip: "Réservez des créneaux de travail profond sans interruption.",
    source: "Deep Work - Cal Newport",
  },
  {
    tip: "Dites non à tout ce qui ne sert pas vos objectifs principaux.",
    source: "Essentialism - Greg McKeown",
  },
  {
    tip: "Utilisez la règle des 2 minutes : si ça prend moins de 2 min, faites-le maintenant.",
    source: "Getting Things Done - David Allen",
  },
  {
    tip: "Visualisez votre journée idéale le matin pour rester concentré.",
    source: "Atomic Habits - James Clear",
  },
  {
    tip: "Prenez des pauses régulières pour maintenir votre énergie cognitive.",
    source: "When - Daniel Pink",
  },
  {
    tip: "Éliminez les distractions numériques pendant vos sessions de focus.",
    source: "Digital Minimalism - Cal Newport",
  },
  {
    tip: "Célébrez vos petites victoires pour maintenir la motivation.",
    source: "The Progress Principle - Teresa Amabile",
  },
  {
    tip: "Travaillez sur vos tâches créatives le matin quand votre énergie est haute.",
    source: "When - Daniel Pink",
  },
  {
    tip: "Décomposez les gros projets en petites tâches actionnables.",
    source: "Getting Things Done - David Allen",
  },
  {
    tip: "Faites une revue hebdomadaire de vos objectifs et progrès.",
    source: "The 7 Habits - Stephen Covey",
  },
];

export function SmartTipsCard({
  completedTasks,
  totalTasks,
  meetingsCount,
  meetingMinutes,
  energyLevel,
  habitsCompleted,
  habitsTotal,
}: SmartTipsCardProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showProductivityTip, setShowProductivityTip] = useState(false);

  // Rotate productivity tips every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (showProductivityTip) {
        setCurrentTipIndex((prev) => (prev + 1) % productivityTips.length);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [showProductivityTip]);

  // Generate smart tip based on analytics
  const smartTip = useMemo(() => {
    const tips: { message: string; priority: number }[] = [];

    // Energy-based tips
    if (energyLevel === 1) {
      tips.push({
        message: "Tu sembles fatigué. Prends une pause, fais une marche ou une sieste de 20 min. Ta productivité sera meilleure après.",
        priority: 10,
      });
    } else if (energyLevel === 2) {
      tips.push({
        message: "Ton énergie est basse. Essaie de commencer par une petite tâche facile pour te mettre en mouvement.",
        priority: 8,
      });
    } else if (energyLevel === 5) {
      tips.push({
        message: "Tu es au top de ta forme ! C'est le moment idéal pour t'attaquer à ta tâche la plus complexe.",
        priority: 7,
      });
    }

    // Meeting-based tips
    if (meetingsCount >= 4) {
      tips.push({
        message: `Tu as ${meetingsCount} réunions aujourd'hui (${Math.round(meetingMinutes / 60)}h). Protège des créneaux de focus entre les meetings.`,
        priority: 9,
      });
    } else if (meetingsCount === 0 && totalTasks > 0) {
      tips.push({
        message: "Pas de réunions aujourd'hui ! C'est parfait pour du travail en profondeur. Profites-en !",
        priority: 6,
      });
    }

    // Task completion tips
    if (completedTasks === 0 && totalTasks > 0) {
      tips.push({
        message: "Commence par ta tâche la plus importante. Une fois terminée, tu auras un élan de motivation !",
        priority: 5,
      });
    } else if (completedTasks > 0 && completedTasks < totalTasks) {
      const remaining = totalTasks - completedTasks;
      tips.push({
        message: `Super ! Tu as complété ${completedTasks} tâche${completedTasks > 1 ? "s" : ""}. Plus que ${remaining} à faire !`,
        priority: 4,
      });
    } else if (completedTasks === totalTasks && totalTasks > 0) {
      tips.push({
        message: "Félicitations ! Tu as complété toutes tes tâches du jour. Prends le temps de célébrer !",
        priority: 10,
      });
    }

    // Habits tips
    if (habitsTotal > 0 && habitsCompleted === 0) {
      tips.push({
        message: "N'oublie pas tes habitudes ! Même une petite action compte pour maintenir ta série.",
        priority: 3,
      });
    } else if (habitsCompleted === habitsTotal && habitsTotal > 0) {
      tips.push({
        message: `Bravo ! Tu as complété toutes tes ${habitsTotal} habitudes du jour !`,
        priority: 6,
      });
    }

    // Workload tips
    const totalWorkMinutes = meetingMinutes + (totalTasks - completedTasks) * 30;
    if (totalWorkMinutes > 480) {
      tips.push({
        message: "Ta journée semble chargée. Identifie ce qui peut être reporté à demain.",
        priority: 7,
      });
    }

    // Sort by priority and get highest
    tips.sort((a, b) => b.priority - a.priority);
    return tips[0]?.message || "Bonne journée ! Concentre-toi sur ce qui compte vraiment pour toi.";
  }, [completedTasks, totalTasks, meetingsCount, meetingMinutes, energyLevel, habitsCompleted, habitsTotal]);

  const currentProductivityTip = productivityTips[currentTipIndex];

  return (
    <div className="space-y-3">
      {/* Smart Tip */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/10 to-violet-500/10 p-4 md:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Conseil personnalisé</span>
        </div>
        <p className="text-sm text-muted-foreground">{smartTip}</p>
      </div>

      {/* Productivity Tips */}
      <div className="rounded-xl border bg-card p-4 md:p-5">
        <button
          onClick={() => setShowProductivityTip(!showProductivityTip)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Astuce productivité</span>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showProductivityTip && "rotate-90"
            )}
          />
        </button>

        {showProductivityTip && (
          <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <p className="text-sm text-foreground">
              "{currentProductivityTip.tip}"
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>{currentProductivityTip.source}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTipIndex((prev) =>
                      prev === 0 ? productivityTips.length - 1 : prev - 1
                    );
                  }}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="Conseil précédent"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                  {currentTipIndex + 1}/{productivityTips.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTipIndex((prev) => (prev + 1) % productivityTips.length);
                  }}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="Conseil suivant"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
